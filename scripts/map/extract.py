#!/usr/bin/env python3
"""Карта края, шаг 1: вид сверху из копии мира в кэш.

  python3 scripts/map/extract.py [--backup ПАПКА] [--force]

Читает region-файлы верхнего мира из самой свежей полной копии (../backups/full-*/world/…/region/*.mca),
только чтение. Для каждого региона в круге карты пишет в .cache/map/r.X.Z.npz:
  blk  uint16  верхний блок столбца (индекс в .cache/map/blocks.json)
  h    int16   высота верхнего блока (по карте высот MOTION_BLOCKING: листва и вода считаются)
  wd   uint8   глубина воды над дном (0 — суши)
  bio  uint8   биом у верхнего блока (индекс в .cache/map/biomes.json)
  has  bool    столбец есть в мире (чанк сгенерирован)
Регион, у которого кэш новее файла, пропускается (--force — пересчитать всё).

Тяжёлое: запускать под замком сборки, по одному региону за раз:
  flock /tmp/id-build.lock python3 scripts/map/extract.py
Сайт этот скрипт не вызывает: в CI копии мира нет. Результат рендерит scripts/map/render.py.
"""
import argparse
import glob
import json
import math
import os
import sys
import time
import zlib

import numpy as np
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
ROOT = os.path.dirname(SITE)
CACHE = os.path.join(SITE, ".cache", "map")
CONFIG = os.path.join(ROOT, "plugin-darklands", "src", "main", "resources", "config.yml")
sys.path.insert(0, os.path.join(ROOT, "tools"))
from terrain import read_nbt  # noqa: E402

MIN_Y = -64
WATERY = {"water", "kelp", "kelp_plant", "seagrass", "tall_seagrass", "bubble_column"}


class Index:
    """Список имён в JSON: индекс имени не меняется между запусками."""

    def __init__(self, path):
        self.path = path
        self.names = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else []
        self.pos = {n: i for i, n in enumerate(self.names)}

    def __call__(self, name):
        i = self.pos.get(name)
        if i is None:
            i = self.pos[name] = len(self.names)
            self.names.append(name)
        return i

    def save(self):
        tmp = self.path + ".tmp"
        json.dump(self.names, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        os.replace(tmp, self.path)


def unpack_heightmap(longs):
    a = np.array(longs, dtype=np.int64).view(np.uint64)
    shifts = (np.arange(7, dtype=np.uint64) * np.uint64(9))
    vals = ((a[:, None] >> shifts[None, :]) & np.uint64(511)).reshape(-1)[:256]
    return vals.astype(np.int16)


def lookup(data, n_pal, idx, min_bits):
    """Значения упакованного массива палитры по индексам idx (без переноса через границу long)."""
    if n_pal <= 1 or not data:
        return np.zeros(len(idx), dtype=np.int64)
    bits = max(min_bits, (n_pal - 1).bit_length())
    per = 64 // bits
    arr = np.array(data, dtype=np.int64).view(np.uint64)
    li = idx // per
    off = ((idx % per) * bits).astype(np.uint64)
    li = np.clip(li, 0, len(arr) - 1)
    return ((arr[li] >> off) & np.uint64((1 << bits) - 1)).astype(np.int64)


def region_chunks(path):
    raw = open(path, "rb").read()
    for i in range(1024):
        off = int.from_bytes(raw[i * 4:i * 4 + 3], "big")
        if off == 0:
            continue
        p = off * 4096
        length = int.from_bytes(raw[p:p + 4], "big")
        comp = raw[p + 4]
        body = raw[p + 5:p + 4 + length]
        try:
            if comp == 2:
                body = zlib.decompress(body)
            elif comp == 1:
                import gzip
                body = gzip.decompress(body)
            else:
                continue
            yield read_nbt(body)
        except Exception as e:  # битый чанк — просто пропуск
            print(f"  чанк {i}: {e}", file=sys.stderr)


def extract_region(path, rx, rz, blocks, biomes):
    blk = np.zeros((512, 512), dtype=np.uint16)
    h = np.full((512, 512), -64, dtype=np.int16)
    wd = np.zeros((512, 512), dtype=np.uint8)
    bio = np.zeros((512, 512), dtype=np.uint8)
    has = np.zeros((512, 512), dtype=bool)
    lx = np.tile(np.arange(16), 16)
    lz = np.repeat(np.arange(16), 16)
    for c in region_chunks(path):
        if not str(c.get("Status", "")).endswith("full"):
            continue
        hm = c.get("Heightmaps") or {}
        if "MOTION_BLOCKING" not in hm or "OCEAN_FLOOR" not in hm:
            continue
        mb = unpack_heightmap(hm["MOTION_BLOCKING"])
        of = unpack_heightmap(hm["OCEAN_FLOOR"])
        top = mb.astype(np.int64) - 1 + MIN_Y  # y верхнего блока
        sections = {s.get("Y"): s for s in c.get("sections", []) if "Y" in s}
        names = np.zeros(256, dtype=np.int64)
        bnames = np.zeros(256, dtype=np.int64)
        sy = top >> 4
        for y_sec in np.unique(sy):
            sel = np.nonzero(sy == y_sec)[0]
            s = sections.get(int(y_sec))
            if s is None:
                names[sel] = blocks("air")
                continue
            bs = s.get("block_states") or {}
            pal = bs.get("palette") or [{"Name": "minecraft:air"}]
            ly = top[sel] & 15
            idx = ly * 256 + lz[sel] * 16 + lx[sel]
            vals = lookup(bs.get("data"), len(pal), idx, 4)
            ids = []
            for p in pal:
                n = p.get("Name", "minecraft:air").split(":")[-1]
                props = p.get("Properties") or {}
                if n not in WATERY and props.get("waterlogged") == "true":
                    n = "water"
                ids.append(blocks(n))
            ids = np.array(ids, dtype=np.int64)
            names[sel] = ids[np.clip(vals, 0, len(ids) - 1)]
            bm = s.get("biomes") or {}
            bpal = bm.get("palette") or ["minecraft:plains"]
            bidx = ((ly >> 2) * 16 + (lz[sel] >> 2) * 4 + (lx[sel] >> 2))
            bv = lookup(bm.get("data"), len(bpal), bidx, 1)
            bids = np.array([biomes(b) for b in bpal], dtype=np.int64)
            bnames[sel] = bids[np.clip(bv, 0, len(bids) - 1)]
        cx, cz = c["xPos"] - rx * 32, c["zPos"] - rz * 32
        if not (0 <= cx < 32 and 0 <= cz < 32):
            continue
        ys, xs = slice(cz * 16, cz * 16 + 16), slice(cx * 16, cx * 16 + 16)
        blk[ys, xs] = names.reshape(16, 16)
        h[ys, xs] = top.reshape(16, 16)
        wd[ys, xs] = np.clip(mb - of, 0, 255).reshape(16, 16)
        bio[ys, xs] = np.clip(bnames, 0, 255).reshape(16, 16)
        has[ys, xs] = mb.reshape(16, 16) > 0
    return blk, h, wd, bio, has


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backup", default=None)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    backup = a.backup or sorted(glob.glob(os.path.join(ROOT, "backups", "full-*")))[-1]
    rdir = os.path.join(backup, "world", "dimensions", "minecraft", "overworld", "region")
    cfg = yaml.safe_load(open(CONFIG, encoding="utf-8"))
    cx, cz = float(cfg["center-x"]), float(cfg["center-z"])
    radius = float(cfg["border"]["radius"]) + 64
    os.makedirs(CACHE, exist_ok=True)
    blocks = Index(os.path.join(CACHE, "blocks.json"))
    biomes = Index(os.path.join(CACHE, "biomes.json"))
    todo = []
    for f in sorted(glob.glob(os.path.join(rdir, "r.*.*.mca"))):
        _, sx, sz, _ = os.path.basename(f).split(".")
        rx, rz = int(sx), int(sz)
        # ближайшая к центру точка региона в круге карты
        nx = min(max(cx, rx * 512), rx * 512 + 511)
        nz = min(max(cz, rz * 512), rz * 512 + 511)
        if math.hypot(nx - cx, nz - cz) > radius:
            continue
        todo.append((f, rx, rz))
    print(f"копия: {os.path.relpath(backup, ROOT)}, регионов в круге: {len(todo)}")
    t0 = time.time()
    for i, (f, rx, rz) in enumerate(todo, 1):
        out = os.path.join(CACHE, f"r.{rx}.{rz}.npz")
        if not a.force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
            continue
        t = time.time()
        blk, h, wd, bio, has = extract_region(f, rx, rz, blocks, biomes)
        np.savez_compressed(out + ".tmp.npz", blk=blk, h=h, wd=wd, bio=bio, has=has)
        os.replace(out + ".tmp.npz", out)
        blocks.save()
        biomes.save()
        print(f"[{i}/{len(todo)}] r.{rx}.{rz}: {has.mean() * 100:.0f}% столбцов, {time.time() - t:.1f} с", flush=True)
    json.dump({"backup": os.path.basename(backup), "center": [cx, cz]},
              open(os.path.join(CACHE, "source.json"), "w", encoding="utf-8"))
    print(f"готово за {time.time() - t0:.0f} с; блоков: {len(blocks.names)}, биомов: {len(biomes.names)}")


if __name__ == "__main__":
    main()
