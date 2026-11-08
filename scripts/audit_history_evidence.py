#!/usr/bin/env python3
"""Permanent 19-article historical evidence ratchet (source-level, no network)."""
from __future__ import annotations
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "src/data/articles.ts").read_text(encoding="utf-8")
DEEP = (ROOT / "src/data/deepContents.ts").read_text(encoding="utf-8")
HISTORY = (ROOT / "src/data/historyArticles.ts").read_text(encoding="utf-8")
OVERRIDES = (ROOT / "src/data/articleOverrides.ts").read_text(encoding="utf-8")
PARTS = "\n".join(p.read_text(encoding="utf-8") for p in sorted((ROOT / "src/data/articleExpansionParts").glob("part*.ts")))
AUDIT = (ROOT / "docs/research/HISTORY_EVIDENCE_REVIEW_2026-11-08.md").read_text(encoding="utf-8")

IDS = {
    "stohrer-1730", "laduree-1862", "careme-first-celebrity-chef",
    "croissant-history", "escoffier-biography", "brillat-savarin",
    "paris-brest-race-dessert", "creme-brulee-dispute",
    "patissiers-guild-medieval", "french-classics-origins",
    "eclair-histoire-complete", "millefeuille-histoire",
    "opera-gateau-histoire", "buche-noel-histoire",
    "histoire-tartes-francaises", "carnaval-culinaire-histoire",
    "canele-bordeaux-histoire", "financier-histoire",
}
DATE = "2026-11-08"
rows = [line for line in SOURCE.splitlines() if "category: 'histoire-culinaire'" in line]
if len(rows) != len(IDS):
    raise SystemExit(f"Expected {len(IDS)} legacy historical rows, received {len(rows)}")

def entry(text: str, ident: str) -> str:
    pattern = r"(?m)^\s*'" + re.escape(ident) + r"'\s*:\s*" + chr(96) + r"([\s\S]*?)" + chr(96) + r"\s*,"
    found = re.search(pattern, text)
    if not found:
        raise SystemExit(f"Missing complete content entry for {ident}")
    return found.group(1)

def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)

for row in rows:
    ident = re.search(r"\bid:\s*'([^']+)'", row)
    require(ident is not None and ident.group(1) in IDS, f"Unknown history article: {row[:80]}")
    require(f"updatedAt: '{DATE}'" in row, f"Historical edit needs genuine updatedAt: {ident.group(1)}")

risk_markers = {
    "escoffier-biography": ["В 1889 году они вместе взялись за лондонский Savoy", "В 1900 году Эскоффье и Риц были уволены из Savoy"],
    "opera-gateau-histoire": ["десятилетиями судились", "Судебные тяжбы тянулись годами"],
    "brillat-savarin": ["Первым в западной традиции поставил умами"],
    "canele-bordeaux-histoire": ["В 1790 году монастырь Анонсиад был закрыт"],
    "financier-histoire": ["Вторая — ещё более прозаичная: монахини использовали", "Ключевой момент — около 1890 года. Кондитер по имени Ласне"],
    "croissant-history": ["30–40% круассанов в булочных Франции", "Слово «viennoiserie» вошло в парижский словарь именно тогда"],
    "creme-brulee-dispute": ["Пьер Эрме рассказывал:", "Алкоголь испарится при охлаждении"],
    "histoire-tartes-francaises": ["По легенде, в один из загруженных дней Стефани забыла"],
    "carnaval-culinaire-histoire": ["В Рабле (первое издание «Пантагрюэля»", "## Карем и архитектура"],
}
for ident in sorted(IDS):
    content = entry(DEEP, ident)
    appendix = entry(PARTS, ident)
    require(len(content) > 1200 and len(appendix) > 500, f"Thin historical source: {ident}")
    require("## Проверка исторических источников — ноябрь 2026" in appendix, f"Missing evidence review: {ident}")
    require(ident in AUDIT, f"Evidence ledger missing: {ident}")
    for marker in risk_markers.get(ident, []):
        require(marker not in content and marker not in appendix, f"Superseded historical claim returned: {ident}: {marker}")

require("История" in HISTORY and "2026-11-08" in HISTORY and "gallica.bnf.fr/accueil/fr/html/surprenante-patisserie" in HISTORY,
        "Independent essay lost its BnF research revision")
require("carnaval-culinaire-histoire" in SOURCE and "Bugnes и Mardi Gras" in SOURCE,
        "Carnival topic mismatch returned")
require("Hervé This" in PARTS and "Université de Liège" in PARTS,
        "European expert/archival evidence missing")
require("https://www.nouvelle-aquitaine.fr/le-territoire/" in OVERRIDES,
        "Regional counter-evidence missing from public source metadata")

EVIDENCE = (ROOT / "src/data/historyEvidence.ts").read_text(encoding="utf-8")
LIBRARY = (ROOT / "src/data/library.ts").read_text(encoding="utf-8")
require("annotateHistoryEvidence(article.id, appendCanonEditorial" in LIBRARY,
        "Historical claim cards are not rendered for legacy and standalone articles")
require(LIBRARY.count("annotateHistoryEvidence(article.id, appendCanonEditorial") == 2,
        "Each historical article path must render evidence exactly once")
evidence_ids = re.findall(r'(?m)^  "([a-z0-9-]+)": \{', EVIDENCE)
expected = IDS | {"confectionery-profession-history"}
require(len(evidence_ids) == len(expected) and set(evidence_ids) == expected,
        f"Expected exactly 19 individual evidence cards, got {len(evidence_ids)}")
for ident in sorted(expected):
    start = EVIDENCE.find('  "' + ident + '": {')
    require(start >= 0, f"Missing evidence entry: {ident}")
    tail = EVIDENCE.find('\n  "', start + 4)
    if tail < 0:
        tail = EVIDENCE.find("\n} as const", start)
    block = EVIDENCE[start:tail]
    for field in ("verified", "attributed", "uncertain", "sources"):
        require(f'"{field}"' in block, f"History evidence lacks {field}: {ident}")
    require(block.count("https://") >= 2, f"History needs two independent reviewable links: {ident}")
    require(len(block) > 380, f"Evidence note too thin: {ident}")

require("1890: ШВЕЙЦАРЕЦ ЛАСНЕ И БУРЖУАЗИЯ" not in DEEP,
        "Financier history leaked into mille-feuille again")
require("1930: ПЬЕР ДЕФОНТЕНЬ И РОЖДЕНИЕ МАКАРОНА" not in DEEP,
        "Laduree invention headline returned")
require("1566: КОРОЛЕВСКИЙ ЭДИКТ И «ШЕСТЬ ТАЙН МАСТЕРСТВА»" not in DEEP,
        "Guild myth headline returned")
require("Поворотный момент — 1867 год, Всемирная выставка в Париже." not in DEEP,
        "Mille-feuille name myth leaked into classics")
print("OK: 19/19 history evidence cards, source tiers, corrections and 2026 revision dates")
