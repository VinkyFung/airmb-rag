from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)


def load_js_data(path: Path) -> tuple[Any, str, str]:
    text = path.read_text(encoding="utf-8-sig")
    start = text.find("[")
    end = text.rfind("]")
    if start < 0 or end < start:
        raise ValueError("未找到可解析的 JSON 数组。")

    prefix = text[:start]
    suffix = text[end + 1 :]
    data = json.loads(text[start : end + 1])
    return data, prefix, suffix


def iter_link_items(value: Any):
    if isinstance(value, dict):
        if value.get("link"):
            yield value
        for child in value.values():
            yield from iter_link_items(child)
    elif isinstance(value, list):
        for item in value:
            yield from iter_link_items(item)


def fetch_text(url: str, timeout: int) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://pj.airmb.com/",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        raw = response.read()
        content_type = response.headers.get("Content-Type", "")
        charset_match = re.search(r"charset=([\w-]+)", content_type, re.I)
        charset = charset_match.group(1) if charset_match else "utf-8"
        return raw.decode(charset, errors="replace")


def find_first_img_src(fragment: str, base_url: str) -> str:
    unescaped = html.unescape(fragment)
    match = re.search(r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']", unescaped, re.I)
    if not match:
        return ""
    return urljoin(base_url, html.unescape(match.group(1)).strip())


def find_in_next_data(page_source: str, base_url: str) -> str:
    match = re.search(
        r'<script[^>]+id=[\"\']__NEXT_DATA__[\"\'][^>]*>(.*?)</script>',
        page_source,
        re.I | re.S,
    )
    if not match:
        return ""

    try:
        next_data = json.loads(html.unescape(match.group(1)))
    except json.JSONDecodeError:
        return ""

    page_props = next_data.get("props", {}).get("pageProps", {})
    for key in ("content", "center", "body"):
        value = page_props.get(key)
        if isinstance(value, str):
            src = find_first_img_src(value, base_url)
            if src:
                return src
    return ""


def find_in_content_field(page_source: str, base_url: str) -> str:
    match = re.search(r'"content"\s*:\s*"((?:\\.|[^"\\])*)"', page_source, re.S)
    if not match:
        return ""

    try:
        content = json.loads(f'"{match.group(1)}"')
    except json.JSONDecodeError:
        content = match.group(1)

    return find_first_img_src(content, base_url)


def find_in_post_section(page_source: str, base_url: str) -> str:
    match = re.search(
        r"""<section[^>]+class=["'][^"']*\bpy-4\b[^"']*\bborder-t\b[^"']*\bpost\b[^"']*["'][^>]*>(.*?)</section>""",
        page_source,
        re.I | re.S,
    )
    if not match:
        return ""
    return find_first_img_src(match.group(1), base_url)


def find_og_image(page_source: str, base_url: str) -> str:
    match = re.search(
        r"""<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']""",
        page_source,
        re.I,
    )
    if not match:
        return ""
    return urljoin(base_url, html.unescape(match.group(1)).strip())


def find_any_article_image(page_source: str, base_url: str) -> str:
    match = re.search(
        r'https?:\\?/\\?/pjimg\.airmb\.com\\?/\\?/pj_article_images\\?/[^\"\'<>\s]+?\.(?:png|jpg|jpeg|webp)',
        page_source,
        re.I,
    )
    if not match:
        return ""
    src = match.group(0).replace("\\/", "/")
    return urljoin(base_url, html.unescape(src))


def extract_src(page_source: str, base_url: str) -> str:
    for extractor in (
        find_in_next_data,
        find_in_content_field,
        find_in_post_section,
        find_og_image,
        find_any_article_image,
    ):
        src = extractor(page_source, base_url)
        if src:
            return src
    return ""


def enrich(
    data: Any,
    timeout: int,
    sleep_seconds: float,
    only_missing: bool = False,
) -> tuple[int, int, list[str]]:
    items = list(iter_link_items(data))
    cache: dict[str, str] = {}
    failures: list[str] = []
    updated = 0

    for index, item in enumerate(items, 1):
        link = str(item.get("link", "")).strip()
        if not link:
            continue
        if only_missing and item.get("src"):
            updated += 1
            continue

        if link not in cache:
            try:
                page_source = fetch_text(link, timeout=timeout)
                cache[link] = extract_src(page_source, link)
            except (HTTPError, URLError, TimeoutError, OSError) as exc:
                cache[link] = ""
                failures.append(f"{link} -> {exc}")

            if sleep_seconds:
                time.sleep(sleep_seconds)

        item["src"] = cache[link]
        if cache[link]:
            updated += 1

        print(f"[{index}/{len(items)}] {link} -> {item['src'] or '未提取到'}")

    return len(items), updated, failures


def main() -> int:
    parser = argparse.ArgumentParser(description="遍历标签种类.js 的 link 字段并追加 src 字段。")
    parser.add_argument("path", type=Path, help="标签种类.js 文件路径")
    parser.add_argument("--timeout", type=int, default=20, help="单个页面请求超时时间，默认 20 秒")
    parser.add_argument("--sleep", type=float, default=0.2, help="每次请求后的暂停秒数，默认 0.2")
    parser.add_argument("--only-missing", action="store_true", help="只请求并补齐 src 为空的条目")
    args = parser.parse_args()

    path = args.path
    data, prefix, suffix = load_js_data(path)

    backup = path.with_name(f"{path.name}.bak_{time.strftime('%Y%m%d_%H%M%S')}")
    shutil.copy2(path, backup)

    total, updated, failures = enrich(
        data,
        timeout=args.timeout,
        sleep_seconds=args.sleep,
        only_missing=args.only_missing,
    )
    serialized = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(f"{prefix}{serialized}{suffix}", encoding="utf-8")

    print(f"\n完成：共 {total} 个 link，成功提取 {updated} 个 src。")
    print(f"备份文件：{backup}")
    if failures:
        print("\n请求失败：")
        for failure in failures:
            print(f"- {failure}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
