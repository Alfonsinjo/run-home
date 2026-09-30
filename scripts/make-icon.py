#!/usr/bin/env python3
"""Erzeugt resources/icon.png (1024x1024) und resources/splash.png (2732x2732) im Run-Home-Look."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "resources"
ROOT.mkdir(exist_ok=True)
BG, VOLT, INK = (11, 11, 12), (212, 255, 58), (11, 11, 12)

def icon(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), VOLT)
    d = ImageDraw.Draw(img)
    s = size / 1024
    # Route: dicke dunkle Linie mit zwei Knicken, Startpunkt und Zielhaus
    pts = [(160 * s, 760 * s), (400 * s, 520 * s), (560 * s, 640 * s), (860 * s, 280 * s)]
    d.line(pts, fill=INK, width=int(70 * s), joint="curve")
    d.ellipse([120 * s, 720 * s, 200 * s, 800 * s], fill=INK)
    hx, hy = 860 * s, 280 * s
    d.polygon([(hx - 120 * s, hy + 10 * s), (hx, hy - 120 * s), (hx + 120 * s, hy + 10 * s)], fill=INK)
    d.rectangle([hx - 90 * s, hy + 10 * s, hx + 90 * s, hy + 140 * s], fill=INK)
    d.rectangle([hx - 25 * s, hy + 60 * s, hx + 25 * s, hy + 140 * s], fill=VOLT)
    return img

icon(1024).save(ROOT / "icon.png")
splash = Image.new("RGB", (2732, 2732), BG)
splash.paste(icon(600), (1066, 1066))
splash.save(ROOT / "splash.png")
print("ok", ROOT)
