"""Generate PNG favicons from the gold star SVG at multiple sizes."""
from PIL import Image, ImageDraw
import os

# SVG viewBox is 0 0 24 24, star polygon points
STAR_POINTS = [
    (12, 2), (15.09, 8.26), (22, 9.27), (17, 14.14),
    (18.18, 21.02), (12, 17.77), (5.82, 21.02), (7, 14.14),
    (2, 9.27), (8.91, 8.26)
]
GOLD = (212, 175, 55, 255)  # #D4AF37
SVG_SIZE = 24.0

SIZES = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-48x48.png": 48,
    "favicon-96x96.png": 96,
    "apple-touch-icon.png": 180,
    "favicon-192x192.png": 192,
    "favicon-512x512.png": 512,
}

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")


def render_star(size: int) -> Image.Image:
    scale = size / SVG_SIZE
    # Add 1px padding on each side so the star isn't clipped
    pad = max(1, int(scale))
    canvas = size + pad * 2
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pts = [(x * scale + pad, y * scale + pad) for x, y in STAR_POINTS]
    draw.polygon(pts, fill=GOLD)
    # Crop back to exact size
    img = img.crop((pad, pad, pad + size, pad + size))
    return img


def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    for filename, size in SIZES.items():
        img = render_star(size)
        out_path = os.path.join(PUBLIC_DIR, filename)
        img.save(out_path, "PNG", optimize=True)
        print(f"  Saved {filename} ({size}x{size})")

    # Also overwrite favicon.ico as a proper multi-size ICO
    ico_sizes = [16, 32, 48]
    ico_images = [render_star(s) for s in ico_sizes]
    ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )
    print(f"  Saved favicon.ico (16/32/48px multi-size)")


if __name__ == "__main__":
    main()
