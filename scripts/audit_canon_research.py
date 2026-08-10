#!/usr/bin/env python3
"""Fail-closed Product transfer contract for verified Le Canon Sucré Research Wave 2."""
from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data" / "canon-research.ts"
CANON_DATA = ROOT / "src" / "data" / "canon-media.ts"
PAGE = ROOT / "dist" / "canon" / "index.html"

EXPECTED_MILESTONES = 16
EXPECTED_CANON_WORKS = 15

if not DATA.exists():
    raise SystemExit("[canon-research] Missing src/data/canon-research.ts")
if not CANON_DATA.exists():
    raise SystemExit("[canon-research] Missing src/data/canon-media.ts")

source = DATA.read_text("utf-8")
media_source = CANON_DATA.read_text("utf-8")

milestone_ids = re.findall(r"(?m)^\s*id:\s*'([^']+)'", source)
if len(milestone_ids) != EXPECTED_MILESTONES:
    raise SystemExit(
        f"[canon-research] Expected {EXPECTED_MILESTONES} research milestones, found {len(milestone_ids)}"
    )
if len(set(milestone_ids)) != len(milestone_ids):
    raise SystemExit("[canon-research] Duplicate research milestone id")

canon_ids = set(
    quoted or bare
    for quoted, bare in re.findall(r"(?m)^\s*(?:'([^']+)'|([A-Za-z0-9_-]+))\s*:\s*\{\s*\n\s*image\s*:", media_source)
)
if len(canon_ids) != EXPECTED_CANON_WORKS:
    raise SystemExit(f"[canon-research] Expected {EXPECTED_CANON_WORKS} Canon media ids, found {len(canon_ids)}")

work_refs: list[str] = []
for raw in re.findall(r"workIds:\s*\[([^\]]+)\]", source):
    work_refs.extend(re.findall(r"'([^']+)'", raw))
referenced_ids = set(work_refs)
unknown_refs = sorted(referenced_ids - canon_ids)
if unknown_refs:
    raise SystemExit(f"[canon-research] Research milestone references unknown Canon ids: {unknown_refs}")
missing_coverage = sorted(canon_ids - referenced_ids)
if missing_coverage:
    raise SystemExit(f"[canon-research] Documentary chronology does not cover Canon works: {missing_coverage}")

required_boundaries = [
    'не современным событию документом',
    'а не доказательство национального изобретения',
    'а не дата изобретения',
    'не переносит эти записи задним числом',
    'не объявляет их одним и тем же десертом',
    'не подтверждают историю случайной ошибки',
    'показывает этот конфликт честно',
    'Прямая линия «Сатурналии → современная galette» как факт не публикуется',
]
folded_source = source.casefold()
missing_boundaries = [phrase for phrase in required_boundaries if phrase.casefold() not in folded_source]
if missing_boundaries:
    raise SystemExit(f"[canon-research] Fail-closed wording boundary disappeared: {missing_boundaries}")

print("# Le Canon Sucré Research transfer gate")
print(f"- PASS: {len(milestone_ids)} bounded documentary milestones")
print(f"- PASS: chronology covers all {len(canon_ids)} Canon works")
print("- PASS: critical fail-closed wording boundaries preserved")

if PAGE.exists():
    soup = BeautifulSoup(PAGE.read_text("utf-8"), "html.parser")
    sections = soup.select('.canon-research')
    if len(sections) != 1:
        raise SystemExit(f"[canon-research] Generated /canon/ must contain exactly one documentary chronology section, found {len(sections)}")
    section = sections[0]

    milestones = section.select('.canon-research-milestone')
    if len(milestones) != EXPECTED_MILESTONES:
        raise SystemExit(
            f"[canon-research] Generated chronology expected {EXPECTED_MILESTONES} milestones, found {len(milestones)}"
        )

    if section.select('img, picture, source'):
        raise SystemExit("[canon-research] Historical Research section must not publish archive imagery without item-level rights review")

    interlude = section.select_one('.canon-legend-document')
    if interlude is None:
        raise SystemExit("[canon-research] Missing LÉGENDE / DOCUMENT interlude")
    interlude_text = ' '.join(interlude.stripped_strings)
    if 'LÉGENDE' not in interlude_text or 'DOCUMENT' not in interlude_text:
        raise SystemExit("[canon-research] LÉGENDE / DOCUMENT labels are incomplete")

    links = section.select('a[href^="#canon-"]')
    if not links:
        raise SystemExit("[canon-research] Research section exposes no links back to Canon works")
    rendered_work_ids = {link.get('href', '').removeprefix('#canon-') for link in links if link.get('href')}
    missing_rendered_coverage = sorted(canon_ids - rendered_work_ids)
    if missing_rendered_coverage:
        raise SystemExit(f"[canon-research] Rendered chronology does not link back to Canon works: {missing_rendered_coverage}")

    missing_destinations = []
    for link in links:
        href = link.get('href', '')
        if not href or soup.select_one(href) is None:
            missing_destinations.append(href or '(missing href)')
    if missing_destinations:
        raise SystemExit(f"[canon-research] Broken in-collection research destinations: {missing_destinations}")

    if section.select_one('.canon-timeline-placeholder, .canon-research-placeholder') is not None:
        raise SystemExit("[canon-research] Placeholder research UI is forbidden in generated Canon")

    print(f"- PASS: generated chronology renders {len(milestones)} milestones exactly once")
    print("- PASS: Research section contains no historical image/facsimile assets")
    print(f"- PASS: Research links return to all {len(canon_ids)} Canon works")
    print("- PASS: Tatin LÉGENDE / DOCUMENT interlude present")
