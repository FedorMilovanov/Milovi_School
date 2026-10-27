#!/usr/bin/env python3
"""Fail the release when the generated article HTML shows source artefacts.

Content/source gates read the TypeScript corpus; SEO/site gates read metadata.
Neither of them proves that a reader actually sees clean prose. This gate reads
the *rendered* article documents after `astro build` and rejects the exact
regressions found in the 2026-10-26 audit: raw ASCII separators, raw markdown
headings, machine ISO-8601 durations in the visible recipe card, headings that
swallowed a paragraph, duplicated title-as-alt, and missing AI provenance for
generated editorial covers.

Also enforces (2026-10-27) FAQPage schema-to-visible-text 1:1 parity and WCAG
AA contrast tokens. The educational-boundary disclaimer is verified in the
shared Footer source plus the /about/ and /methodology/ pages, which are the
surfaces that describe the project; 404 and search-engine verification files
intentionally have no footer.
"""
from __future__ import annotations

import html as html_lib
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "articles"
DIGITAL_SOURCE_TYPE = "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"
AI_NOTE = "Генеративная редакционная иллюстрация (AI)"

RAW_EQUALS = re.compile(r"(?m)^\s*={6,}\s*$")
RAW_MD_HEADING = re.compile(r"(?m)^\s*#{2,3}\s+\S")
MACHINE_DURATION = re.compile(r"\bPT\d+[HM]\b")
MAX_HEADING_CHARS = 110
WS_RE = re.compile(r"\s+")


def collapse_ws(value: str) -> str:
    return WS_RE.sub(" ", html_lib.unescape(value)).strip()


errors: list[str] = []
pages = sorted(DIST.glob("*/index.html"))
if not pages:
    sys.exit("Rendered-content gate: no built article pages found — run npm run build first")

stats = {"pages": len(pages), "rawSeparators": 0, "rawMarkdown": 0,
         "machineDurations": 0, "giantHeadings": 0, "missingProvenance": 0,
         "titleAsAlt": 0, "generatedBodyFigures": 0, "missingBodyProvenance": 0,
         "faqPages": 0, "faqQuestions": 0, "faqParityFailures": 0}

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

    # FAQPage structured data must be a 1:1 match with visible Q&A text
    # (Google rich-results requirement). Read the JSON-LD from the RAW html
    # because the DOM copy was decomposed above, and compare against the text
    # of the visible <details> FAQ blocks only — not island props or nav.
    raw_ld = re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html, flags=re.S,
    )
    faq_entries: list[tuple[str, str]] = []
    for block in raw_ld:
        try:
            node = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(node, dict) and node.get("@type") == "FAQPage":
            for q in node.get("mainEntity", []):
                if isinstance(q, dict):
                    faq_entries.append((
                        str(q.get("name", "")),
                        str((q.get("acceptedAnswer") or {}).get("text", "")),
                    ))
    if faq_entries:
        stats["faqPages"] += 1
        stats["faqQuestions"] += len(faq_entries)
        details = soup.select("article details")
        visible_faq = " ".join(d.get_text(" ", strip=True) for d in details)
        visible_faq = collapse_ws(visible_faq).casefold()
        for question, answer in faq_entries:
            q_ok = collapse_ws(question).casefold() in visible_faq
            a_ok = collapse_ws(answer).casefold() in visible_faq
            if not (q_ok and a_ok):
                stats["faqParityFailures"] += 1
                errors.append(
                    f"{article_id}: FAQPage Q/A not 1:1 with visible text "
                    f"(question={q_ok}, answer={a_ok}): {question[:70]!r}"
                )

    # Local editorial illustrations are AI-generated; every inline body figure
    # must carry the same visible AI note used by the hero credit. Restricted to
    # body- files: hero- files are article covers whose provenance is asserted
    # separately via the ImageObject digitalSourceType check above.
    for fig in soup.select("article figure"):
        img = fig.find("img")
        src = (img.get("src") or "") if img else ""
        if not src.startswith("/images/articles/body-"):
            continue
        stats["generatedBodyFigures"] += 1
        if AI_NOTE not in fig.get_text(" ", strip=True):
            stats["missingBodyProvenance"] += 1
            errors.append(f"{article_id}: generated body illustration lacks visible AI provenance note: {src}")

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
print(f"- generatedBodyFigures: {stats['generatedBodyFigures']}")
for key in ("rawSeparators", "rawMarkdown", "machineDurations", "giantHeadings",
            "titleAsAlt", "missingProvenance", "missingBodyProvenance",
            "faqPages", "faqQuestions", "faqParityFailures"):
    print(f"- {key}: {stats[key]}")


def relative_luminance(hex_color: str) -> float:
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]

    def linear(value: float) -> float:
        return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4

    r, g, b = (linear(channel) for channel in channels)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(foreground: str, background: str) -> float:
    first, second = sorted(
        (relative_luminance(foreground), relative_luminance(background)),
        reverse=True,
    )
    return (first + 0.05) / (second + 0.05)


# A11y 2026-10-27: axe-core found 430 `color-contrast` (serious) violations
# across 8 routes x 2 themes. They were fixed by the semantic tokens in
# global.css / canon.css. This static ratchet keeps those tokens from drifting
# back below WCAG AA (4.5:1) without needing a browser in CI; the browser
# proof stays the authoritative measurement.
CSS_PATH = ROOT / "src" / "styles" / "global.css"
css_text = CSS_PATH.read_text(encoding="utf-8")
token_contract = (
    # (token declaration to find, backgrounds it must satisfy, min ratio)
    ("--color-stone-400: #645e58", ("#fcfaf8", "#f4efe6", "#fefefd"), 4.5),
    ("--color-stone-500: #5f5953", ("#fcfaf8", "#f4efe6", "#fefefd"), 4.5),
    ("--color-stone-400: #a8a097", ("#0c0a09", "#10100f", "#161412"), 4.5),
    ("--color-stone-500: #b0a89f", ("#0c0a09", "#10100f", "#161412"), 4.5),
    ("--text-accent-strong: #6b4c06", ("#f4efe6",), 4.5),
)
contrast_checked = 0
for declaration, backgrounds, minimum in token_contract:
    if declaration not in css_text:
        errors.append(f"A11y token missing from global.css: {declaration!r}")
        continue
    color = declaration.split(":", 1)[1].strip()
    for background in backgrounds:
        contrast_checked += 1
        ratio = contrast_ratio(color, background)
        if ratio < minimum:
            errors.append(
                f"A11y token {declaration!r} is {ratio:.2f}:1 on {background} "
                f"(needs >= {minimum}:1)"
            )
print(f"- a11y contrast tokens checked: {contrast_checked}")

# Educational boundary (2026-10-27): the library must state, in the shared
# footer and on the pages that describe the project, that its materials are
# not a commercial menu. This is a truth/positioning contract, not SEO copy.
DISCLAIMER = "не являются меню"
footer_src = (ROOT / "src" / "components" / "Footer.tsx").read_text(encoding="utf-8")
if DISCLAIMER not in footer_src:
    errors.append("Footer.tsx lost the educational-boundary disclaimer")
for page_name in ("about", "methodology"):
    page_file = ROOT / "dist" / page_name / "index.html"
    if not page_file.exists():
        errors.append(f"/{page_name}/ page missing (disclaimer cannot be verified)")
    elif DISCLAIMER not in page_file.read_text(encoding="utf-8"):
        errors.append(f"/{page_name}/ page lacks the educational-boundary disclaimer")
print("- educational disclaimer sources checked: 3")

if errors:
    print(f"\nFAILED: {len(errors)} rendered-content defects", file=sys.stderr)
    for error in errors[:40]:
        print(f"  - {error}", file=sys.stderr)
    if len(errors) > 40:
        print(f"  … and {len(errors) - 40} more", file=sys.stderr)
    sys.exit(1)
print("All generated article documents render clean editorial prose.")
