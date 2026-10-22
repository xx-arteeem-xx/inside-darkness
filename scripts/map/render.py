#!/usr/bin/env python3
"""Карта края, шаг 2: стилизованная пиксельная карта из кэша scripts/map/extract.py.

  python3 scripts/map/render.py            плитки, обзор и метки
  python3 scripts/map/render.py --markers  только метки (src/data/map.json) — после правки мест в config.yml

Пишет:
  public/map/0.webp            обзор, 1 точка = 4 блока (он же картинка на главной)
  public/map/1/<x>-<y>.webp    1 точка = 2 блока, плитки 512×512
  public/map/2/<x>-<y>.webp    1 точка = 1 блок, плитки 512×512
  src/data/map.json            размер карты, уровни, линия Стены, метки

Стиль: цвет блока сверху, тень по соседу с севера (как на карте в самой игре) и мягкий рельеф,
вода по глубине с шахматным переходом, общая палитра края. Тёмные земли за линией Стены темнеют с глубиной,
у края мира карту съедает тьма (упорядоченный дизеринг). Линию Стены рисует сам вьювер поверх (SVG).

Метки — только общеизвестные места из config.yml и generated.json: поселения, ямские станции, угодья,
подземелья, таверны и ночлег, ристалище. Никаких игроков, личных открытий и тайных мест; в map.json —
доли размера карты, а не мировые координаты. Картинка — вид сверху всего, что построено: когда в мире
появятся укрытия, которые нельзя показывать, их место нужно закрасить здесь (MASKS).
"""
import argparse
import json
import math
import os
import sys

import numpy as np
import yaml
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
ROOT = os.path.dirname(SITE)
CACHE = os.path.join(SITE, ".cache", "map")
OUT = os.path.join(SITE, "public", "map")
DATA = os.path.join(SITE, "src", "data", "map.json")
GEN = os.path.join(SITE, "src", "data", "generated.json")
CONFIG = os.path.join(ROOT, "plugin-darklands", "src", "main", "resources", "config.yml")

SIZE = 3072  # сторона карты в блоках: круг края (радиус границы мира) с запасом
TILE = 512
PREVIEW = False  # --preview: только обзор, для подбора стиля
COLORS = 72  # цветов в общей палитре
# места, которые нельзя показывать сверху: (x, z, радиус в блоках) — закрашиваются окружающей тьмой
MASKS = []

# ——— цвета ———————————————————————————————————————————————————————————————————————————————————————

DYE = {
    "white": (214, 212, 204), "orange": (196, 118, 52), "magenta": (160, 78, 168), "light_blue": (96, 140, 190),
    "yellow": (206, 180, 60), "lime": (118, 170, 46), "pink": (210, 130, 150), "gray": (72, 72, 76),
    "light_gray": (142, 142, 138), "cyan": (66, 116, 132), "purple": (112, 62, 150), "blue": (52, 70, 150),
    "brown": (104, 74, 50), "green": (84, 104, 44), "red": (146, 52, 46), "black": (32, 30, 34),
}
TERRACOTTA = {
    "white": (206, 176, 160), "orange": (160, 84, 40), "magenta": (148, 88, 108), "light_blue": (112, 108, 136),
    "yellow": (184, 132, 38), "lime": (102, 116, 54), "pink": (160, 78, 78), "gray": (58, 44, 38),
    "light_gray": (134, 106, 98), "cyan": (86, 92, 92), "purple": (116, 70, 86), "blue": (74, 60, 90),
    "brown": (78, 52, 36), "green": (76, 82, 44), "red": (142, 60, 46), "black": (38, 24, 18),
}
WOOD = {  # доски, срезы брёвен сверху
    "pale_oak": (214, 204, 198), "dark_oak": (70, 46, 24), "oak": (160, 128, 78), "spruce": (110, 80, 46),
    "birch": (192, 176, 120), "jungle": (156, 112, 78), "acacia": (166, 90, 50), "mangrove": (114, 52, 46),
    "cherry": (222, 176, 170), "bamboo": (186, 170, 78), "crimson": (140, 58, 90), "warped": (56, 136, 132),
}
LEAVES = {  # листва без оттенка биома
    "spruce": (52, 82, 56), "birch": (96, 124, 62), "cherry": (220, 160, 186), "azalea": (88, 116, 48),
    "flowering_azalea": (112, 118, 74), "pale_oak": (128, 134, 124), "mangrove": (82, 118, 38),
}
TINTED_LEAVES = ("oak", "jungle", "acacia", "dark_oak")
GLOW = (240, 188, 92)

# трава и листва по биому (как в игре), тёмные биомы края берут цвета своих двойников
GRASS = {
    "plains": (145, 189, 89), "beach": (145, 189, 89), "forest": (121, 192, 90), "birch_forest": (136, 187, 103),
    "old_growth_birch_forest": (136, 187, 103), "dark_forest": (80, 122, 50), "taiga": (134, 183, 131),
    "jungle": (89, 201, 60), "sparse_jungle": (100, 199, 63), "bamboo_jungle": (89, 201, 60),
    "savanna": (191, 183, 85), "savanna_plateau": (191, 183, 85), "windswept_savanna": (191, 183, 85),
    "desert": (191, 183, 85), "badlands": (144, 129, 77), "eroded_badlands": (144, 129, 77),
    "mangrove_swamp": (106, 112, 57), "swamp": (106, 112, 57), "river": (142, 185, 113), "ocean": (142, 185, 113),
    "stony_shore": (138, 182, 137), "stony_peaks": (138, 182, 137), "lush_caves": (121, 192, 90),
    "dripstone_caves": (145, 189, 89), "dark_lands": (110, 130, 90),
}
FOLIAGE = {
    "plains": (119, 171, 47), "beach": (119, 171, 47), "forest": (89, 174, 48), "birch_forest": (107, 169, 65),
    "old_growth_birch_forest": (107, 169, 65), "dark_forest": (89, 174, 48), "jungle": (48, 187, 11),
    "sparse_jungle": (60, 180, 30), "bamboo_jungle": (48, 187, 11), "savanna": (174, 164, 42),
    "savanna_plateau": (174, 164, 42), "windswept_savanna": (174, 164, 42), "desert": (174, 164, 42),
    "badlands": (158, 129, 77), "eroded_badlands": (158, 129, 77), "mangrove_swamp": (141, 177, 39),
    "swamp": (106, 112, 57), "river": (113, 167, 77), "ocean": (113, 167, 77), "stony_shore": (109, 163, 107),
    "stony_peaks": (109, 163, 107), "lush_caves": (89, 174, 48), "dripstone_caves": (119, 171, 47),
    "dark_lands": (90, 120, 60),
}

WATERY = {"water", "kelp", "kelp_plant", "seagrass", "tall_seagrass", "bubble_column"}
# что под цветом «вода»: если такие блоки торчат над водой — это всё равно вода сверху
VOID = (7, 9, 15)


def strip(n, *suffixes):
    for s in suffixes:
        if n.endswith(s):
            return n[: -len(s)]
    return n


def block_color(n):
    """Цвет блока сверху и вид оттенка: 0 — свой цвет, 1 — трава по биому, 2 — листва по биому, 3 — вода."""
    if n in WATERY:
        return (40, 70, 120), 3
    if n in ("lava", "lava_cauldron", "magma_block", "fire", "soul_fire"):
        return (206, 96, 32), 0
    if n == "grass_block":
        return (120, 170, 80), 1
    if n.endswith("_leaves"):
        k = n[:-7]
        if k in TINTED_LEAVES:
            return (0, 0, 0), 2
        return LEAVES.get(k, (70, 104, 50)), 0
    if n in ("vine", "lily_pad", "moss_carpet", "moss_block", "big_dripleaf", "small_dripleaf", "azalea"):
        return (86, 120, 46), 0
    if n in ("pale_moss_block", "pale_moss_carpet", "pale_hanging_moss"):
        return (150, 156, 142), 0
    if any(k in n for k in ("torch", "lantern", "glowstone", "shroomlight", "campfire", "froglight", "redstone_lamp", "candle", "sea_lantern")):
        return GLOW, 0
    if n in ("snow", "snow_block", "powder_snow_cauldron"):
        return (226, 232, 236), 0
    if n in ("ice", "packed_ice", "blue_ice", "frosted_ice"):
        return (150, 180, 222), 0
    if "terracotta" in n:
        for d, c in TERRACOTTA.items():
            if n.startswith(d + "_"):
                return c, 0
        return (150, 92, 66), 0
    for kind in ("wool", "carpet", "concrete", "stained_glass", "bed", "banner", "candle", "shulker_box"):
        if kind in n:
            for d, c in sorted(DYE.items(), key=lambda kv: -len(kv[0])):
                if n.startswith(d + "_"):
                    return c, 0
    if n in ("sand", "suspicious_sand") or n.endswith("_sandstone") and n.startswith(("smooth_sandstone", "cut_sandstone", "chiseled_sandstone")):
        return (214, 198, 146), 0
    if "red_sand" in n:
        return (176, 96, 42), 0
    if "sandstone" in n:
        return (204, 188, 136), 0
    if n in ("gravel", "suspicious_gravel"):
        return (128, 122, 118), 0
    if n == "dirt_path":
        return (150, 122, 76), 0
    if n == "farmland":
        return (104, 72, 44), 0
    if n in ("dirt", "coarse_dirt", "rooted_dirt"):
        return (128, 92, 64), 0
    if n == "podzol":
        return (96, 68, 40), 0
    if n in ("mud", "muddy_mangrove_roots", "mangrove_roots"):
        return (64, 58, 58), 0
    if n == "mycelium":
        return (108, 94, 104), 0
    if n == "clay":
        return (158, 164, 176), 0
    if n == "wheat":
        return (176, 164, 72), 0
    if n in ("carrots", "potatoes", "beetroots", "melon_stem", "pumpkin_stem", "attached_melon_stem", "attached_pumpkin_stem",
             "torchflower_crop", "pitcher_crop", "nether_wart"):
        return (96, 140, 52), 0
    if n in ("pumpkin", "carved_pumpkin"):
        return (198, 118, 32), 0
    if n == "melon":
        return (112, 150, 42), 0
    if n == "hay_block":
        return (190, 158, 48), 0
    if n in ("sugar_cane", "bamboo"):
        return (122, 160, 74), 0
    if n in ("cactus", "cactus_flower"):
        return (66, 112, 44), 0
    if n in ("sweet_berry_bush", "bush", "firefly_bush", "leaf_litter"):
        return (64, 96, 44), 0
    if "mushroom_block" in n:
        return ((150, 42, 40) if n.startswith("red") else (140, 104, 78)), 0
    for w, c in WOOD.items():
        if n.startswith(w + "_") or n.startswith("stripped_" + w + "_"):
            if n.endswith(("_log", "_wood")) and not n.startswith("stripped_"):
                return tuple(int(v * 0.72) for v in c), 0
            return c, 0
    for key, c in (
        ("blackstone", (44, 38, 46)), ("basalt", (78, 78, 84)), ("deepslate", (78, 78, 84)), ("tuff", (108, 108, 98)),
        ("calcite", (214, 214, 208)), ("diorite", (186, 186, 186)), ("granite", (148, 104, 84)), ("andesite", (126, 126, 128)),
        ("mossy_cobblestone", (100, 114, 88)), ("mossy_stone_brick", (102, 116, 92)), ("cobblestone", (112, 112, 112)),
        ("stone_brick", (118, 118, 120)), ("smooth_stone", (148, 148, 148)), ("mud_brick", (138, 104, 80)),
        ("packed_mud", (138, 104, 80)), ("brick", (148, 76, 60)), ("prismarine", (88, 150, 138)), ("quartz", (226, 220, 210)),
        ("crying_obsidian", (40, 20, 60)), ("obsidian", (22, 18, 32)), ("netherrack", (110, 42, 42)), ("nether_brick", (60, 30, 36)),
        ("nether_wart_block", (120, 30, 30)), ("crimson_nylium", (120, 36, 40)), ("soul_s", (82, 64, 52)), ("sculk", (14, 32, 38)),
        ("dripstone", (130, 104, 90)), ("amethyst", (140, 100, 190)), ("copper", (110, 150, 120)), ("bone_block", (218, 212, 192)),
        ("gold", (230, 196, 70)), ("iron", (196, 196, 196)), ("emerald", (60, 180, 100)), ("coal_block", (28, 28, 30)),
        ("lapis", (60, 80, 150)), ("redstone", (160, 40, 30)), ("raw_", (170, 130, 100)), ("glass", (178, 196, 206)),
        ("sponge", (190, 184, 74)), ("slime", (120, 186, 90)), ("honey", (226, 160, 44)), ("dried_kelp", (54, 62, 40)),
        ("coral", (150, 90, 120)), ("bookshelf", (140, 100, 60)), ("chest", (150, 110, 52)), ("barrel", (118, 84, 50)),
        ("crafting_table", (140, 100, 60)), ("table", (130, 96, 60)), ("furnace", (100, 100, 100)), ("smoker", (100, 96, 92)),
        ("anvil", (64, 64, 68)), ("cauldron", (64, 64, 68)), ("bell", (230, 196, 70)), ("chain", (60, 60, 70)),
        ("bars", (108, 108, 112)), ("lectern", (150, 116, 70)), ("loom", (150, 120, 90)), ("composter", (110, 84, 50)),
        ("beehive", (180, 150, 80)), ("bee_nest", (190, 160, 80)), ("scaffolding", (190, 160, 90)), ("ladder", (150, 115, 70)),
        ("skull", (190, 186, 170)), ("head", (120, 110, 100)), ("pot", (150, 90, 60)), ("spawner", (40, 50, 60)),
        ("cobweb", (210, 210, 210)), ("stone", (124, 124, 124)), ("end_stone", (218, 218, 160)), ("purpur", (168, 124, 168)),
    ):
        if key in n:
            return c, 0
    return (124, 116, 106), 0


def biome_key(b):
    k = b.split(":")[-1]
    if k.startswith("dark/"):
        k = k[5:]
    return k


# ——— геометрия края ——————————————————————————————————————————————————————————————————————————————————

class Realm:
    def __init__(self, cfg):
        self.cx = float(cfg["center-x"])
        self.cz = float(cfg["center-z"])
        self.wall = float(cfg["wall-radius"])
        self.offset = float(cfg.get("line-offset", 1.0))
        self.border = float(cfg["border"]["radius"])
        ov = {}
        for s in cfg.get("wall-overrides") or []:
            a, r = s.split(":")
            ov[float(a)] = float(r)
        self.keys = sorted(ov)
        self.vals = [ov[k] for k in self.keys]
        self.x0 = int(round(self.cx)) - SIZE // 2
        self.z0 = int(round(self.cz)) - SIZE // 2

    def wall_at_deg(self, deg):
        """Как DarkLands.wallAtDeg: выступ по таблице, между соседями не дальше 1° — по прямой, иначе — радиус Стены."""
        deg = np.asarray(deg, dtype=np.float64)
        out = np.full(deg.shape, self.wall)
        if not self.keys:
            return out
        k = np.array(self.keys)
        v = np.array(self.vals)
        hi = np.searchsorted(k, deg, side="left")
        lo = np.searchsorted(k, deg, side="right") - 1
        ok = (lo >= 0) & (hi < len(k))
        lo_c = np.clip(lo, 0, len(k) - 1)
        hi_c = np.clip(hi, 0, len(k) - 1)
        span = k[hi_c] - k[lo_c]
        ok &= span <= 1.0
        t = np.where(span > 0, (deg - k[lo_c]) / np.where(span > 0, span, 1), 0.0)
        val = v[lo_c] + t * (v[hi_c] - v[lo_c])
        return np.where(ok, val, out)

    def line_at_deg(self, deg):
        return self.wall_at_deg(deg) + self.offset

    def norm(self, x, z):
        return round((x - self.x0) / SIZE, 5), round((z - self.z0) / SIZE, 5)


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float32) / 16 + 1 / 32


def load_cache(realm):
    blk = np.zeros((SIZE, SIZE), dtype=np.uint16)
    h = np.full((SIZE, SIZE), -64, dtype=np.int16)
    wd = np.zeros((SIZE, SIZE), dtype=np.uint8)
    bio = np.zeros((SIZE, SIZE), dtype=np.uint8)
    has = np.zeros((SIZE, SIZE), dtype=bool)
    for f in sorted(os.listdir(CACHE)):
        if not (f.startswith("r.") and f.endswith(".npz")) or ".tmp" in f:
            continue
        _, sx, sz, _ = f.split(".")
        rx, rz = int(sx), int(sz)
        ox, oz = rx * 512 - realm.x0, rz * 512 - realm.z0
        x0, x1 = max(0, ox), min(SIZE, ox + 512)
        z0, z1 = max(0, oz), min(SIZE, oz + 512)
        if x0 >= x1 or z0 >= z1:
            continue
        d = np.load(os.path.join(CACHE, f))
        src = (slice(z0 - oz, z1 - oz), slice(x0 - ox, x1 - ox))
        dst = (slice(z0, z1), slice(x0, x1))
        blk[dst] = d["blk"][src]
        h[dst] = d["h"][src]
        wd[dst] = d["wd"][src]
        bio[dst] = d["bio"][src]
        has[dst] = d["has"][src]
    return blk, h, wd, bio, has


def box_blur(a, r):
    """Среднее по квадрату (2r+1)² через накопленные суммы."""
    p = np.pad(a, r + 1, mode="edge").astype(np.float64)
    c = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return (s / (k * k))[: a.shape[0], : a.shape[1]].astype(np.float32)


def fill_holes(realm, blk, h, wd, bio, has):
    """Несгенерированные чанки внутри круга мира — ближайшей землёй, чтобы не было чёрных дыр."""
    from scipy import ndimage
    yy, xx = np.ogrid[:SIZE, :SIZE]
    inside = np.hypot(xx + realm.x0 - realm.cx, yy + realm.z0 - realm.cz) < realm.border
    holes = inside & ~has
    if not holes.any():
        return has
    _, (iy, ix) = ndimage.distance_transform_edt(~has, return_indices=True)
    for a in (blk, h, wd, bio):
        a[holes] = a[iy[holes], ix[holes]]
    del iy, ix
    return has | holes


def style(realm, blk, h, wd, bio, has, names, biomes):
    n = len(names)
    lut = np.zeros((n, 3), dtype=np.float32)
    kind = np.zeros(n, dtype=np.uint8)
    for i, nm in enumerate(names):
        c, k = block_color(nm)
        lut[i] = c
        kind[i] = k
    grass = np.array([GRASS.get(biome_key(b), (130, 170, 90)) for b in biomes] + [(130, 170, 90)] * (256 - len(biomes)), dtype=np.float32)
    foliage = np.array([FOLIAGE.get(biome_key(b), (100, 150, 60)) for b in biomes] + [(100, 150, 60)] * (256 - len(biomes)), dtype=np.float32)

    k = kind[blk]
    rgb = lut[blk]
    m = k == 1
    rgb[m] = grass[bio[m]] * 0.86
    m = k == 2
    rgb[m] = foliage[bio[m]] * 0.62
    water = k == 3
    del m

    # тень по соседу с севера: выше — светлее, ниже — темнее (как на карте в игре)
    hn = np.vstack([h[:1], h[:-1]])
    dn = h.astype(np.int32) - hn
    shade = np.where(dn > 0, 1.0, np.where(dn < 0, 0.74, 0.88)).astype(np.float32)
    del hn, dn
    # мягкий рельеф: свет с северо-запада по сглаженной высоте
    hs = box_blur(np.where(water, h - wd.astype(np.int16), h).astype(np.float32), 3)
    relief = np.empty_like(hs)
    relief[1:-1, 1:-1] = (hs[:-2, :-2] - hs[2:, 2:])
    relief[0, :] = relief[-1, :] = relief[:, 0] = relief[:, -1] = 0
    relief = np.clip(1 + relief * 0.035, 0.72, 1.22)
    del hs
    light = shade * relief
    light[water] = 1.0
    rgb *= light[..., None]
    del light, shade, relief

    # вода: глубина полосами, на границах — шахматка, как на карте в игре
    yy, xx = np.indices((SIZE, SIZE), dtype=np.int32)
    checker = ((xx + yy) & 1).astype(bool)
    depth = wd.astype(np.int32)
    band = np.select(
        [depth <= 2, depth <= 4, depth <= 7, depth <= 11, depth <= 20],
        [0, np.where(checker, 0, 1), 1, np.where(checker, 1, 2), 2],
        3,
    )
    wcol = np.array([(70, 110, 152), (48, 84, 130), (34, 62, 106), (24, 44, 82)], dtype=np.float32)
    rgb[water] = wcol[band[water]]
    del band, depth, checker

    # общий тон края: чуть приглушить и увести тени в ночную синеву
    lum = (rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32))[..., None]
    rgb = rgb * 0.82 + lum * 0.18
    night = np.array([16, 20, 36], dtype=np.float32)
    rgb = night + (rgb - night) * 0.92
    rgb = np.clip(rgb * 0.94, 0, 255)

    # тёмные земли: за линией Стены темнее с глубиной, ступенями с дизерингом
    dx = (xx + realm.x0 + 0.5 - realm.cx).astype(np.float32)
    dz = (yy + realm.z0 + 0.5 - realm.cz).astype(np.float32)
    r = np.hypot(dx, dz)
    deg = np.degrees(np.arctan2(dz, dx))
    line = np.full(r.shape, realm.wall + realm.offset, dtype=np.float32)
    if realm.keys:
        sel = (deg >= realm.keys[0] - 1) & (deg <= realm.keys[-1] + 1)
        line[sel] = realm.line_at_deg(deg[sel])
    beyond = r - line
    del deg, dx, dz, line
    bay = BAYER[yy & 3, xx & 3]
    dark = beyond > 0
    t = np.clip(beyond / 440.0, 0, 1)
    steps = 5.0
    tq = np.floor(t * steps + bay) / steps  # ступени с дизерингом
    lum = (rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32))[..., None]
    gloom = (rgb * 0.3 + lum * 0.7) * np.array([0.74, 0.7, 0.86], dtype=np.float32)
    mult = (0.5 - 0.3 * tq)[..., None]
    darkrgb = gloom * mult + np.array([9, 6, 12], dtype=np.float32)
    rgb = np.where(dark[..., None], darkrgb, rgb)
    del gloom, darkrgb, lum, mult
    # винное зарево сразу за Стеной: тает с дизерингом
    glow = np.clip(1 - beyond / 28.0, 0, 1) * dark
    glow = np.where(glow > bay * 0.9, glow, 0).astype(np.float32)
    rgb = rgb * (1 - glow[..., None] * 0.45) + np.array([138, 30, 46], dtype=np.float32) * glow[..., None] * 0.45

    # край мира и несгенерированное: тьма, на границе — дизеринг
    edge = np.clip((r - (realm.border - 60)) / 60.0, 0, 1.0001)
    void = (edge > bay) | ~has
    for x, z, rad in MASKS:
        void |= np.hypot(xx + realm.x0 - x, yy + realm.z0 - z) < rad
    rgb[void] = VOID
    del edge, r, t, tq, glow
    return np.clip(rgb, 0, 255).astype(np.uint8)


def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.convert("RGB").save(path, "WEBP", lossless=True, quality=100, method=4)


def render(realm):
    names = json.load(open(os.path.join(CACHE, "blocks.json"), encoding="utf-8"))
    biomes = json.load(open(os.path.join(CACHE, "biomes.json"), encoding="utf-8"))
    blk, h, wd, bio, has = load_cache(realm)
    has = fill_holes(realm, blk, h, wd, bio, has)
    rgb = style(realm, blk, h, wd, bio, has, names, biomes)
    del blk, h, wd, bio, has
    full = Image.fromarray(rgb, "RGB")
    del rgb
    pal = full.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    vq = Image.new("RGB", (1, 1), VOID).quantize(palette=pal, dither=Image.Dither.NONE).convert("RGB").getpixel((0, 0))
    levels = []
    for lv, scale in (((0, 4),) if PREVIEW else ((2, 1), (1, 2), (0, 4))):
        side = SIZE // scale
        if scale == 1:
            img = pal
        else:
            img = full.resize((side, side), Image.Resampling.BOX).quantize(palette=pal, dither=Image.Dither.NONE)
        if lv == 0:
            save(img, os.path.join(OUT, "0.webp"))
            levels.append({"z": 0, "scale": scale, "size": side, "tiles": 1})
            continue
        n = side // TILE
        d = os.path.join(OUT, str(lv))
        for f in os.listdir(d) if os.path.isdir(d) else []:
            os.remove(os.path.join(d, f))
        for ty in range(n):
            for tx in range(n):
                tile = img.crop((tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE))
                if _is_void(tile, vq):
                    continue  # пустая плитка — вьювер покажет фон
                save(tile, os.path.join(d, f"{tx}-{ty}.webp"))
        levels.append({"z": lv, "scale": scale, "size": side, "tiles": n})
    return sorted(levels, key=lambda l: l["z"]), "#%02x%02x%02x" % vq


def _is_void(tile, vq):
    a = np.asarray(tile.convert("RGB"))
    return bool((a == np.array(vq, dtype=np.uint8)).all())


# ——— метки ———————————————————————————————————————————————————————————————————————————————————————

LAYERS = [
    {"id": "settlements", "name": "Поселения", "hint": "Столица, рынок, Деревня мастеров и сельские деревни"},
    {"id": "stations", "name": "Ямские станции", "hint": "Ямщик возит между станциями и принимает почту"},
    {"id": "grounds", "name": "Угодья", "hint": "Шахта, поле и сад — здесь можно ломать блоки"},
    {"id": "dungeons", "name": "Подземелья", "hint": "Залы с тварями и хозяин в глубине"},
    {"id": "taverns", "name": "Таверны и ночлег", "hint": "Комнаты внаём: своя кровать и сундук"},
    {"id": "arena", "name": "Ристалище", "hint": "Поединки на монеты"},
]

ABOUT = {
    "capital": "Цитадель и площадь, где начинают все. Проводник, казначей, ведун, летописец, доска почёта.",
    "market": "Купцы, лавки оружия и брони, чародеи, шорник и заморский гость.",
    "village": "Мастера ремёсел дают ранги. Знахарка, картограф и староста.",
    "mine": "Карьер с рудой, который сам засыпается заново. Скупщик у входа.",
    "field": "Все культуры края. Скупщик урожая у края поля.",
    "orchard": "Сад, который отрастает сам. Скупщица брёвен рядом.",
    "arena": "Поединки на монеты. Единственное место внутри Стены, где можно биться с людьми.",
}


def markers(realm):
    G = json.load(open(GEN, encoding="utf-8"))
    cfg = yaml.safe_load(open(CONFIG, encoding="utf-8"))
    out = []

    def add(layer, mid, name, x, z, about, major=False):
        u, v = realm.norm(x, z)
        out.append({"id": mid, "layer": layer, "name": name, "u": u, "v": v, "about": about, **({"major": True} if major else {})})

    P = G["places"]
    add("settlements", "capital", P["capital"]["name"], P["capital"]["x"], P["capital"]["z"], ABOUT["capital"], True)
    add("settlements", "market", P["market"]["name"], P["market"]["x"], P["market"]["z"], ABOUT["market"], True)
    add("settlements", "village", P["village"]["name"], P["village"]["x"], P["village"]["z"], ABOUT["village"], True)
    for v in P["villages"]:
        add("settlements", "v-" + v["id"], v["name"], v["x"], v["z"],
            f"Сельская деревня, {v['where']}. Староста с заказами, лавочник, скупщик и дома внаём.", True)
    for s in G["stations"]["list"]:
        about = f"Ямщик: {s['where']}." if s.get("where") else "Ямщик."
        about += " Поездки, почта и вести." if s.get("fare") is not None else " Открыта сразу, отсюда начинаются поездки."
        add("stations", "st-" + s["id"], "Станция «" + s["name"] + "»", s["x"], s["z"], about)
    for g in ("mine", "field", "orchard"):
        add("grounds", g, P[g]["name"], P[g]["x"], P[g]["z"], ABOUT[g])
    for b in (cfg.get("bosses") or {}).get("list", []):
        add("dungeons", "d-" + b["id"], b["name"], b["x"], b["z"], f"Подземелье. Хозяин — {b['boss']}.")
    for t in G["homes"]["taverns"]:
        add("taverns", "t-" + t["id"], t["name"], t["x"], t["z"], "Таверна: комнаты внаём, трактирщик.")
    for n in cfg.get("npcs") or []:
        if n.get("role") == "inn":
            add("taverns", "inn", "Ночлежка в цитадели", n["x"], n["z"], "Дешёвые комнаты внаём прямо в столице.")
            break
    add("arena", "arena", P["arena"]["name"], P["arena"]["x"], P["arena"]["z"], ABOUT["arena"])
    for m in out:
        if not (0 < m["u"] < 1 and 0 < m["v"] < 1):
            raise SystemExit(f"метка {m['id']} вне карты")
    return out


def wall_line(realm):
    pts = []
    for i in range(0, 1440):
        deg = -180 + i * 0.25
        r = float(realm.line_at_deg(np.array([deg]))[0])
        x = realm.cx + r * math.cos(math.radians(deg))
        z = realm.cz + r * math.sin(math.radians(deg))
        pts.append(realm.norm(x, z))
    # упростить: убрать точки на одной прямой с соседями
    keep = [pts[0]]
    for a, b in zip(pts[1:], pts[2:] + pts[:1]):
        p = keep[-1]
        cross = (a[0] - p[0]) * (b[1] - p[1]) - (a[1] - p[1]) * (b[0] - p[0])
        if abs(cross) > 2e-9:
            keep.append(a)
    return keep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markers", action="store_true")
    ap.add_argument("--preview", action="store_true", help="только обзор 0.webp, без плиток и меток")
    a = ap.parse_args()
    global PREVIEW
    PREVIEW = a.preview
    cfg = yaml.safe_load(open(CONFIG, encoding="utf-8"))
    realm = Realm(cfg)
    prev = json.load(open(DATA, encoding="utf-8")) if os.path.exists(DATA) else {}
    if a.markers:
        levels = prev["levels"]
        void = prev["void"]
        source = prev.get("source")
    else:
        levels, void = render(realm)
        if PREVIEW:
            print("обзор записан, метки не трогаю")
            return 0
        src = os.path.join(CACHE, "source.json")
        source = json.load(open(src, encoding="utf-8")).get("backup") if os.path.exists(src) else None
    for lv in levels:  # какие плитки есть (пустые не пишутся)
        d = os.path.join(OUT, str(lv["z"]))
        lv["have"] = sorted(f[:-5] for f in os.listdir(d) if f.endswith(".webp")) if lv["z"] > 0 and os.path.isdir(d) else []
    data = {
        "_comment": "Собрано scripts/map/render.py из копии мира и config.yml. Позиции — доли стороны карты, север сверху.",
        "source": source,
        "size": SIZE,
        "tile": TILE,
        "levels": levels,
        "void": void,
        "wall": [list(p) for p in wall_line(realm)],
        "border": round(realm.border / SIZE, 5),
        "center": list(realm.norm(realm.cx, realm.cz)),
        "layers": LAYERS,
        "markers": markers(realm),
    }
    tmp = DATA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    os.replace(tmp, DATA)
    print(f"меток: {len(data['markers'])}, точек Стены: {len(data['wall'])}, уровни: {[l['z'] for l in levels]}")


if __name__ == "__main__":
    sys.exit(main())
