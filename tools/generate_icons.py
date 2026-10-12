"""
generate_icons.py — Generate ikon PWA (PNG) pakai Pillow.

Pemakaian:  python tools/generate_icons.py
Output:     icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png,
            icons/apple-touch-icon.png, icons/favicon-32.png
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
os.makedirs(OUT, exist_ok=True)

TOP = (99, 102, 241)    # indigo-500
BOT = (34, 211, 238)    # cyan-400
WHITE = (255, 255, 255, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "DejaVuSans-Bold.ttf",
]


def _font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient(size):
    """Gradient diagonal indigo -> cyan."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x / size + y / size) / 2
            px[x, y] = tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3))
    return img.convert("RGBA")


def draw_icon(size, maskable=False, text=True):
    """Ikon: gradient + ikon paket (box) + teks RESI."""
    img = gradient(size)
    d = ImageDraw.Draw(img)
    s = size

    # Maskable butuh safe zone ( elemen penting di dalam lingkaran 80% )
    box = int(s * (0.50 if maskable else 0.42))
    x0 = (s - box) // 2
    y0 = (s - box) // 2 - (int(s * 0.07) if text and not maskable else 0)
    y0 = max(y0, int(s * 0.08))

    lw = max(4, int(s * 0.035))
    d.rounded_rectangle([x0, y0, x0 + box, y0 + box],
                        radius=int(s * 0.07), outline=WHITE, width=lw)
    # Garis tutup box (lid)
    lid_y = y0 + int(box * 0.32)
    d.line([x0 + lw, lid_y, x0 + box - lw, lid_y], fill=WHITE, width=lw)
    # Strip tape vertikal
    cx = x0 + box // 2
    d.line([cx, y0 + lw, cx, lid_y], fill=WHITE, width=lw)

    if text and s >= 128:
        fnt = _font(int(s * 0.14))
        label = "RESI"
        tb = d.textbbox((0, 0), label, font=fnt)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        tx = (s - tw) // 2 - tb[0]
        ty = y0 + box + int(s * 0.05)
        if ty + th <= s - int(s * 0.04):
            d.text((tx, ty), label, font=fnt, fill=WHITE)
    return img


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print("OK:", os.path.relpath(path, ROOT))


def main():
    save(draw_icon(192), "icon-192.png")
    save(draw_icon(512), "icon-512.png")
    save(draw_icon(512, maskable=True), "icon-maskable-512.png")
    save(draw_icon(180), "apple-touch-icon.png")
    save(draw_icon(32, text=False), "favicon-32.png")


if __name__ == "__main__":
    main()
