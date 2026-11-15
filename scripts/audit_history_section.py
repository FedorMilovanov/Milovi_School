#!/usr/bin/env python3
"""History section source + generated-site fail-closed contract."""
from __future__ import annotations
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = (root / "src/data/history.ts").read_text(encoding="utf-8")
content = (root / "src/data/historyArticles.ts").read_text(encoding="utf-8")
library = (root / "src/data/library.ts").read_text(encoding="utf-8")
page_source = (root / "src/pages/history.astro").read_text(encoding="utf-8")
index = root / "dist/history/index.html"
assert "export const HISTORY_CATEGORY = 'histoire-culinaire'" in data
assert "historyArticles" in library, "Independent history articles must belong to article corpus"
assert "confectionery-profession-history" in content
assert "content: " in content and len(content) > 8000, "First historical article must not be a thin placeholder"
# Depth floor (2026-11-15 coverage wave): the standalone essay sits outside
# audit_article_depth's articles.ts pipeline, so its structural target lives
# here and mirrors the depth audit's history-biography class (950 words,
# 5 sections). Measured when introduced: 1903 words, 11 sections.
_words = len(re.findall(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+", content))
_sections = len(re.findall(r"(?m)^##\s+\S", content))
assert _words >= 950, f"Standalone history essay below depth floor: {_words} words"
assert _sections >= 5, f"Standalone history essay below section floor: {_sections} sections"
assert "История кондитерского искусства" in page_source
assert index.is_file(), "Build must generate /history/ (no fake route)"
html = index.read_text(encoding="utf-8")
assert 'rel="canonical"' in html and 'https://french.milovicake.ru/history/' in html
assert 'property="og:image"' in html
assert 'application/ld+json' in html
assert 'CollectionPage' in html and 'ItemList' in html and 'BreadcrumbList' in html
assert 'href="/articles/confectionery-profession-history/"' in html
assert 'id="profession"' in html and 'id="desserts"' in html and 'id="culture"' in html
assert 'id="main-content"' in html and '<h1' in html
assert re.search(r'href="/articles/[^"]+/"', html)
assert not re.search(r'href="/articles/(?:undefined|null|todo)/"', html)
article_html = root / "dist/articles/confectionery-profession-history/index.html"
assert article_html.is_file(), "Featured School article must have a real route"
article_text = article_html.read_text(encoding="utf-8")
assert 'https://french.milovicake.ru/history/' in article_text, "Historical article must bind to its CollectionPage"
assert 'Абрахам Босс' in article_text, "Primary-source trail missing"
print("OK: School history page/article route + SEO/collection contract")
