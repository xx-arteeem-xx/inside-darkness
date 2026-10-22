#!/usr/bin/env python3
"""Жители края на сайте: пиксельные фигуры из настоящих скинов NPC.

  python3 scripts/people.py        → public/people/<скин>.webp и src/data/people.json

Скины — те же, что у жителей в игре: skins.textures и skins.by-role в config.yml плагина, скин жителя выбирается
как в Npcs.skinOf (tools/skins_render.skin_of). Текстуры берутся из кэша downloads/skins/ (tools/skins_render.png),
сеть нужна только для новых. Ничего не подменяется.

Рендер у всех один: фигура спереди 16×32 с верхним слоем, свет слева сверху, тёмная обводка в точку,
холст 18×34 без сглаживания. На сайте фигуру увеличивает CSS (image-rendering: pixelated), бюст — та же картинка,
обрезанная по грудь. Файлы WebP без потерь, по нескольку сотен байт.

Показываются только общеизвестные жители (роли из PUBLIC). Тайных мастеров и любых скрытых жителей на сайте нет:
незнакомая роль или пометка hidden/secret — житель пропускается. Для «игрока» на главной — нейтральные скины
из того же каталога, которые не носит ни один житель (PLAYER), а не скины живых игроков.
"""
import json
import os
import sys

import yaml
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ROOT = os.path.dirname(SITE)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import skins_render as S  # noqa: E402

OUT = os.path.join(SITE, "public", "people")
DATA = os.path.join(SITE, "src", "data", "people.json")

# роли общеизвестных жителей (часть роли до «:», «@», «/»)
PUBLIC = {"guide", "elder", "headman", "master", "inn", "herald", "enchant", "buy", "shop", "station",
          "chronicle", "cartographer", "bank", "honor", "vedun"}
# «игрок» на главной: новичок, середина пути, ветеран — скины каталога, которых нет ни у одного жителя
PLAYER = ["farmer_buyer2", "toolsmith_f", "armorer_f"]

OUTLINE = (8, 6, 12, 255)


def base_role(role):
    r = str(role)
    for sep in (":", "@", "/"):
        r = r.split(sep)[0]
    return r


def is_public(n):
    if any(n.get(k) for k in ("hidden", "secret", "silent")):
        return False
    return base_role(n.get("role", "")) in PUBLIC


def lit(fig):
    """Один свет на всех: слева сверху светлее, справа и к ногам темнее."""
    px = fig.load()
    w, h = fig.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a:
                continue
            k = 1.06 - 0.16 * (x / (w - 1)) - (0.06 if y >= 20 else 0.0)
            px[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), a)
    return fig


def outlined(fig):
    """Холст на точку шире со всех сторон и тёмная обводка по силуэту (без углов — мягче)."""
    w, h = fig.size
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    src = fig.load()
    o = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] > 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    o[x + 1 + dx, y + 1 + dy] = OUTLINE
    out.alpha_composite(fig, (1, 1))
    return out


def render(im, slim):
    fig = S.figure(im, slim)
    # нижний слой непрозрачен, верхний может быть полупрозрачным — итог делаем без полутонов альфы
    a = fig.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    fig.putalpha(a)
    return outlined(lit(fig))


def main():
    cfg = yaml.safe_load(open(S.CONFIG, encoding="utf-8"))
    tex = (cfg.get("skins") or {}).get("textures") or {}
    npcs = {}
    skipped = []
    for n in cfg.get("npcs") or []:
        if not is_public(n):
            skipped.append(n.get("id"))
            continue
        key = S.skin_of(cfg, n)
        if key in tex:
            npcs[n["id"]] = key
        else:
            print(f"{n.get('id')}: нет текстуры {key}", file=sys.stderr)
    keys = sorted(set(npcs.values()) | set(PLAYER))
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".webp") and f[:-5] not in keys:
            os.remove(os.path.join(OUT, f))
    total = 0
    size = None
    for k in keys:
        h, model = S.texture(tex[k])
        img = render(S.png(h), model == "slim")
        size = img.size
        p = os.path.join(OUT, f"{k}.webp")
        img.save(p, "WEBP", lossless=True, quality=100, method=6)
        total += os.path.getsize(p)
    data = {
        "_comment": "Собрано scripts/people.py из config.yml: жители → скин, картинки public/people/<скин>.webp (фигура спереди с обводкой).",
        "w": size[0],
        "h": size[1],
        "bust": 18,
        "npcs": npcs,
        "player": PLAYER,
    }
    with open(DATA + ".tmp", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    os.replace(DATA + ".tmp", DATA)
    print(f"жителей: {len(npcs)}, скинов: {len(keys)}, всего {total // 1024} КБ; пропущено (не общеизвестные): {len(skipped)}")


if __name__ == "__main__":
    main()
