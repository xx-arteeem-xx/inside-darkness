#!/usr/bin/env python3
"""Картинка для ссылок (Open Graph, 1200×630): край сверху и имя сервера.

  python3 scripts/og.py      → public/og.png

Берёт обзор карты public/map/0.webp и линию Стены из src/data/map.json (их собирает scripts/map/render.py),
адрес — из src/config/server.json. Шрифты — те же, что на сайте (WOFF из @fontsource). Запускать после рендера карты.
"""
import json
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
FONTS = os.path.join(SITE, "node_modules", "@fontsource")
W, H = 1200, 630
VOID = (7, 9, 15)
EMBER = (194, 51, 69)
BONE = (236, 228, 208)
ASH = (167, 162, 148)
GOLD = (240, 192, 102)


def font(family, subset, weight, size):
    return ImageFont.truetype(os.path.join(FONTS, family, "files", f"{family}-{subset}-{weight}-normal.woff"), size)


def main():
    data = json.load(open(os.path.join(SITE, "src", "data", "map.json"), encoding="utf-8"))
    server = json.load(open(os.path.join(SITE, "src", "config", "server.json"), encoding="utf-8"))
    im = Image.new("RGB", (W, H), VOID)

    # диск края справа, крупно и с обрезом: пиксели целые (×1, без сглаживания)
    disc = Image.open(os.path.join(SITE, "public", "map", "0.webp")).convert("RGB")
    side = 760
    disc = disc.resize((side, side), Image.Resampling.NEAREST)
    ox, oy = W - side + 150, (H - side) // 2
    im.paste(disc, (ox, oy))

    # линия Стены с винным заревом
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pts = [(ox + u * side, oy + v * side) for u, v in data["wall"]]
    ImageDraw.Draw(glow).line(pts + pts[:1], fill=EMBER + (150,), width=10)
    glow = glow.filter(ImageFilter.GaussianBlur(4))
    im.paste(glow, (0, 0), glow)
    ImageDraw.Draw(im).line(pts + pts[:1], fill=(240, 196, 174), width=2)

    # затемнение слева под текст
    shade = Image.new("L", (W, 1))
    for x in range(W):
        shade.putpixel((x, 0), int(255 * max(0.0, min(1.0, (720 - x) / 300))))
    shade = shade.resize((W, H))
    im.paste(Image.new("RGB", (W, H), VOID), (0, 0), shade)

    d = ImageDraw.Draw(im)
    x = 72
    title = font("vollkorn", "latin", 900, 118)
    d.text((x, 78), "Inside", font=title, fill=EMBER)
    d.text((x, 186), "Darkness", font=title, fill=EMBER)
    tag = font("tiny5", "latin", 400, 34)
    tw = d.textlength("MMORPG", font=tag)
    d.rectangle((x, 338, x + tw + 30, 386), fill=(7, 9, 15), outline=(110, 22, 34), width=3)
    d.text((x + 15, 343), "MMORPG", font=tag, fill=BONE)
    line = font("vollkorn", "cyrillic", 700, 40)
    d.text((x, 418), "Последний обжитой край", font=line, fill=BONE)
    d.text((x, 464), "посреди тьмы", font=line, fill=BONE)
    addr = font("tiny5", "latin", 400, 28)
    d.text((x, 548), server["address"], font=addr, fill=GOLD)

    out = os.path.join(SITE, "public", "og.png")
    im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out, optimize=True)
    print(f"записан {os.path.relpath(out, SITE)} ({os.path.getsize(out) // 1024} КБ)")


if __name__ == "__main__":
    main()
