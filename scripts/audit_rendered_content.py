#!/usr/bin/env python3
"""Fail the release when the generated article HTML shows source artefacts.

Content/source gates read the TypeScript corpus; SEO/site gates read metadata.
Neither of them proves that a reader actually sees clean prose. This gate reads
the *rendered* article documents after `astro build` and rejects the exact
regressions found in the 2026-10-26 audit: raw ASCII separators, raw markdown
headings, machine ISO-8601 durations in the visible recipe card, headings that
swallowed a paragraph, duplicated title-as-alt, and missing AI provenance for
generated editorial covers.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "articles"
DIGITAL_SOURCE_TYPE = "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"

RAW_EQUALS = re.compile(r"(?m)^\s*={6,}\s*$")
RAW_MD_HEADING = re.compile(r"(?m)^\s*#{2,3}\s+\S")
MACHINE_DURATION = re.compile(r"\bPT\d+[HM]\b")
MAX_HEADING_CHARS = 110

errors: list[str] = []
pages = sorted(DIST.glob("*/index.html"))
if not pages:
    sys.exit("Rendered-content gate: no built article pages found — run npm run build first")

stats = {"pages": len(pages), "rawSeparators": 0, "rawMarkdown": 0,
         "machineDurations": 0, "giantHeadings": 0, "missingProvenance": 0,
         "titleAsAlt": 0}

for page in pages:
    article_id = page.parent.name
    html = page.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    # Island props contain the raw corpus text verbatim. Only visible DOM text
    # can prove what a reader sees, so drop executable/inert payloads first.
    for node in soup(["script", "style", "noscript", "template"]):
        node.decompose()
    visible = soup.get_text("\n")

    if RAW_EQUALS.search(visible):
        stats["rawSeparators"] += 1
        errors.append(f"{article_id}: raw '====' separator visible in article text")
    if RAW_MD_HEADING.search(visible):
        stats["rawMarkdown"] += 1
        errors.append(f"{article_id}: raw '##' markdown heading visible in article text")
    if MACHINE_DURATION.search(visible):
        stats["machineDurations"] += 1
        errors.append(f"{article_id}: unformatted ISO-8601 duration visible (PT..M / PT..H)")

    for heading in soup.find_all(["h1", "h2", "h3", "h4"]):
        text = heading.get_text(" ", strip=True)
        if len(text) > MAX_HEADING_CHARS:
            stats["giantHeadings"] += 1
            errors.append(f"{article_id}: heading of {len(text)} chars swallowed prose: {text[:80]}…")
            break

    hero = soup.select_one("article figure img[itemprop='image']")
    h1 = soup.find("h1")
    if hero and h1:
        alt = (hero.get("alt") or "").strip()
        title = h1.get_text(" ", strip=True)
        if alt and alt == title:
            stats["titleAsAlt"] += 1
            errors.append(f"{article_id}: hero alt duplicates the H1 instead of describing the image")

    # JSON-LD is still needed (we decomposed the DOM copy, not the raw text).
    has_provenance = False
    for raw in re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        flags=re.S,
    ):
        try:
            node = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if node.get("@type") == "Article":
            image = node.get("image")
            if isinstance(image, dict) and image.get("digitalSourceType") == DIGITAL_SOURCE_TYPE:
                has_provenance = True
    if not has_provenance:
        stats["missingProvenance"] += 1
        errors.append(f"{article_id}: Article ImageObject lacks trainedAlgorithmicMedia provenance")

print("Rendered article content gate")
print(f"- article pages: {stats['pages']}")
for key in ("rawSeparators", "rawMarkdown", "machineDurations", "giantHeadings",
            "titleAsAlt", "missingProvenance"):
    print(f"- {key}: {stats[key]}")

if errors:
    print(f"\nFAILED: {len(errors)} rendered-content defects", file=sys.stderr)
    for error in errors[:40]:
        print(f"  - {error}", file=sys.stderr)
    if len(errors) > 40:
        print(f"  … and {len(errors) - 40} more", file=sys.stderr)
    sys.exit(1)
print("All generated article documents render clean editorial prose.")
