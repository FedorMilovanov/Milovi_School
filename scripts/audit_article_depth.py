#!/usr/bin/env python3
"""Rank every article by editorial depth and flag likely thin content.

This is intentionally diagnostic rather than a hard quality gate. It distinguishes
recipes, techniques, biographies/history and general editorial pieces, because a
compact technical card should not be judged by the same target as a biography.
The integrity audit remains responsible for hard failures such as missing bodies.
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
OUTPUT_DIR = ROOT / "artifacts" / "content-depth-report"

WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*")
URL_RE = re.compile(r"https?://[^\s<>'\"]+")
TAG_RE = re.compile(r"<[^>]+>")


def decode_js(value: str) -> str:
    return value.replace("\\'", "'").replace('\\"', '"').replace("\\n", "\n")


def js_string_field(line: str, field: str) -> str | None:
    marker = f"{field}:"
    start = line.find(marker)
    if start < 0:
        return None
    cursor = start + len(marker)
    while cursor < len(line) and line[cursor].isspace():
        cursor += 1
    if cursor >= len(line) or line[cursor] not in {"'", '"'}:
        return None
    quote = line[cursor]
    cursor += 1
    output: list[str] = []
    escaped = False
    while cursor < len(line):
        char = line[cursor]
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
    for line in text.splitlines():
        id_match = re.search(r"\bid:\s*'([^']+)'", line)
        if not id_match:
            continue
        article_id = id_match.group(1)
        read_time_match = re.search(r"\breadTime:\s*(\d+)", line)
        records[article_id] = {
            "id": article_id,
            "title": js_string_field(line, "title") or article_id,
            "category": js_string_field(line, "category") or "unknown",
            "declaredReadTime": int(read_time_match.group(1)) if read_time_match else 0,
        }
    return records


def parse_bodies(text: str) -> dict[str, str]:
    return {
        article_id: body
        for article_id, body in re.findall(r"^\s*'([^']+)'\s*:\s*`([\s\S]*?)`\s*,", text, flags=re.M)
    }


def article_kind(article_id: str, category: str, title: str) -> str:
    lowered = f"{article_id} {category} {title}".lower()
    if article_id.startswith("recipe-") or "рецепт" in lowered:
        return "recipe"
    if article_id.startswith("tech-") or category == "techniques" or "техника" in lowered:
        return "technique"
    if article_id.startswith("chiffres-"):
        return "data"
    if any(marker in lowered for marker in ("biography", "биограф", "histoire", "history", "истори", "origin", "происхожд")):
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


def metrics(body: str) -> dict[str, int | float]:
    urls = URL_RE.findall(body)
    html_headings = len(re.findall(r"<h[2-4]\b", body, flags=re.I))
    markdown_headings = len(re.findall(r"(?m)^\s*#{2,4}\s+", body))
    bold_heading_blocks = len(re.findall(r"(?m)^\s*\*\*[^*\n]{4,100}\*\*\s*$", body))
    sections = html_headings + markdown_headings + bold_heading_blocks

    html_paragraphs = len(re.findall(r"<p\b", body, flags=re.I))
    markdown_blocks = len([block for block in re.split(r"\n\s*\n", body) if len(WORD_RE.findall(block)) >= 8])
    paragraphs = max(html_paragraphs, markdown_blocks)

    list_items = len(re.findall(r"<li\b|(?m)^\s*(?:[-*]|\d+[.)])\s+", body, flags=re.I))
    plain = URL_RE.sub(" ", body)
    plain = TAG_RE.sub(" ", plain)
    plain = re.sub(r"[`*_>#|]+", " ", plain)
    plain = html.unescape(plain)
    words = WORD_RE.findall(plain)
    characters = len(re.sub(r"\s+", " ", plain).strip())
    sentences = len(re.findall(r"[.!?…]+(?:\s|$)", plain))

    return {
        "words": len(words),
        "characters": characters,
        "sections": sections,
        "paragraphs": paragraphs,
        "listItems": list_items,
        "sourceLinks": len(set(urls)),
        "sentences": sentences,
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


def priority_score(item: dict[str, object]) -> float:
    word_gap = max(0, int(item["targetWords"]) - int(item["words"])) / int(item["targetWords"])
    section_gap = max(0, int(item["targetSections"]) - int(item["sections"])) / int(item["targetSections"])
    paragraph_penalty = 0.25 if int(item["paragraphs"]) < 6 else 0
    source_penalty = 0.12 if int(item["sourceLinks"]) == 0 else 0
    return round(word_gap * 0.62 + section_gap * 0.26 + paragraph_penalty + source_penalty, 4)


article_text = ARTICLES_PATH.read_text(encoding="utf-8")
deep_text = DEEP_PATH.read_text(encoding="utf-8")
articles = parse_articles(article_text)
bodies = parse_bodies(deep_text)

if len(articles) != 155:
    raise SystemExit(f"Depth audit parser expected 155 article records, parsed {len(articles)}")
if set(articles) != set(bodies):
    raise SystemExit(
        "Depth audit id mismatch: "
        f"missing={sorted(set(articles) - set(bodies))}, extra={sorted(set(bodies) - set(articles))}"
    )

report: list[dict[str, object]] = []
for article_id, meta in articles.items():
    kind = article_kind(article_id, str(meta["category"]), str(meta["title"]))
    target_words, target_sections = target_for(kind)
    item = {
        **meta,
        "kind": kind,
        **metrics(bodies[article_id]),
        "targetWords": target_words,
        "targetSections": target_sections,
    }
    item["severity"] = severity_for(item)
    item["priorityScore"] = priority_score(item)
    item["readTimeDelta"] = int(item["declaredReadTime"]) - int(item["estimatedReadTime"])
    report.append(item)

severity_order = {"critical": 0, "high": 1, "medium": 2, "ok": 3}
report.sort(key=lambda item: (severity_order[str(item["severity"])], -float(item["priorityScore"]), int(item["words"])))

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
summary = {
    "articles": len(report),
    "severity": dict(Counter(str(item["severity"]) for item in report)),
    "kinds": dict(Counter(str(item["kind"]) for item in report)),
    "wordCount": {
        "min": min(int(item["words"]) for item in report),
        "median": round(statistics.median(int(item["words"]) for item in report)),
        "mean": round(statistics.mean(int(item["words"]) for item in report)),
        "max": max(int(item["words"]) for item in report),
    },
    "needsExpansion": sum(item["severity"] != "ok" for item in report),
}

(OUTPUT_DIR / "report.json").write_text(
    json.dumps({"summary": summary, "articles": report}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

lines = [
    "# Аудит глубины статей",
    "",
    f"- Статей: {summary['articles']}",
    f"- Требуют расширения или редакторской проверки: {summary['needsExpansion']}",
    f"- Слова: min {summary['wordCount']['min']}, median {summary['wordCount']['median']}, mean {summary['wordCount']['mean']}, max {summary['wordCount']['max']}",
    f"- Уровни: {summary['severity']}",
    "",
    "| Приоритет | ID | Тип | Слов | Разделов | Абзацев | Источников | Заголовок |",
    "|---|---|---:|---:|---:|---:|---:|---|",
]
for item in report:
    if item["severity"] == "ok":
        continue
    title = str(item["title"]).replace("|", "\\|")
    lines.append(
        f"| {item['severity']} | `{item['id']}` | {item['kind']} | {item['words']} / {item['targetWords']} | "
        f"{item['sections']} / {item['targetSections']} | {item['paragraphs']} | {item['sourceLinks']} | {title} |"
    )
(OUTPUT_DIR / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print("Article depth audit")
print(f"- articles: {summary['articles']}")
print(f"- words: min={summary['wordCount']['min']}, median={summary['wordCount']['median']}, mean={summary['wordCount']['mean']}, max={summary['wordCount']['max']}")
print(f"- severity: {summary['severity']}")
print(f"- candidates for expansion/review: {summary['needsExpansion']}")
print("\nTop 40 expansion candidates:")
for index, item in enumerate([item for item in report if item["severity"] != "ok"][:40], start=1):
    print(
        f"{index:02d}. [{str(item['severity']).upper():8}] {item['id']} | {item['words']} words | "
        f"sections {item['sections']}/{item['targetSections']} | paragraphs {item['paragraphs']} | "
        f"sources {item['sourceLinks']} | {item['title']}"
    )

print(f"\nMachine-readable report: {OUTPUT_DIR.relative_to(ROOT) / 'report.json'}")
print(f"Editorial report: {OUTPUT_DIR.relative_to(ROOT) / 'report.md'}")
