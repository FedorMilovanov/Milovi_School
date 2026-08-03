#!/usr/bin/env python3
"""Audit all published article bodies after editorial enrichment.

The site keeps the original corpus in deepContents.ts and appends researched
French-source expansion modules at build time through articleExpansions.ts. This audit
mirrors that exact merge, applies metadata overrides, recalculates read time, and
fails CI if a published article remains below its type-specific depth target.
"""
from __future__ import annotations

import html
import json
import math
import re
import statistics
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES_PATH = ROOT / "src" / "data" / "articles.ts"
DEEP_PATH = ROOT / "src" / "data" / "deepContents.ts"
EXPANSIONS_DIR = ROOT / "src" / "data" / "articleExpansionParts"
OVERRIDES_PATH = ROOT / "src" / "data" / "articleOverrides.ts"
OUTPUT_DIR = ROOT / "artifacts" / "content-depth-report"

WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*")
URL_RE = re.compile(r"https?://[^\s<>'\"]+")
TAG_RE = re.compile(r"<[^>]+>")
ARTICLE_START_RE = re.compile(r"(?m)^\s*\{\s*id:\s*'([^']+)'")
TEMPLATE_ENTRY_RE = re.compile(r"(?m)^\s*'([^']+)'\s*:\s*`((?:\\`|[^`])*)`\s*,")


def decode_js(value: str) -> str:
    return (
        value.replace("\\`", "`")
        .replace("\\${", "${")
        .replace("\\'", "'")
        .replace('\\"', '"')
        .replace("\\n", "\n")
    )


def js_string_field(chunk: str, field: str) -> str | None:
    marker_match = re.search(rf"\b{re.escape(field)}\s*:", chunk)
    if not marker_match:
        return None
    cursor = marker_match.end()
    while cursor < len(chunk) and chunk[cursor].isspace():
        cursor += 1
    if cursor >= len(chunk) or chunk[cursor] not in {"'", '"'}:
        return None
    quote = chunk[cursor]
    cursor += 1
    output: list[str] = []
    escaped = False
    while cursor < len(chunk):
        char = chunk[cursor]
        if escaped:
            output.append("\\" + char)
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == quote:
            return decode_js("".join(output))
        else:
            output.append(char)
        cursor += 1
    return None


def parse_articles(text: str) -> dict[str, dict[str, object]]:
    records: dict[str, dict[str, object]] = {}
    starts = list(ARTICLE_START_RE.finditer(text))
    for index, match in enumerate(starts):
        chunk_end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        chunk = text[match.start():chunk_end]
        article_id = match.group(1)
        read_time_match = re.search(r"\breadTime\s*:\s*(\d+)", chunk)
        records[article_id] = {
            "id": article_id,
            "title": js_string_field(chunk, "title") or article_id,
            "category": js_string_field(chunk, "category") or "unknown",
            "declaredReadTime": int(read_time_match.group(1)) if read_time_match else 0,
            "metadataSourceUrl": js_string_field(chunk, "sourceUrl") or "",
            "metadataSourceLabel": js_string_field(chunk, "sourceLabel") or "",
        }
    return records


def parse_template_entries(text: str) -> dict[str, str]:
    return {
        article_id: decode_js(body)
        for article_id, body in TEMPLATE_ENTRY_RE.findall(text)
    }


def parse_overrides(text: str) -> dict[str, dict[str, str]]:
    marker = "export const articleOverrides"
    if marker not in text:
        return {}
    section = text.split(marker, 1)[1]
    records: dict[str, dict[str, str]] = {}
    pattern = re.compile(
        r"(?m)^\s*'([^']+)'\s*:\s*Object\.freeze\(\{([\s\S]*?)\}\),"
    )
    for article_id, chunk in pattern.findall(section):
        item: dict[str, str] = {}
        for field in ("title", "excerpt", "sourceUrl", "sourceLabel"):
            value = js_string_field(chunk, field)
            if value is not None:
                item[field] = value
        records[article_id] = item
    return records


def article_kind(article_id: str, category: str, title: str) -> str:
    lowered = f"{article_id} {category} {title}".lower()
    if article_id.startswith("recipe-") or category == "recipes" or "рецепт" in lowered:
        return "recipe"
    if article_id.startswith("tech-") or category == "techniques" or "техника" in lowered:
        return "technique"
    if article_id.startswith("chiffres-"):
        return "data"
    if any(marker in lowered for marker in (
        "biography", "биограф", "histoire", "history", "истори", "origin", "происхожд"
    )):
        return "history-biography"
    return "editorial"


def target_for(kind: str) -> tuple[int, int]:
    return {
        "recipe": (650, 4),
        "technique": (700, 4),
        "data": (750, 4),
        "history-biography": (950, 5),
        "editorial": (850, 4),
    }[kind]


def metrics(body: str, metadata_source_url: str) -> dict[str, int | float]:
    body_urls = set(URL_RE.findall(body))
    all_urls = set(body_urls)
    if metadata_source_url:
        all_urls.add(metadata_source_url)

    sections = (
        len(re.findall(r"<h[2-4]\b", body, flags=re.I))
        + len(re.findall(r"(?m)^\s*#{2,4}\s+", body))
        + len(re.findall(r"(?m)^\s*\*\*[^*\n]{4,120}\*\*", body))
        + len(re.findall(r"(?im)^\s*(?:<p[^>]*>\s*)?<strong>[^<]{4,120}</strong>", body))
    )
    html_paragraphs = len(re.findall(r"<p\b", body, flags=re.I))
    markdown_blocks = len([
        block for block in re.split(r"\n\s*\n", body)
        if len(WORD_RE.findall(block)) >= 8
    ])
    paragraphs = max(html_paragraphs, markdown_blocks)
    list_items = len(re.findall(r"<li\b|^\s*(?:[-*]|\d+[.)])\s+", body, flags=re.I | re.M))

    plain = URL_RE.sub(" ", body)
    plain = TAG_RE.sub(" ", plain)
    plain = re.sub(r"[`*_>#|]+", " ", plain)
    plain = html.unescape(plain)
    words = WORD_RE.findall(plain)

    return {
        "words": len(words),
        "characters": len(re.sub(r"\s+", " ", plain).strip()),
        "sections": sections,
        "paragraphs": paragraphs,
        "listItems": list_items,
        "bodySourceLinks": len(body_urls),
        "sourceLinks": len(all_urls),
        "sentences": len(re.findall(r"[.!?…]+(?:\s|$)", plain)),
        "estimatedReadTime": max(1, math.ceil(len(words) / 180)),
    }


def severity_for(item: dict[str, object]) -> str:
    words = int(item["words"])
    characters = int(item["characters"])
    sections = int(item["sections"])
    target_words = int(item["targetWords"])
    target_sections = int(item["targetSections"])

    if words < 420 or characters < 2400:
        return "critical"
    if words < round(target_words * 0.68) or sections < max(2, target_sections - 2):
        return "high"
    if words < target_words or sections < target_sections:
        return "medium"
    return "ok"


article_text = ARTICLES_PATH.read_text(encoding="utf-8")
deep_text = DEEP_PATH.read_text(encoding="utf-8")
expansion_text = "\n".join(path.read_text(encoding="utf-8") for path in sorted(EXPANSIONS_DIR.glob("part*.ts")))
overrides_text = OVERRIDES_PATH.read_text(encoding="utf-8")

articles = parse_articles(article_text)
bodies = parse_template_entries(deep_text)
expansions = parse_template_entries(expansion_text)
overrides = parse_overrides(overrides_text)

if len(articles) != 155:
    raise SystemExit(f"Depth audit expected 155 article records, parsed {len(articles)}")
if set(articles) != set(bodies):
    raise SystemExit(
        "Depth audit id mismatch: "
        f"missing={sorted(set(articles) - set(bodies))}, "
        f"extra={sorted(set(bodies) - set(articles))}"
    )
if len(expansions) != 155:
    raise SystemExit(f"Depth audit expected 155 researched expansions, parsed {len(expansions)}")
unknown = (set(expansions) | set(overrides)) - set(articles)
if unknown:
    raise SystemExit(f"Depth audit found unknown enrichment ids: {sorted(unknown)}")

for article_id, override in overrides.items():
    if "title" in override:
        articles[article_id]["title"] = override["title"]
    if "sourceUrl" in override:
        articles[article_id]["metadataSourceUrl"] = override["sourceUrl"]
    if "sourceLabel" in override:
        articles[article_id]["metadataSourceLabel"] = override["sourceLabel"]

for article_id, expansion in expansions.items():
    bodies[article_id] = f"{bodies[article_id].strip()}\n\n{expansion.strip()}"

report: list[dict[str, object]] = []
for article_id, meta in articles.items():
    kind = article_kind(article_id, str(meta["category"]), str(meta["title"]))
    target_words, target_sections = target_for(kind)
    article_metrics = metrics(bodies[article_id], str(meta["metadataSourceUrl"]))
    item = {
        **meta,
        "kind": kind,
        **article_metrics,
        "targetWords": target_words,
        "targetSections": target_sections,
        "publishedReadTime": max(
            int(meta["declaredReadTime"]),
            int(article_metrics["estimatedReadTime"]),
        ),
        "expanded": article_id in expansions,
    }
    item["severity"] = severity_for(item)
    item["readTimeDelta"] = int(item["publishedReadTime"]) - int(item["estimatedReadTime"])
    report.append(item)

severity_order = {"critical": 0, "high": 1, "medium": 2, "ok": 3}
report.sort(key=lambda item: (
    severity_order[str(item["severity"])],
    int(item["words"]),
    str(item["id"]),
))

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
summary = {
    "articles": len(report),
    "expandedArticles": len(expansions),
    "addedEditorialWords": sum(
        metrics(expansion, "")["words"] for expansion in expansions.values()
    ),
    "severity": dict(Counter(str(item["severity"]) for item in report)),
    "kinds": dict(Counter(str(item["kind"]) for item in report)),
    "wordCount": {
        "min": min(int(item["words"]) for item in report),
        "median": round(statistics.median(int(item["words"]) for item in report)),
        "mean": round(statistics.mean(int(item["words"]) for item in report)),
        "max": max(int(item["words"]) for item in report),
    },
    "needsExpansion": sum(item["severity"] != "ok" for item in report),
    "missingMetadataSource": sum(not item["metadataSourceUrl"] for item in report),
    "readTimeMismatches": sum(abs(int(item["readTimeDelta"])) >= 2 for item in report),
}

(OUTPUT_DIR / "report.json").write_text(
    json.dumps({"summary": summary, "articles": report}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

lines = [
    "# Аудит глубины статей после французского редакционного добора",
    "",
    f"- Статей: {summary['articles']}",
    f"- Дополнено статей: {summary['expandedArticles']}",
    f"- Добавлено редакционных слов: {summary['addedEditorialWords']}",
    f"- Осталось ниже целевого уровня: {summary['needsExpansion']}",
    f"- Без источника в метаданных: {summary['missingMetadataSource']}",
    f"- Слова: min {summary['wordCount']['min']}, median {summary['wordCount']['median']}, "
    f"mean {summary['wordCount']['mean']}, max {summary['wordCount']['max']}",
    f"- Уровни: {summary['severity']}",
    "",
    "| Статус | ID | Тип | Слов | Разделов | Источников | Заголовок |",
    "|---|---|---:|---:|---:|---:|---|",
]
for item in report:
    title = str(item["title"]).replace("|", "\\|")
    lines.append(
        f"| {item['severity']} | `{item['id']}` | {item['kind']} | "
        f"{item['words']} / {item['targetWords']} | "
        f"{item['sections']} / {item['targetSections']} | "
        f"{item['sourceLinks']} | {title} |"
    )
(OUTPUT_DIR / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print("Article depth audit after French-source enrichment")
print(f"- articles: {summary['articles']}")
print(f"- expanded: {summary['expandedArticles']}")
print(f"- added editorial words: {summary['addedEditorialWords']}")
print(
    f"- words: min={summary['wordCount']['min']}, "
    f"median={summary['wordCount']['median']}, "
    f"mean={summary['wordCount']['mean']}, max={summary['wordCount']['max']}"
)
print(f"- severity: {summary['severity']}")
print(f"- candidates still below target: {summary['needsExpansion']}")
print(f"- missing metadata source: {summary['missingMetadataSource']}")
print(f"- read-time mismatches (2+ min): {summary['readTimeMismatches']}")
print(f"- report: {OUTPUT_DIR.relative_to(ROOT) / 'report.json'}")

if summary["needsExpansion"] != 0:
    raise SystemExit("Article depth gate failed: one or more articles remain below target")
if summary["missingMetadataSource"] != 0:
    raise SystemExit("Article source gate failed: one or more articles lack metadata source")
