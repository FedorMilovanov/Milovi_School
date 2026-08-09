#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SRC = ROOT / 'src'

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


home = soup_for(DIST / 'index.html')
canon = soup_for(DIST / 'canon' / 'index.html')

if home:
    gateway = home.select_one('a.canon-gateway[href="/canon/"]')
    if not gateway:
        fail('Homepage must contain one Canon gateway linking to /canon/')
    else:
        title = gateway.select_one('#canon-gateway-title')
        if not title or 'LE CANON SUCRÉ' not in title.get_text(' ', strip=True):
            fail('Canon gateway is missing its accessible title')
        media = gateway.select('.canon-gateway-media-item img')
        if len(media) != 5:
            fail(f'Canon gateway must expose five real editorial media items, found {len(media)}')
        elif any(not img.get('src', '').startswith('/images/articles/') for img in media):
            fail('Canon gateway media must resolve to production article images')
        else:
            ok('Homepage Canon gateway: route, title and five production media items verified')

if canon:
    main = canon.select('main#main-content')
    if len(main) != 1:
        fail(f'/canon/ must contain exactly one #main-content landmark, found {len(main)}')

    works = canon.select('.canon-work')
    acts = canon.select('.canon-act')
    index_links = canon.select('.canon-index-link[href^="#canon-"]')

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

    forbidden_copy = ('RESEARCH IN PROGRESS', 'ARCHIVE SLOT', 'RESEARCH SLOT')
    rendered_text = canon.get_text(' ', strip=True).upper()
    for marker in forbidden_copy:
        if marker in rendered_text:
            fail(f'/canon/ exposes internal placeholder copy: {marker}')

    item_lists = []
    for script in canon.select('script[type="application/ld+json"]'):
        text = script.string or script.get_text() or ''
        if '"@type":"ItemList"' in text or '"@type": "ItemList"' in text:
            item_lists.append(text)
    if len(item_lists) != 1:
        fail(f'/canon/ must emit exactly one ItemList JSON-LD block, found {len(item_lists)}')
    elif '"numberOfItems":15' not in item_lists[0] and '"numberOfItems": 15' not in item_lists[0]:
        fail('Canon ItemList JSON-LD must declare 15 items')

    if not errors:
        ok('Canon exhibition structure: 15 works, 3×5 acts, index, media states and JSON-LD verified')

canon_source = (SRC / 'data' / 'canon.ts').read_text('utf-8')
linked_article_ids = re.findall(r"articleId:\s*'([^']+)'", canon_source)
for article_id in linked_article_ids:
    article_html = soup_for(DIST / 'articles' / article_id / 'index.html')
    if not article_html:
        continue
    nav = article_html.select('[aria-label*="Le Canon Sucré"]')
    if len(nav) < 2:
        fail(f'Canon-linked article {article_id} must render both top and bottom collection navigation')
if linked_article_ids and not any(e.startswith('Canon-linked article') for e in errors):
    ok(f'Canon article navigation verified on {len(linked_article_ids)} mapped article routes')

css_path = SRC / 'styles' / 'canon.css'
if not css_path.exists():
    fail('Missing src/styles/canon.css')
else:
    css = css_path.read_text('utf-8')
    for invalid in ('inset-left:', 'inset-bottom:', '.canon-object'):
        if invalid in css:
            fail(f'Canon CSS contains obsolete/invalid construct: {invalid}')
    if (SRC / 'styles' / 'canon-enhancements.css').exists():
        fail('Duplicate Canon enhancement stylesheet must not exist')
    if not any('Canon CSS' in e for e in errors):
        ok('Canon CSS uses one visual authority with no obsolete fake-object layer')

print('# Le Canon Sucré quality gate')
print()
for message in passed:
    print(f'- PASS: {message}')
for message in errors:
    print(f'- FAIL: {message}')

sys.exit(1 if errors else 0)
