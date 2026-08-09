#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'src' / 'data' / 'canonArticles.ts'
CONTENT = ROOT / 'src' / 'data' / 'canonArticleContents.ts'
LIBRARY = ROOT / 'src' / 'data' / 'canon-library.ts'

EXPECTED = {
    'genin-tarte-au-citron-canon',
    'herme-2000-feuilles-canon',
}
EXPECTED_BINDING_COUNT = 15
SUPERSEDED_CANON_HISTORY_BINDINGS = {
    'paris-brest-race-dessert',
    'eclair-histoire-complete',
    'opera-gateau-histoire',
}
REQUIRED_SAFE_BINDINGS = {
    'recipe-paris-brest-classique',
    'recipe-eclairs-adam',
    'recipe-opera-dalloyau',
    *EXPECTED,
}
WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*")
SECTION_RE = re.compile(r'(?m)^##\s+')
ENTRY_RE = re.compile(r"(?m)^\s*'([^']+)'\s*:\s*`([\s\S]*?)`\s*,")
URL_RE = re.compile(r"\[[^\]]+\]\((https?://[^)\s]+)\)")
SOURCE_HEADING = '## Французские источники и первичные материалы'

for path in (META, CONTENT, LIBRARY):
    if not path.exists():
        raise SystemExit(f'[canon-articles] Missing {path.relative_to(ROOT)}')

meta_text = META.read_text('utf-8')
content_text = CONTENT.read_text('utf-8')
library_text = LIBRARY.read_text('utf-8')

meta_ids = set(re.findall(r"(?m)^\s*id:\s*'([^']+)'", meta_text))
contents = {article_id: body for article_id, body in ENTRY_RE.findall(content_text)}
content_ids = set(contents)

if meta_ids != EXPECTED:
    raise SystemExit(f'[canon-articles] Metadata ids mismatch: expected={sorted(EXPECTED)}, found={sorted(meta_ids)}')
if content_ids != EXPECTED:
    raise SystemExit(f'[canon-articles] Content ids mismatch: expected={sorted(EXPECTED)}, found={sorted(content_ids)}')

binding_list = re.findall(r"articleId:\s*'([^']+)'", library_text)
bindings = set(binding_list)
if len(binding_list) != EXPECTED_BINDING_COUNT or len(bindings) != EXPECTED_BINDING_COUNT:
    raise SystemExit(
        f'[canon-articles] Canon must expose exactly {EXPECTED_BINDING_COUNT} unique article bindings; '
        f'found total={len(binding_list)}, unique={len(bindings)}'
    )

missing_bindings = EXPECTED - bindings
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

metrics: dict[str, tuple[int, int, int]] = {}
for article_id, body in contents.items():
    words = WORD_RE.findall(re.sub(r'https?://\S+', ' ', body))
    sections = len(SECTION_RE.findall(body))
    source_heading_count = body.count(SOURCE_HEADING)
    urls = list(dict.fromkeys(URL_RE.findall(body)))
    domains = {urlsplit(url).netloc.lower().removeprefix('www.') for url in urls}
    metrics[article_id] = (len(words), sections, len(urls))

    if len(words) < 850:
        raise SystemExit(f'[canon-articles] {article_id} is too shallow: {len(words)} words')
    if sections < 7:
        raise SystemExit(f'[canon-articles] {article_id} needs at least 7 substantive sections, found {sections}')
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

    for marker in ('Контент в разработке', 'RESEARCH IN PROGRESS', 'TODO', 'FIXME'):
        if marker.casefold() in folded_body:
            raise SystemExit(f'[canon-articles] {article_id} contains placeholder marker: {marker}')

print('# Exact Le Canon Sucré dossier gate')
for article_id in sorted(EXPECTED):
    word_count, section_count, source_count = metrics[article_id]
    print(f'- PASS: {article_id}: {word_count} words, {section_count} sections, {source_count} sources')
print('- PASS: 15 unique Canon article bindings; superseded legacy history routes excluded')
