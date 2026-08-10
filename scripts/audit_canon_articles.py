#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'src' / 'data' / 'canonArticles.ts'
CONTENT = ROOT / 'src' / 'data' / 'canonArticleContents.ts'
LIBRARY = ROOT / 'src' / 'data' / 'canon-library.ts'
DEEP = ROOT / 'src' / 'data' / 'deepContents.ts'
EXPANSIONS = ROOT / 'src' / 'data' / 'articleExpansionParts'
APPENDICES = ROOT / 'src' / 'data' / 'canonArticleAppendices.ts'

EXPECTED_EXACT = {
    'genin-tarte-au-citron-canon',
    'herme-2000-feuilles-canon',
}
EXPECTED_BINDING_COUNT = 15
PREMIUM_MIN_WORDS = 1000
PREMIUM_MIN_SECTIONS = 5
LEGACY_MIN_BODY_SOURCES = 2
SUPERSEDED_CANON_HISTORY_BINDINGS = {
    'paris-brest-race-dessert',
    'eclair-histoire-complete',
    'opera-gateau-histoire',
}
REQUIRED_SAFE_BINDINGS = {
    'recipe-paris-brest-classique',
    'recipe-eclairs-adam',
    'recipe-opera-dalloyau',
    *EXPECTED_EXACT,
}
WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*")
SECTION_RE = re.compile(r'(?m)^##\s+')
ENTRY_RE = re.compile(r"(?m)^\s*'([^']+)'\s*:\s*`([\s\S]*?)`\s*,")
URL_RE = re.compile(r"\[[^\]]+\]\((https?://[^)\s]+)\)")
SOURCE_HEADING = '## Французские источники и первичные материалы'

for path in (META, CONTENT, LIBRARY, DEEP, APPENDICES):
    if not path.exists():
        raise SystemExit(f'[canon-articles] Missing {path.relative_to(ROOT)}')
if not EXPANSIONS.exists():
    raise SystemExit(f'[canon-articles] Missing {EXPANSIONS.relative_to(ROOT)}')

meta_text = META.read_text('utf-8')
content_text = CONTENT.read_text('utf-8')
library_text = LIBRARY.read_text('utf-8')
deep_text = DEEP.read_text('utf-8')
appendix_text = APPENDICES.read_text('utf-8')
expansion_text = '\n'.join(path.read_text('utf-8') for path in sorted(EXPANSIONS.glob('part*.ts')))

meta_ids = set(re.findall(r"(?m)^\s*id:\s*'([^']+)'", meta_text))
exact_contents = {article_id: body for article_id, body in ENTRY_RE.findall(content_text)}
legacy_contents = {article_id: body for article_id, body in ENTRY_RE.findall(deep_text)}
expansion_contents = {article_id: body for article_id, body in ENTRY_RE.findall(expansion_text)}
appendix_contents = {article_id: body for article_id, body in ENTRY_RE.findall(appendix_text)}

if meta_ids != EXPECTED_EXACT:
    raise SystemExit(f'[canon-articles] Metadata ids mismatch: expected={sorted(EXPECTED_EXACT)}, found={sorted(meta_ids)}')
if set(exact_contents) != EXPECTED_EXACT:
    raise SystemExit(f'[canon-articles] Content ids mismatch: expected={sorted(EXPECTED_EXACT)}, found={sorted(exact_contents)}')

binding_list = re.findall(r"articleId:\s*'([^']+)'", library_text)
bindings = set(binding_list)
if len(binding_list) != EXPECTED_BINDING_COUNT or len(bindings) != EXPECTED_BINDING_COUNT:
    raise SystemExit(
        f'[canon-articles] Canon must expose exactly {EXPECTED_BINDING_COUNT} unique article bindings; '
        f'found total={len(binding_list)}, unique={len(bindings)}'
    )

missing_bindings = EXPECTED_EXACT - bindings
if missing_bindings:
    raise SystemExit(f'[canon-articles] Exact dossiers are not bound into Canon library: {sorted(missing_bindings)}')

superseded = SUPERSEDED_CANON_HISTORY_BINDINGS & bindings
if superseded:
    raise SystemExit(
        '[canon-articles] Canon links to legacy history pages with superseded origin wording: '
        f'{sorted(superseded)}'
    )
missing_safe_bindings = REQUIRED_SAFE_BINDINGS - bindings
if missing_safe_bindings:
    raise SystemExit(f'[canon-articles] Required safe Canon bindings disappeared: {sorted(missing_safe_bindings)}')

unknown_appendices = set(appendix_contents) - bindings
if unknown_appendices:
    raise SystemExit(f'[canon-articles] Canon appendices target routes outside the collection: {sorted(unknown_appendices)}')

missing_legacy_bodies = (bindings - EXPECTED_EXACT) - set(legacy_contents)
if missing_legacy_bodies:
    raise SystemExit(f'[canon-articles] Canon legacy bindings have no base body: {sorted(missing_legacy_bodies)}')


def merged_body(article_id: str) -> str:
    if article_id in exact_contents:
        body = exact_contents[article_id].strip()
    else:
        body = legacy_contents[article_id].strip()
        expansion = expansion_contents.get(article_id, '').strip()
        if expansion:
            body = f'{body}\n\n{expansion}'
    appendix = appendix_contents.get(article_id, '').strip()
    if appendix:
        body = f'{body}\n\n{appendix}'
    return body


metrics: dict[str, tuple[int, int, int]] = {}
for article_id in sorted(bindings):
    body = merged_body(article_id)
    words = WORD_RE.findall(re.sub(r'https?://\S+', ' ', body))
    sections = len(SECTION_RE.findall(body))
    urls = list(dict.fromkeys(URL_RE.findall(body)))
    metrics[article_id] = (len(words), sections, len(urls))

    if len(words) < PREMIUM_MIN_WORDS:
        raise SystemExit(
            f'[canon-articles] {article_id} is below Canon premium floor: '
            f'{len(words)} < {PREMIUM_MIN_WORDS} words'
        )
    if sections < PREMIUM_MIN_SECTIONS:
        raise SystemExit(
            f'[canon-articles] {article_id} needs at least {PREMIUM_MIN_SECTIONS} substantive sections, '
            f'found {sections}'
        )
    # Legacy articles also expose a verified metadata source and are already
    # covered by the sitewide editorial-source audit. Require at least two body
    # citations here without inventing a third URL solely to satisfy this gate.
    if article_id not in EXPECTED_EXACT and len(urls) < LEGACY_MIN_BODY_SOURCES:
        raise SystemExit(
            f'[canon-articles] {article_id} needs at least {LEGACY_MIN_BODY_SOURCES} unique body source links, '
            f'found {len(urls)}'
        )

    folded_body = body.casefold()
    for marker in ('Контент в разработке', 'RESEARCH IN PROGRESS', 'TODO', 'FIXME'):
        if marker.casefold() in folded_body:
            raise SystemExit(f'[canon-articles] {article_id} contains placeholder marker: {marker}')

# Exact dossiers keep their stricter provenance/fail-closed contract on top of
# the all-15 premium-depth gate.
for article_id in EXPECTED_EXACT:
    body = merged_body(article_id)
    source_heading_count = body.count(SOURCE_HEADING)
    urls = list(dict.fromkeys(URL_RE.findall(body)))
    domains = {urlsplit(url).netloc.lower().removeprefix('www.') for url in urls}

    if source_heading_count != 1:
        raise SystemExit(f'[canon-articles] {article_id} must contain exactly one source heading, found {source_heading_count}')
    if len(urls) < 5:
        raise SystemExit(f'[canon-articles] {article_id} needs at least 5 unique source links, found {len(urls)}')

    if article_id == 'genin-tarte-au-citron-canon':
        required_domains = {'editionsalternatives.com', 'jacquesgenin.fr'}
        required_boundaries = [
            'Genin не изобретатель жанра',
            'не закрывает конкретный день рождения лимонного тарта',
            'не делает Эктон «изобретателем современной tarte au citron»',
        ]
    else:
        required_domains = {'pierreherme.com', 'fr.gaultmillau.com'}
        required_boundaries = [
            '2000 не означает доказанные две тысячи физических слоёв',
            'Product не цитирует их и не строит на них жёсткую хронологию',
            'точный первый день продажи и точный ранний каталог остаются открытыми',
        ]

    missing_domains = required_domains - domains
    if missing_domains:
        raise SystemExit(f'[canon-articles] {article_id} missing required authoritative domains: {sorted(missing_domains)}')
    folded_body = body.casefold()
    missing_boundaries = [phrase for phrase in required_boundaries if phrase.casefold() not in folded_body]
    if missing_boundaries:
        raise SystemExit(f'[canon-articles] {article_id} lost fail-closed wording: {missing_boundaries}')

print('# Le Canon Sucré dossier depth gate')
for article_id in sorted(bindings):
    word_count, section_count, source_count = metrics[article_id]
    print(f'- PASS: {article_id}: {word_count} words, {section_count} sections, {source_count} body sources')
print(
    f'- PASS: all {EXPECTED_BINDING_COUNT} Canon routes >= {PREMIUM_MIN_WORDS} words '
    f'and >= {PREMIUM_MIN_SECTIONS} sections'
)
print('- PASS: legacy routes retain >=2 body citations plus the sitewide verified metadata-source contract')
print('- PASS: exact Genin/Hermé dossiers retain stricter provenance and fail-closed wording')
print('- PASS: 15 unique Canon article bindings; superseded legacy history routes excluded')
