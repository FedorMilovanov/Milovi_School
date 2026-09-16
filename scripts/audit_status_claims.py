#!/usr/bin/env python3
"""Scan the corpus for STATUS CLAIMS - sentences that assert an award, a title, a
superlative, a foundation date or a record.

These are the highest-risk sentences in the corpus: they are specific, checkable,
and a single wrong one is a factual error a reader can catch. Unlike citations they
are not covered by any gate, because a gate can only check that a URL is live and
specific, not that a sentence is true.

The scanner is deliberately over-inclusive and mechanical: it reports candidate
sentences with their article id and the marker that fired, and nothing else. It
does NOT judge truth - verification is done by hand against a primary source, and
the result is recorded in docs/CONTENT_QUALITY_WAVES.md.

Usage:
    python3 scripts/audit_status_claims.py            # report
    python3 scripts/audit_status_claims.py --json      # machine-readable
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    ROOT / "src/data/articleExpansionParts",
    ROOT / "src/data/deepContents.ts",
]

# Marker -> why it matters. Ordered by how easy the claim is to falsify.
MARKERS: tuple[tuple[str, str], ...] = (
    (r"\bMOF\b|Meilleur Ouvrier de France", "MOF title"),
    (r"Meilleur [Pp]âtissier|Best [Pp]astry [Cc]hef|meilleur chef", "best-pastry-chef title"),
    (r" Champion |champion du monde|World [Cc]hampion|Coupe du [Mm]onde|championne", "championship"),
    (r"Prix |award|Award|récompens|laureat|лауреат|награжд|преми", "award"),
    (r"[Pp]remier |перв(ый|ая|ое) в мире|first in the world|изобрёл|invented|creator of|создатель", "first/inventor"),
    (r"\b(1[6-9]\d\d|20[0-3]\d)\b", "date"),
    (r"сам(ый|ая|ое) |лучш(ий|ая|ее) в мире|world'?s (best|most)|le plus |most famous|легендарн", "superlative"),
    (r"рекорд|record|Гиннесс|Guinness|миров(ой|ого) ", "record"),
    (r"\d+\s*(звезд|étoile|Michelin star|stars)", "Michelin stars"),
    (r"Patrimoine|UNESCO|ЮНЕСКО|patrimoine culturel|inscri(t|te)", "heritage listing"),
)

ENTRY_RE = re.compile(r"(?m)^\s*'([a-z0-9][a-z0-9-]*)'\s*:\s*`((?:\\`|[^`])*)`")
SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-ZА-Я\u00c0-\u017f])")


def sentences_of(text: str) -> list[str]:
    return [s.strip() for s in SENT_SPLIT.split(text) if s.strip()]


def collect() -> list[dict[str, object]]:
    findings: list[dict[str, object]] = []
    for source in SOURCES:
        files = sorted(source.glob("*.ts")) if source.is_dir() else [source]
        for path in files:
            raw = path.read_text(encoding="utf-8")
            for entry in ENTRY_RE.finditer(raw):
                article_id, body = entry.group(1), entry.group(2)
                body = body.replace("\\`", "`")
                for sentence in sentences_of(body):
                    fired = [label for pattern, label in MARKERS if re.search(pattern, sentence)]
                    if fired:
                        findings.append({
                            "articleId": article_id,
                            "file": path.name,
                            "markers": fired,
                            "sentence": sentence[:300],
                        })
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a report")
    parser.add_argument("--marker", help="filter by marker label")
    parser.add_argument("--article", help="filter by article id")
    args = parser.parse_args()

    findings = collect()
    if args.marker:
        findings = [f for f in findings if args.marker in f["markers"]]
    if args.article:
        findings = [f for f in findings if f["articleId"] == args.article]

    if args.json:
        json.dump(findings, sys.stdout, ensure_ascii=False, indent=2)
        print()
        return 0

    counts = Counter(label for f in findings for label in f["markers"])
    print(f"status-claim candidates: {len(findings)} "
          f"across {len({f['articleId'] for f in findings})} articles")
    for label, n in counts.most_common():
        print(f"  {label:24} {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
