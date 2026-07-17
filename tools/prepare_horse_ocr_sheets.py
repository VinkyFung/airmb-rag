from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE_JS = Path(r"C:\Users\vinkyfung\Desktop\开发文档\标签种类.js")
OUT_DIR = Path(r"E:\project\airmb-rag\horse_ocr")


def load_items():
    text = SOURCE_JS.read_text(encoding="utf-8-sig")
    data = json.loads(text[text.find("[") : text.rfind("]") + 1])
    return data[0]["children"]


def image_extension(src: str) -> str:
    ext = src.split("?", 1)[0].rsplit(".", 1)[-1].lower()
    return ext if ext in {"png", "jpg", "jpeg", "webp", "gif"} else "png"


def main() -> None:
    img_dir = OUT_DIR / "images"
    crop_dir = OUT_DIR / "crops"
    sheet_dir = OUT_DIR / "sheets"
    for directory in (img_dir, crop_dir, sheet_dir):
        directory.mkdir(parents=True, exist_ok=True)

    opener = urllib.request.build_opener()
    opener.addheaders = [
        ("User-Agent", "Mozilla/5.0"),
        ("Referer", "https://pj.airmb.com/"),
    ]

    crops: list[Path] = []
    for index, item in enumerate(load_items(), 1):
        src = item["src"]
        image_path = img_dir / f"{index:02d}.{image_extension(src)}"
        if not image_path.exists():
            with opener.open(src, timeout=30) as response:
                image_path.write_bytes(response.read())
            time.sleep(0.05)

        image = Image.open(image_path).convert("RGB")
        width, height = image.size
        crop = image.crop((0, int(height * 0.39), width, int(height * 0.68)))
        target_width = 760
        target_height = max(1, int(crop.height * target_width / crop.width))
        crop = crop.resize((target_width, target_height))

        canvas = Image.new("RGB", (target_width, target_height + 34), "white")
        canvas.paste(crop, (0, 34))
        draw = ImageDraw.Draw(canvas)
        draw.text((8, 8), f"{index:02d} {item.get('subhead', '')}", fill=(0, 0, 0))

        crop_path = crop_dir / f"{index:02d}.jpg"
        canvas.save(crop_path, quality=92)
        crops.append(crop_path)

    for start in range(0, len(crops), 5):
        batch = crops[start : start + 5]
        images = [Image.open(path).convert("RGB") for path in batch]
        sheet_width = max(image.width for image in images)
        sheet_height = sum(image.height for image in images) + 12 * (len(images) - 1)
        sheet = Image.new("RGB", (sheet_width, sheet_height), "white")
        y = 0
        for image in images:
            sheet.paste(image, (0, y))
            y += image.height + 12
        sheet.save(sheet_dir / f"batch_{start // 5 + 1:02d}.jpg", quality=92)

    print(f"done {OUT_DIR} items={len(crops)} sheets={len(list(sheet_dir.glob('*.jpg')))}")


if __name__ == "__main__":
    main()
