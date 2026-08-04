#!/usr/bin/env python3
"""Fail publication when researched article copy contains editorial scaffolding or weak sourcing."""
from __future__ import annotations

import itertools
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ARTICLES_PATH = ROOT / "src" / "data" / "articles.ts"
DEEP_PATH = ROOT / "src" / "data" / "deepContents.ts"
EXPANSIONS_DIR = ROOT / "src" / "data" / "articleExpansionParts"
OUTPUT_DIR = ROOT / "artifacts" / "editorial-quality-report"

EXPECTED_ARTICLES = 155
SOURCE_HEADING = "## Французские источники и первичные материалы"
ENTRY_RE = re.compile(r"(?m)^\s*'([^']+)'\s*:\s*`((?:\\`|[^`])*)`\s*,")
ARTICLE_START_RE = re.compile(r"(?m)^\s*\{\s*id:\s*'([^']+)'")
MARKDOWN_URL_RE = re.compile(r"\[[^\]]+\]\((https?://[^)\s]+)\)")
WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*")

TRUSTED_DOMAINS = {
    "academiedugout.fr", "ferrandi-paris.com", "cacao-barry.com",
    "gallica.bnf.fr", "essentials.valrhona.com", "eduscol.education.fr",
    "referentiels-professionnels.eduscol.education.fr", "bnf.fr",
    "catalogue.bnf.fr", "catalogue.ina.fr", "fr.wikisource.org",
    "meilleurduchef.com", "pierreherme.com", "philippeconticini.fr",
    "mercotte.fr", "ritzparis.com", "ritzparislecomptoir.com",
    "dominiqueansel.com", "maison-kayser.com", "jacquesgenin.fr",
    "yanncouvreur.com", "christophe-felder.com", "valrhona.com",
    "valrhona-collection.com", "lapatisseriecyrillignac.com",
    "christophemichalak.com", "inao.gouv.fr", "agreste.agriculture.gouv.fr",
    "insee.fr", "agriculture.gouv.fr", "legifrance.gouv.fr",
    "service-public.fr", "travail-emploi.gouv.fr",
    "meilleursouvriersdefrance.info", "dalloyau.fr",
    "college-culinaire-de-france.fr", "ducasse-edition.com",
    "cinqsensparis.com", "stohrer.fr", "laduree.fr", "cedric-grolet.com",
    "delicatisserie.com", "elle-et-vire.com", "leclairdegenie.com",
    "baillardran.com", "legateaubasque.com", "angelina-paris.fr",
    "calisson.com", "clementfaugier.fr", "nicolaspaciello.com",
    "poilane.com", "latartetropezienne.fr", "editions-larousse.fr",
    "theworlds50best.com", "jamesbeard.org", "bbc.com",
    "cuisineactuelle.fr", "cultures-sucre.com", "visit.alsace",
}

GENERIC_PATHS = {
    "", "/", "/fr", "/fr/", "/en", "/en/", "/recettes", "/recettes/",
    "/articles", "/articles/", "/univers", "/univers/", "/search", "/recherche",
}

META_PATTERNS = {
    "authoring_instruction": re.compile(
        r"(?i)\b(?:статья|материал|текст|биография|заголовок|раздел)\s+"
        r"(?:должн\w*|нужно|следует|лучше|полезно|может|становится)"
    ),
    "article_reference": re.compile(
        r"(?i)\b(?:в|для|при подготовке)\s+(?:этой\s+|данной\s+)?стать[ьею]"
    ),
    "editorial_scaffolding": re.compile(
        r"(?i)\bредакци\w*\s+(?:должн\w*|решени\w*|провер\w*|"
        r"адаптац\w*|реконструкц\w*|не\s+должн\w*)"
    ),
    "editorial_heading": re.compile(r"(?im)^#{2,4}\s+[^\n]*редакцион[^\n]*$"),
    "assistant_voice": re.compile(r"(?i)\bв этой статье мы\b"),
}

BANNED_PHRASES = {
    "Ogre de Carrouselberg": "unsupported chef attribution",
    "редакционная адаптация": "editorial note leaked into published copy",
    "редакционная реконструкция": "editorial note leaked into published copy",
    "заголовок следует": "authoring instruction leaked into published copy",
    "статья должна": "authoring instruction leaked into published copy",
}

REQUIRED_DATA_SOURCES = {
    "chiffres-marche-15mlrd": {"insee.fr", "agreste.agriculture.gouv.fr"},
    "chiffres-macarons-laduree-herme": {"pierreherme.com", "laduree.fr"},
    "chiffres-education-mof": {
        "referentiels-professionnels.eduscol.education.fr",
        "service-public.fr", "travail-emploi.gouv.fr",
    },
    "chiffres-luxury-desserts": {"pierreherme.com", "ritzparislecomptoir.com"},
    "chiffres-anatomie-gateau": {"ferrandi-paris.com", "cacao-barry.com", "essentials.valrhona.com"},
}


def decode_js(value: str) -> str:
    return (
        value.replace("\\`", "`")
        .replace("\\${", "${")
        .replace("\\'", "'")
        .replace('\\"', '"')
        .replace("\\n", "\n")
    )


def parse_entries(text: str) -> dict[str, str]:
    return {article_id: decode_js(body) for article_id, body in ENTRY_RE.findall(text)}


def parse_article_ids(text: str) -> set[str]:
    return {match.group(1) for match in ARTICLE_START_RE.finditer(text)}


def domain(url: str) -> str:
    return urlsplit(url).netloc.lower().removeprefix("www.")


def is_specific(url: str) -> bool:
    parsed = urlsplit(url)
    path = parsed.path.rstrip("/") or "/"
    return path not in GENERIC_PATHS and len([part for part in path.split("/") if part]) >= 1


def normalized_ngrams(text: str, size: int = 5) -> set[tuple[str, ...]]:
    text = text.split(SOURCE_HEADING, 1)[0].lower()
    words = [word.lower() for word in WORD_RE.findall(text)]
    return {tuple(words[index:index + size]) for index in range(max(0, len(words) - size + 1))}


article_ids = parse_article_ids(ARTICLES_PATH.read_text(encoding="utf-8"))
base_entries = parse_entries(DEEP_PATH.read_text(encoding="utf-8"))
expansion_entries: dict[str, str] = {}
duplicate_ids: list[str] = []
for path in sorted(EXPANSIONS_DIR.glob("part*.ts")):
    for article_id, body in parse_entries(path.read_text(encoding="utf-8")).items():
        if article_id in expansion_entries:
            duplicate_ids.append(article_id)
        expansion_entries[article_id] = body

issues: list[dict[str, object]] = []

def issue(article_id: str, code: str, detail: str) -> None:
    issues.append({"articleId": article_id, "code": code, "detail": detail})

if len(article_ids) != EXPECTED_ARTICLES:
    issue("__catalog__", "article_count", f"expected {EXPECTED_ARTICLES}, found {len(article_ids)}")
if len(base_entries) != EXPECTED_ARTICLES:
    issue("__catalog__", "base_count", f"expected {EXPECTED_ARTICLES}, found {len(base_entries)}")
if len(expansion_entries) != EXPECTED_ARTICLES:
    issue("__catalog__", "expansion_count", f"expected {EXPECTED_ARTICLES}, found {len(expansion_entries)}")
if duplicate_ids:
    issue("__catalog__", "duplicate_expansion_ids", ", ".join(sorted(set(duplicate_ids))))
if article_ids != set(base_entries) or article_ids != set(expansion_entries):
    issue(
        "__catalog__",
        "id_mismatch",
        f"article/base/expansion ids differ: articles={len(article_ids)}, base={len(base_entries)}, expansions={len(expansion_entries)}",
    )

source_counts: list[int] = []
trusted_counts: Counter[str] = Counter()
for article_id in sorted(article_ids & set(base_entries) & set(expansion_entries)):
    base = base_entries[article_id]
    expansion = expansion_entries[article_id]
    merged = f"{base}\n\n{expansion}"

    heading_count = expansion.count(SOURCE_HEADING)
    if heading_count != 1:
        issue(article_id, "source_heading", f"expected one source heading, found {heading_count}")

    urls = list(dict.fromkeys(MARKDOWN_URL_RE.findall(expansion)))
    source_counts.append(len(urls))
    if len(urls) < 2:
        issue(article_id, "source_count", f"expected at least 2 unique source links, found {len(urls)}")

    domains = {domain(url) for url in urls}
    trusted = sorted(domains & TRUSTED_DOMAINS)
    for trusted_domain in trusted:
        trusted_counts[trusted_domain] += 1
    if not trusted:
        issue(article_id, "trusted_source", f"no recognized primary or professional source domain: {sorted(domains)}")
    if urls and not any(is_specific(url) for url in urls):
        issue(article_id, "generic_sources", "all source links point to generic home or index pages")

    for name, pattern in META_PATTERNS.items():
        match = pattern.search(merged)
        if match:
            issue(article_id, name, match.group(0))

    lowered = merged.casefold()
    for phrase, reason in BANNED_PHRASES.items():
        if phrase.casefold() in lowered:
            issue(article_id, "banned_phrase", f"{reason}: {phrase}")

    if article_id in REQUIRED_DATA_SOURCES:
        required = REQUIRED_DATA_SOURCES[article_id]
        if not required.issubset(domains):
            issue(
                article_id,
                "required_data_sources",
                f"missing {sorted(required - domains)}; found {sorted(domains)}",
            )

# Detect copied research filler. Source sections are removed before 5-gram comparison.
ngrams = {article_id: normalized_ngrams(body) for article_id, body in expansion_entries.items()}
for left, right in itertools.combinations(sorted(ngrams), 2):
    a, b = ngrams[left], ngrams[right]
    if not a or not b:
        continue
    overlap = len(a & b) / len(a | b)
    if overlap >= 0.25:
        issue("__corpus__", "near_duplicate_expansions", f"{left} vs {right}: Jaccard={overlap:.3f}")

summary = {
    "articles": len(article_ids),
    "baseEntries": len(base_entries),
    "expansionEntries": len(expansion_entries),
    "issues": len(issues),
    "sourceLinks": {
        "min": min(source_counts) if source_counts else 0,
        "max": max(source_counts) if source_counts else 0,
        "mean": round(sum(source_counts) / len(source_counts), 2) if source_counts else 0,
        "total": sum(source_counts),
    },
    "trustedDomainsUsed": len(trusted_counts),
    "topTrustedDomains": trusted_counts.most_common(15),
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(OUTPUT_DIR / "report.json").write_text(
    json.dumps({"summary": summary, "issues": issues}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

lines = [
    "# Editorial quality audit",
    "",
    f"- Articles: {summary['articles']}",
    f"- Base entries: {summary['baseEntries']}",
    f"- Expansion entries: {summary['expansionEntries']}",
    f"- Source links: {summary['sourceLinks']['total']} total; min {summary['sourceLinks']['min']}; mean {summary['sourceLinks']['mean']}",
    f"- Trusted domains used: {summary['trustedDomainsUsed']}",
    f"- Issues: {summary['issues']}",
    "",
]
if issues:
    lines.extend(["| Article | Code | Detail |", "|---|---|---|"])
    for item in issues:
        detail = str(item["detail"]).replace("|", "\\|").replace("\n", " ")
        lines.append(f"| `{item['articleId']}` | `{item['code']}` | {detail} |")
else:
    lines.append("All editorial quality gates passed.")
(OUTPUT_DIR / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print("Editorial quality audit")
print(f"- articles: {summary['articles']}")
print(f"- expansion source links: total={summary['sourceLinks']['total']}, min={summary['sourceLinks']['min']}, mean={summary['sourceLinks']['mean']}")
print(f"- trusted domains used: {summary['trustedDomainsUsed']}")
print(f"- issues: {summary['issues']}")
print(f"- report: {OUTPUT_DIR.relative_to(ROOT) / 'report.json'}")

if issues:
    raise SystemExit("Editorial quality gate failed")
