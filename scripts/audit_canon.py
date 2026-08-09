#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SRC = ROOT / 'src'
CANON_URL = 'https://french.milovicake.ru/canon/'

errors: list[str] = []
passed: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def ok(message: str) -> None:
    passed.append(message)


def soup_for(path: Path) -> BeautifulSoup | None:
    if not path.exists():
        fail(f'Missing built file: {path.relative_to(ROOT)}')
        return None
    return BeautifulSoup(path.read_text('utf-8', errors='replace'), 'html.parser')


def compact_text(node) -> str:
    """Collapse element-level text splitting without changing rendered semantics.

    LuxuryText renders each character in its own span. BeautifulSoup's
    get_text(' ', ...) therefore inserts synthetic spaces between letters that
    do not exist in the browser accessibility tree. Joining stripped strings
    gives us a stable comparison for those per-letter wrappers.
    """
    return ''.join(node.stripped_strings)


def json_ld_objects(soup: BeautifulSoup) -> list[dict]:
    objects: list[dict] = []
    for script in soup.select('script[type="application/ld+json"]'):
        text = script.string or script.get_text() or ''
        try:
            value = json.loads(text)
        except json.JSONDecodeError as error:
            fail(f'Invalid JSON-LD: {error}')
            continue
        if isinstance(value, dict):
            objects.append(value)
        elif isinstance(value, list):
            objects.extend(item for item in value if isinstance(item, dict))
    return objects


home = soup_for(DIST / 'index.html')
canon = soup_for(DIST / 'canon' / 'index.html')

if home:
    gateway_error_count = len(errors)
    gateway = home.select_one('a.canon-gateway[href="/canon/"]')
    if not gateway:
        fail('Homepage must contain one Canon gateway linking to /canon/')
    else:
        title = gateway.select_one('#canon-gateway-title')
        if not title or compact_text(title).upper() != 'LECANONSUCRÉ':
            fail('Canon gateway is missing its accessible title')
        media = gateway.select('.canon-gateway-media-item img')
        if len(media) != 5:
            fail(f'Canon gateway must expose five real editorial media items, found {len(media)}')
        elif any(not img.get('src', '').startswith('/images/articles/') for img in media):
            fail('Canon gateway media must resolve to production article images')
        elif any(not img.get('alt', '').strip() for img in media):
            fail('Canon gateway production media must keep non-empty alt text for global site audits')
    if len(errors) == gateway_error_count:
        ok('Homepage Canon gateway: route, title and five production media items verified')

if canon:
    structure_error_count = len(errors)
    main = canon.select('main#main-content')
    if len(main) != 1:
        fail(f'/canon/ must contain exactly one #main-content landmark, found {len(main)}')

    canonical_link = canon.select_one('link[rel="canonical"]')
    if not canonical_link or canonical_link.get('href') != CANON_URL:
        fail(f'/canon/ must expose canonical link {CANON_URL}')

    works = canon.select('.canon-work')
    acts = canon.select('.canon-act')
    index_links = canon.select('.canon-index-link[href^="#canon-"]')
    work_ids = {f'#{work.get("id")}' for work in works if work.get('id')}

    if len(works) != 15:
        fail(f'/canon/ must render exactly 15 works, found {len(works)}')
    if len(acts) != 3:
        fail(f'/canon/ must render exactly three acts, found {len(acts)}')
    if len(index_links) != 15 or len({a.get('href') for a in index_links}) != 15:
        fail('Canon index must contain 15 unique in-page work links')

    for act_id in ('forme', 'signature', 'territoire'):
        act = canon.select_one(f'#canon-act-{act_id}')
        if not act:
            fail(f'Missing Canon act section: {act_id}')
        elif len(act.select('.canon-work')) != 5:
            fail(f'Canon act {act_id} must render five works')

    transitions = canon.select('a.canon-act-transition[href^="#canon-act-"]')
    transition_hrefs = [link.get('href') for link in transitions]
    expected_transitions = ['#canon-act-signature', '#canon-act-territoire']
    if transition_hrefs != expected_transitions:
        fail(f'Canon act transitions must be {expected_transitions}, found {transition_hrefs}')
    for link in transitions:
        href = link.get('href')
        if not href or not canon.select_one(href):
            fail(f'Canon act transition points to missing destination: {href}')
        if not link.get('aria-label', '').strip():
            fail(f'Canon act transition requires an accessible label: {href}')

    for work in works:
        work_id = work.get('id', '<unknown>')
        media = work.select_one('.canon-work-media')
        if not media:
            fail(f'{work_id}: missing media plane')
            continue
        image = media.select_one('img.canon-work-image')
        plate = media.select_one('.canon-catalogue-plate')
        if bool(image) == bool(plate):
            fail(f'{work_id}: media plane must contain exactly one real image or catalogue plate')
        if image and not image.get('alt', '').strip():
            fail(f'{work_id}: public Canon image requires non-empty alt text')

    technique = canon.select_one('.canon-technique-index')
    if not technique:
        fail('/canon/ must include the Technique Index')
    else:
        if len(main) == 1 and not main[0].select_one('.canon-technique-index'):
            fail('Technique Index must remain inside the main Canon landmark')
        technique_headers = technique.select('.canon-technique-work-head[href^="#canon-"]')
        technique_rows = technique.select('.canon-technique-label')
        active_cells = technique.select('.canon-technique-cell.is-active')
        cell_links = technique.select('a.canon-technique-cell')
        if len(technique_headers) != 15 or len({a.get('href') for a in technique_headers}) != 15:
            fail('Technique Index must expose 15 unique work-header links')
        if len(technique_rows) != 8:
            fail(f'Technique Index must expose exactly eight technique rows, found {len(technique_rows)}')
        if len(active_cells) != 21:
            fail(f'Technique Index must expose exactly 21 active technique/work marks, found {len(active_cells)}')
        if cell_links:
            fail('Technique matrix dots must not create extra keyboard navigation stops')
        active_without_labels = [cell for cell in active_cells if cell.get('role') != 'img' or not cell.get('aria-label', '').strip()]
        if active_without_labels:
            fail('Every active technique mark requires a non-interactive accessible label')
        invalid_targets = [a.get('href') for a in technique_headers if a.get('href') not in work_ids]
        if invalid_targets:
            fail(f'Technique Index links to unknown Canon works: {sorted(set(invalid_targets))}')

    forbidden_copy = ('RESEARCH IN PROGRESS', 'ARCHIVE SLOT', 'RESEARCH SLOT')
    rendered_text = canon.get_text(' ', strip=True).upper()
    for marker in forbidden_copy:
        if marker in rendered_text:
            fail(f'/canon/ exposes internal placeholder copy: {marker}')

    structured = json_ld_objects(canon)
    item_lists = [item for item in structured if item.get('@type') == 'ItemList']
    collection_pages = [item for item in structured if item.get('@type') == 'CollectionPage']
    breadcrumbs = [item for item in structured if item.get('@type') == 'BreadcrumbList']

    if len(item_lists) != 1:
        fail(f'/canon/ must emit exactly one ItemList JSON-LD block, found {len(item_lists)}')
    elif item_lists[0].get('numberOfItems') != 15:
        fail('Canon ItemList JSON-LD must declare 15 items')
    if len(collection_pages) != 1:
        fail(f'/canon/ must emit exactly one CollectionPage JSON-LD block, found {len(collection_pages)}')
    elif collection_pages[0].get('@id') != CANON_URL:
        fail('Canon CollectionPage must use the canonical /canon/ @id')
    if len(breadcrumbs) != 1:
        fail(f'/canon/ must emit exactly one BreadcrumbList JSON-LD block, found {len(breadcrumbs)}')
    else:
        crumbs = breadcrumbs[0].get('itemListElement')
        if not isinstance(crumbs, list) or len(crumbs) != 2:
            fail('Canon BreadcrumbList must contain Home → Le Canon Sucré')

    sitemap_files = sorted(DIST.glob('sitemap*.xml'))
    if not sitemap_files:
        fail('Build must emit a sitemap containing /canon/')
    else:
        sitemap_text = '\n'.join(path.read_text('utf-8', errors='replace') for path in sitemap_files)
        if CANON_URL not in sitemap_text:
            fail(f'Sitemap must contain Canon canonical URL: {CANON_URL}')

    if len(errors) == structure_error_count:
        ok('Canon exhibition structure: 15 works, 3×5 acts, transitions, Technique Index, canonical/sitemap and JSON-LD verified')

canon_sources = '\n'.join([
    (SRC / 'data' / 'canon.ts').read_text('utf-8'),
    (SRC / 'data' / 'canon-library.ts').read_text('utf-8'),
])
linked_article_ids = re.findall(r"articleId:\s*'([^']+)'", canon_sources)
article_nav_error_count = len(errors)
for article_id in linked_article_ids:
    article_html = soup_for(DIST / 'articles' / article_id / 'index.html')
    if not article_html:
        continue
    nav = article_html.select('[aria-label*="Le Canon Sucré"]')
    if len(nav) < 2:
        fail(f'Canon-linked article {article_id} must render both top and bottom collection navigation')

    article_structured = json_ld_objects(article_html)
    article_nodes = [item for item in article_structured if item.get('@type') == 'Article']
    if len(article_nodes) != 1:
        fail(f'Canon-linked article {article_id} must emit exactly one Article JSON-LD object')
        continue
    part = article_nodes[0].get('isPartOf')
    if not isinstance(part, dict) or part.get('@id') != CANON_URL or part.get('@type') != 'CollectionPage':
        fail(f'Canon-linked article {article_id} must declare Article.isPartOf Le Canon Sucré')
if linked_article_ids and len(errors) == article_nav_error_count:
    ok(f'Canon article navigation + structured membership verified on {len(linked_article_ids)} mapped article routes')

page_css_path = SRC / 'styles' / 'canon.css'
gateway_css_path = SRC / 'styles' / 'canon-gateway.css'
gateway_component_path = SRC / 'components' / 'CanonGateway.tsx'
experience_component_path = SRC / 'components' / 'CanonExperience.tsx'
article_nav_component_path = SRC / 'components' / 'CanonArticleNav.tsx'
navigation_path = SRC / 'utils' / 'navigation.ts'
technique_css_path = SRC / 'styles' / 'canon-technique-matrix.css'
technique_component_path = SRC / 'components' / 'CanonTechniqueMatrix.tsx'

boundary_error_count = len(errors)
if not page_css_path.exists():
    fail('Missing src/styles/canon.css')
else:
    page_css = page_css_path.read_text('utf-8')
    for invalid in ('inset-left:', 'inset-bottom:', '.canon-object'):
        if invalid in page_css:
            fail(f'Canon page CSS contains obsolete/invalid construct: {invalid}')
    required_grid_contracts = (
        'grid-column: var(--canon-grid-start, auto) / span var(--canon-grid-span, 4);',
        'grid-row: var(--canon-grid-row, auto);',
    )
    for contract in required_grid_contracts:
        if contract not in page_css:
            fail(f'Canon page CSS is missing data-driven editorial grid contract: {contract}')

if not gateway_css_path.exists():
    fail('Missing src/styles/canon-gateway.css')
else:
    gateway_css = gateway_css_path.read_text('utf-8')
    for invalid in ('inset-left:', 'inset-bottom:', '.canon-object'):
        if invalid in gateway_css:
            fail(f'Canon gateway CSS contains obsolete/invalid construct: {invalid}')
    forbidden_page_selectors = ('.canon-page', '.canon-work-grid', '.canon-catalogue-plate', '.canon-act-rail')
    leaked = [selector for selector in forbidden_page_selectors if selector in gateway_css]
    if leaked:
        fail(f'Homepage gateway CSS leaked exhibition-only selectors: {", ".join(leaked)}')

if gateway_component_path.exists():
    gateway_component = gateway_component_path.read_text('utf-8')
    if "../styles/canon-gateway.css" not in gateway_component:
        fail('CanonGateway must import the gateway-only stylesheet')
    if "../styles/canon.css" in gateway_component:
        fail('CanonGateway must not import the full exhibition stylesheet')
    if "../data/canon-library" not in gateway_component:
        fail('CanonGateway must consume the compact factual library registry')
    if "../data/canon'" in gateway_component or '../data/canon"' in gateway_component:
        fail('CanonGateway must not import the full 15-work curatorial data model')
    if "prefetchRoute('/canon/')" not in gateway_component:
        fail('CanonGateway must warm /canon/ only on explicit user intent')
else:
    fail('Missing src/components/CanonGateway.tsx')

if not navigation_path.exists():
    fail('Missing src/utils/navigation.ts')
else:
    navigation_source = navigation_path.read_text('utf-8')
    for required in ('export function prefetchRoute', 'connection?.saveData', "connection?.effectiveType === '2g'", "link.rel = 'prefetch'"):
        if required not in navigation_source:
            fail(f'Intent-prefetch utility is missing conservative contract: {required}')

for path, label in ((experience_component_path, 'CanonExperience'), (article_nav_component_path, 'CanonArticleNav')):
    if not path.exists():
        fail(f'Missing {path.relative_to(ROOT)}')
    elif 'prefetchRoute' not in path.read_text('utf-8'):
        fail(f'{label} must use the shared intent-prefetch utility')

if not technique_component_path.exists():
    fail('Missing src/components/CanonTechniqueMatrix.tsx')
if not technique_css_path.exists():
    fail('Missing src/styles/canon-technique-matrix.css')

if (SRC / 'styles' / 'canon-enhancements.css').exists():
    fail('Duplicate Canon enhancement stylesheet must not exist')

if len(errors) == boundary_error_count:
    ok('Canon boundaries are scoped: semantic collection links, intent-prefetch and isolated visual layers verified')

print('# Le Canon Sucré quality gate')
print()
for message in passed:
    print(f'- PASS: {message}')
for message in errors:
    print(f'- FAIL: {message}')

sys.exit(1 if errors else 0)
