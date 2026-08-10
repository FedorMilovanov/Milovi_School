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
ARTICLE_URL_PREFIX = 'https://french.milovicake.ru/articles/'

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
    before = len(errors)
    gateway = home.select_one('a.canon-gateway[href="/canon/"]')
    if not gateway:
        fail('Homepage must contain one Canon gateway linking to /canon/')
    else:
        title = gateway.select_one('#canon-gateway-title')
        if not title or compact_text(title).upper() != 'LECANONSUCRÉ':
            fail('Canon gateway is missing its accessible title')
        media = gateway.select('.canon-gateway-media img')
        if len(media) != 1:
            fail(f'Canon gateway must expose one coherent editorial image, found {len(media)}')
        elif not media[0].get('src', '').startswith('/images/'):
            fail('Canon gateway media must use a local production /images/ asset')
        elif not media[0].get('alt', '').strip():
            fail('Canon gateway production media must keep a non-empty descriptive alt')
        if gateway.select('.canon-gateway-media-item'):
            fail('Canon gateway must not regress to the fragmented multi-panel thumbnail stack')
    if len(errors) == before:
        ok('Homepage Canon gateway: route, title and one coherent local editorial image verified')

if canon:
    before = len(errors)
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
        if image:
            if not image.get('src', '').startswith('/images/'):
                fail(f'{work_id}: Canon media must use a local /images/ asset')
            if not image.get('alt', '').strip():
                fail(f'{work_id}: public Canon image requires non-empty alt text')

        dossier = work.select_one('.canon-work-dossier')
        excerpt = work.select_one('.canon-work-excerpt')
        dossier_meta = work.select_one('.canon-work-dossier-meta')
        if not dossier or not excerpt or not compact_text(excerpt):
            fail(f'{work_id}: every published Canon card must expose a substantive dossier preview')
        if not dossier_meta or 'DOSSIER' not in compact_text(dossier_meta).upper():
            fail(f'{work_id}: dossier preview requires visible reading-context metadata')

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
        bad_active = [cell for cell in active_cells if cell.get('role') != 'img' or not cell.get('aria-label', '').strip()]
        if bad_active:
            fail('Every active technique mark requires a non-interactive accessible label')
        invalid_targets = [a.get('href') for a in technique_headers if a.get('href') not in work_ids]
        if invalid_targets:
            fail(f'Technique Index links to unknown Canon works: {sorted(set(invalid_targets))}')

    rendered_text = canon.get_text(' ', strip=True).upper()
    for marker in ('RESEARCH IN PROGRESS', 'ARCHIVE SLOT', 'RESEARCH SLOT'):
        if marker in rendered_text:
            fail(f'/canon/ exposes internal placeholder copy: {marker}')

    structured = json_ld_objects(canon)
    item_lists = [item for item in structured if item.get('@type') == 'ItemList']
    collection_pages = [item for item in structured if item.get('@type') == 'CollectionPage']
    breadcrumbs = [item for item in structured if item.get('@type') == 'BreadcrumbList']

    if len(item_lists) != 1:
        fail(f'/canon/ must emit exactly one ItemList JSON-LD block, found {len(item_lists)}')
    else:
        item_list = item_lists[0]
        if item_list.get('numberOfItems') != 15:
            fail('Canon ItemList JSON-LD must declare 15 items')
        entries = item_list.get('itemListElement')
        if not isinstance(entries, list) or len(entries) != 15:
            fail('Canon ItemList JSON-LD must contain exactly 15 ListItem entries')
        else:
            positions = [entry.get('position') for entry in entries if isinstance(entry, dict)]
            urls = [entry.get('url') for entry in entries if isinstance(entry, dict)]
            names = [entry.get('name') for entry in entries if isinstance(entry, dict)]
            if positions != list(range(1, 16)):
                fail(f'Canon ItemList positions must be contiguous 1–15, found {positions}')
            if len(urls) != 15 or len(set(urls)) != 15 or any(not isinstance(url, str) for url in urls):
                fail('Canon ItemList must expose 15 unique stable URLs')
            else:
                invalid_urls = [url for url in urls if not (url.startswith(ARTICLE_URL_PREFIX) or url.startswith(f'{CANON_URL}#canon-'))]
                if invalid_urls:
                    fail(f'Canon ItemList contains URLs outside article/canonical scope: {invalid_urls}')
            if len(names) != 15 or any(not isinstance(name, str) or not name.strip() for name in names):
                fail('Canon ItemList every entry requires a non-empty name')

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

    if len(errors) == before:
        ok('Canon exhibition: 15 works, 3×5 acts, native media, dossier previews, technique/navigation and SEO contracts verified')

library_source_path = SRC / 'data' / 'canon-library.ts'
media_source_path = SRC / 'data' / 'canon-media.ts'
canon_source_path = SRC / 'data' / 'canon.ts'

linked_article_ids: list[str] = []
if not library_source_path.exists():
    fail('Missing src/data/canon-library.ts')
else:
    library_source = library_source_path.read_text('utf-8')
    linked_article_ids = re.findall(r"articleId:\s*'([^']+)'", library_source)
    if re.search(r'\bimage(?:Alt|Mobile)?\s*:', library_source):
        fail('canon-library.ts must contain route identity only, not media fields')

if not media_source_path.exists():
    fail('Missing src/data/canon-media.ts')
else:
    media_source = media_source_path.read_text('utf-8')
    if re.search(r'\barticleId\s*:', media_source):
        fail('canon-media.ts must contain exhibition media only, not article routes')

if not canon_source_path.exists():
    fail('Missing src/data/canon.ts')
else:
    canon_source = canon_source_path.read_text('utf-8')
    for required in ("from './canon-library'", "from './canon-media'"):
        if required not in canon_source:
            fail(f'canon.ts must independently resolve route/media bindings: {required}')

before = len(errors)
for article_id in linked_article_ids:
    article_html = soup_for(DIST / 'articles' / article_id / 'index.html')
    if not article_html:
        continue
    nav = article_html.select('[aria-label*="Le Canon Sucré"]')
    if len(nav) < 2:
        fail(f'Canon-linked article {article_id} must render both top and bottom collection navigation')
    article_nodes = [item for item in json_ld_objects(article_html) if item.get('@type') == 'Article']
    if len(article_nodes) != 1:
        fail(f'Canon-linked article {article_id} must emit exactly one Article JSON-LD object')
        continue
    part = article_nodes[0].get('isPartOf')
    if not isinstance(part, dict) or part.get('@id') != CANON_URL or part.get('@type') != 'CollectionPage':
        fail(f'Canon-linked article {article_id} must declare Article.isPartOf Le Canon Sucré')
if linked_article_ids and len(errors) == before:
    ok(f'Canon article navigation + structured membership verified on {len(linked_article_ids)} mapped routes')

page_css_path = SRC / 'styles' / 'canon.css'
media_layout_css_path = SRC / 'styles' / 'canon-media-layout.css'
editorial_css_path = SRC / 'styles' / 'canon-editorial.css'
gateway_css_path = SRC / 'styles' / 'canon-gateway.css'
gateway_component_path = SRC / 'components' / 'CanonGateway.tsx'
experience_component_path = SRC / 'components' / 'CanonExperience.tsx'
article_nav_component_path = SRC / 'components' / 'CanonArticleNav.tsx'
navigation_path = SRC / 'utils' / 'navigation.ts'
technique_css_path = SRC / 'styles' / 'canon-technique-matrix.css'
technique_component_path = SRC / 'components' / 'CanonTechniqueMatrix.tsx'
technique_data_path = SRC / 'data' / 'canon-techniques.ts'

before = len(errors)
if not page_css_path.exists():
    fail('Missing src/styles/canon.css')
else:
    page_css = page_css_path.read_text('utf-8')
    for invalid in ('inset-left:', 'inset-bottom:', '.canon-object'):
        if invalid in page_css:
            fail(f'Canon page CSS contains obsolete/invalid construct: {invalid}')
    for contract in (
        'grid-column: var(--canon-grid-start, auto) / span var(--canon-grid-span, 4);',
        'grid-row: var(--canon-grid-row, auto);',
    ):
        if contract not in page_css:
            fail(f'Canon page CSS is missing data-driven editorial grid contract: {contract}')

if not media_layout_css_path.exists():
    fail('Missing src/styles/canon-media-layout.css')
else:
    media_layout_css = media_layout_css_path.read_text('utf-8')
    if 'aspect-ratio: 16 / 10;' not in media_layout_css:
        fail('Canon media art direction must explicitly preserve the 1280×800 16:10 master ratio')
    if 'aspect-ratio: 4 / 5;' in media_layout_css:
        fail('Canon media art direction must never reintroduce destructive 4:5 crops')
    if 'transform: none;' not in media_layout_css:
        fail('Canon media art direction must neutralize the old baseline zoom before hover')

if not editorial_css_path.exists():
    fail('Missing src/styles/canon-editorial.css')
else:
    editorial_css = editorial_css_path.read_text('utf-8')
    if "@import './canon-media-layout.css';" not in editorial_css:
        fail('Canon editorial stylesheet must load media art direction after base canon.css')
    for selector in ('.canon-work-dossier', '.canon-work-excerpt'):
        if selector not in editorial_css:
            fail(f'Canon editorial density stylesheet is missing {selector}')

if not gateway_css_path.exists():
    fail('Missing src/styles/canon-gateway.css')
else:
    gateway_css = gateway_css_path.read_text('utf-8')
    for invalid in ('inset-left:', 'inset-bottom:', '.canon-object'):
        if invalid in gateway_css:
            fail(f'Canon gateway CSS contains obsolete/invalid construct: {invalid}')
    leaked = [selector for selector in ('.canon-page', '.canon-work-grid', '.canon-catalogue-plate', '.canon-act-rail') if selector in gateway_css]
    if leaked:
        fail(f'Homepage gateway CSS leaked exhibition-only selectors: {", ".join(leaked)}')
    if '.canon-gateway-media-item' in gateway_css:
        fail('Homepage gateway CSS must not contain the retired multi-panel thumbnail system')

if not gateway_component_path.exists():
    fail('Missing src/components/CanonGateway.tsx')
else:
    gateway_component = gateway_component_path.read_text('utf-8')
    if "../styles/canon-gateway.css" not in gateway_component:
        fail('CanonGateway must import the gateway-only stylesheet')
    if "../styles/canon.css" in gateway_component:
        fail('CanonGateway must not import the full exhibition stylesheet')
    if "../data/canon-media" not in gateway_component:
        fail('CanonGateway must consume the media registry directly')
    if "../data/canon-library" in gateway_component:
        fail('CanonGateway must not depend on article publication bindings')
    if "../data/canon'" in gateway_component or '../data/canon"' in gateway_component:
        fail('CanonGateway must not import the full 15-work curatorial data model')
    if "prefetchRoute('/canon/')" not in gateway_component:
        fail('CanonGateway must warm /canon/ only on explicit user intent')
    for retired in ('GATEWAY_SELECTION', 'canon-gateway-media-item'):
        if retired in gateway_component:
            fail(f'CanonGateway still contains retired fragmented media construct: {retired}')

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
else:
    technique_component = technique_component_path.read_text('utf-8')
    if "../data/canon-techniques" not in technique_component:
        fail('Technique Index must consume the centralized technique relationship registry')
if not technique_css_path.exists():
    fail('Missing src/styles/canon-technique-matrix.css')
if not technique_data_path.exists():
    fail('Missing src/data/canon-techniques.ts')

if (SRC / 'styles' / 'canon-enhancements.css').exists():
    fail('Duplicate Canon enhancement stylesheet must not exist')

if len(errors) == before:
    ok('Canon boundaries: independent media/routes, native-ratio art direction, dossier density, intent-prefetch and isolated visual/data layers verified')

print('# Le Canon Sucré quality gate')
print()
for message in passed:
    print(f'- PASS: {message}')
for message in errors:
    print(f'- FAIL: {message}')

sys.exit(1 if errors else 0)
