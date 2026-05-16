#!/usr/bin/env python3
"""Content integrity audit for Milovi School.

Guards against the exact SEO failure that previously slipped through: article
metadata exists, but the body falls back to a generic placeholder because the id
is missing from deepContents.ts.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "src" / "data" / "articles.ts"
DEEP = ROOT / "src" / "data" / "deepContents.ts"

article_ids = set(re.findall(r"id:\s*'([^']+)'", ARTICLES.read_text(encoding="utf-8")))
deep_text = DEEP.read_text(encoding="utf-8")
deep_ids = set(re.findall(r"^\s*'([^']+)'\s*:", deep_text, flags=re.M))

missing = sorted(article_ids - deep_ids)
extra = sorted(deep_ids - article_ids)
if missing or extra:
    raise SystemExit(
        "Content id mismatch\n"
        f"Missing in deepContents.ts: {missing}\n"
        f"Orphan deepContents.ts keys: {extra}"
    )

fallback_markers = [
    "Технологическая логика",
    "Диагностика ошибок",
    "Всё, что не выполняет функцию, лучше убрать",
    "Контент в разработке",
]
for marker in fallback_markers:
    count = deep_text.count(marker)
    if count > 1:
        raise SystemExit(f"Suspicious repeated fallback marker {marker!r}: {count} occurrences")

short = []
for article_id in article_ids:
    match = re.search(rf"'{re.escape(article_id)}'\s*:\s*`([\s\S]*?)`\s*,", deep_text)
    if not match:
        continue
    body = match.group(1).strip()
    if len(body) < 1800:
        short.append((article_id, len(body)))

if short:
    raise SystemExit(f"Suspiciously short article bodies: {short}")

print(f"OK: {len(article_ids)} articles have unique deep content entries.")
