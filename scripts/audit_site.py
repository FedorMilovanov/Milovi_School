#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys, os, hashlib, gzip
from pathlib import Path
from urllib.parse import urlparse, unquote
from collections import Counter, defaultdict
from xml.etree import ElementTree as ET
from PIL import Image
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
PUBLIC = ROOT / 'public'
SRC = ROOT / 'src'
SITE = 'https://french.milovicake.ru'
errors=[]; warnings=[]; info=[]

def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)
def ok(msg): info.append(msg)

def route_exists(path: str):
    # path begins with /
    path = unquote(path.split('#')[0].split('?')[0])
    if path == '': path='/'
    if path.endswith('/'):
        return (DIST / path.lstrip('/') / 'index.html').exists()
    target = DIST / path.lstrip('/')
    if target.exists(): return True
    if (DIST / path.lstrip('/') / 'index.html').exists(): return True
    # public passthrough if not copied? build copies public into dist
    return False

def local_asset_exists(url: str):
    p = urlparse(url)
    if p.scheme and p.netloc and p.netloc != 'french.milovicake.ru':
        return True
    path = unquote(p.path)
    return route_exists(path)

# 1 source encoding / replacement chars
for base in [SRC, PUBLIC]:
    for p in base.rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.ts','.tsx','.astro','.css','.md','.json','.mjs','.html','.txt','.xml','.svg','.webmanifest'}:
            s=p.read_text('utf-8', errors='replace')
            if '\ufffd' in s:
                err(f'Unicode replacement char in {p.relative_to(ROOT)}')
ok('Source/public text files scanned for broken UTF-8')

# 2 images open, dimensions and map
image_files=[]
for p in list(PUBLIC.rglob('*'))+list((SRC/'assets').rglob('*')):
    if p.is_file() and p.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.gif','.svg','.ico'}:
        image_files.append(p)
        if p.suffix.lower() == '.svg':
            txt=p.read_text('utf-8', errors='replace')
            if '<svg' not in txt[:500].lower(): err(f'SVG does not look valid: {p.relative_to(ROOT)}')
            continue
        try:
            with Image.open(p) as im:
                im.verify()
            with Image.open(p) as im:
                w,h=im.size
                if w < 16 or h < 16: warn(f'Very small image {p.relative_to(ROOT)} {w}x{h}')
        except Exception as e:
            err(f'Image cannot be opened: {p.relative_to(ROOT)}: {e}')
ok(f'Images verified: {len(image_files)} files')

# dimensions map vs files
map_path = SRC/'data/articleImageDimensions.ts'
if map_path.exists():
    map_txt=map_path.read_text()
    mapped=dict((m.group(1),(int(m.group(2)),int(m.group(3)))) for m in re.finditer(r"'([^']+\.webp)': \{ width: (\d+), height: (\d+) \}", map_txt))
    article_imgs = sorted((PUBLIC/'images/articles').glob('*.webp'))
    for p in article_imgs:
        with Image.open(p) as im: wh=im.size
        if p.name not in mapped: err(f'Missing dimensions map for {p.name}')
        elif mapped[p.name] != wh: err(f'Dimensions map mismatch for {p.name}: map={mapped[p.name]} real={wh}')
    for name in mapped:
        if not (PUBLIC/'images/articles'/name).exists(): err(f'Dimensions map references missing image {name}')
    ok(f'Article image dimensions map checked: {len(mapped)} records')
else:
    err('Missing src/data/articleImageDimensions.ts')

# 3 built HTML checks
html_files = sorted(DIST.rglob('*.html'))
if not html_files: err('No built HTML files. Run npm run build first.')
route_locs=[]
jsonld_count=0
local_links=0
for html in html_files:
    rel='/' + str(html.relative_to(DIST)).replace('index.html','').replace('\\','/')
    soup=BeautifulSoup(html.read_text('utf-8', errors='replace'), 'html.parser')
    if soup.find(string=lambda s: s and '\ufffd' in s): err(f'Broken UTF-8 replacement char in built HTML {rel}')
    title=soup.find('title')
    is_verification_file = rel.startswith('/google') or rel.startswith('/yandex_')
    if is_verification_file:
        continue
    if not title or not title.get_text(strip=True): err(f'Missing title in {rel}')
    desc=soup.find('meta', attrs={'name':'description'})
    if not desc or not desc.get('content','').strip(): err(f'Missing meta description in {rel}')
    canon=soup.find('link', rel='canonical')
    if not canon or not canon.get('href','').startswith(SITE): err(f'Missing/invalid canonical in {rel}')
    og=soup.find('meta', attrs={'property':'og:image'})
    tw=soup.find('meta', attrs={'name':'twitter:image'})
    if not og or not og.get('content'): err(f'Missing og:image in {rel}')
    if not tw or not tw.get('content'): err(f'Missing twitter:image in {rel}')
    for script in soup.find_all('script', attrs={'type':'application/ld+json'}):
        txt=script.string or script.get_text() or ''
        try:
            data=json.loads(txt)
            jsonld_count += 1
        except Exception as e:
            err(f'Invalid JSON-LD in {rel}: {e}')
    for img in soup.find_all('img'):
        src=img.get('src','')
        alt=img.get('alt')
        if not src: err(f'Image without src in {rel}')
        if alt is None or not alt.strip(): err(f'Image without non-empty alt in {rel}: {src}')
        if src.startswith('/') or src.startswith(SITE):
            if not local_asset_exists(src): err(f'Broken image src in {rel}: {src}')
    for tag in soup.find_all(['a','link','script','source']):
        attr='href' if tag.name in ['a','link'] else 'src'
        u=tag.get(attr)
        if not u or u.startswith('#') or u.startswith('mailto:') or u.startswith('tel:') or u.startswith('javascript:'): continue
        if u.startswith('/') or u.startswith(SITE):
            p=urlparse(u).path
            # skip canonical to live absolute? still local route should exist
            if tag.name=='link' and tag.get('rel') and 'canonical' in tag.get('rel'): pass
            if not local_asset_exists(u): err(f'Broken local {attr} in {rel}: {u}')
            local_links += 1
ok(f'HTML routes checked: {len(html_files)}, local refs checked: {local_links}, JSON-LD blocks: {jsonld_count}')

# 4 articles / sitemap / image sitemap
article_dirs=sorted((DIST/'articles').glob('*/index.html')) if (DIST/'articles').exists() else []
ok(f'Built article pages: {len(article_dirs)}')
# expected article count from generated pages vs sitemap article URLs
site_xml = DIST/'sitemap-0.xml'
if site_xml.exists():
    xml=site_xml.read_text('utf-8')
    if 'xmlns:image=' not in xml: err('Sitemap missing image namespace')
    try:
        root=ET.fromstring(xml)
        ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9','image':'http://www.google.com/schemas/sitemap-image/1.1'}
        urls=root.findall('sm:url', ns)
        image_urls=0
        for u in urls:
            loc=u.find('sm:loc', ns)
            if loc is None: err('Sitemap url without loc')
            for im in u.findall('image:image', ns):
                image_urls += 1
                imloc=im.find('image:loc', ns)
                if imloc is None or not imloc.text: err('Sitemap image without loc')
                elif not local_asset_exists(imloc.text): err(f'Sitemap image does not exist locally: {imloc.text}')
                title=im.find('image:title', ns)
                cap=im.find('image:caption', ns)
                if title is None or not (title.text or '').strip(): err(f'Sitemap image missing title for {loc.text if loc is not None else "?"}')
                if cap is None or not (cap.text or '').strip(): warn(f'Sitemap image missing caption for {loc.text if loc is not None else "?"}')
        ok(f'Sitemap checked: {len(urls)} URLs, {image_urls} image entries')
    except Exception as e:
        err(f'Cannot parse sitemap-0.xml: {e}')
else:
    err('dist/sitemap-0.xml missing')

robots = (DIST/'robots.txt')
if robots.exists():
    rt=robots.read_text()
    if 'Sitemap:' not in rt: err('robots.txt missing Sitemap directive')
else: err('robots.txt missing')

# 5 article data integrity basic regex
articles_txt=(SRC/'data/articles.ts').read_text('utf-8')
ids=re.findall(r"id: '([^']+)'", articles_txt)
if len(ids)!=len(set(ids)): err('Duplicate article ids in articles.ts')
for aid in ids:
    if not (DIST/'articles'/aid/'index.html').exists(): err(f'Article id has no built page: {aid}')
ok(f'Article ids checked: {len(ids)}, unique={len(set(ids))}')


# 6 UI static checks
button_missing=[]
for comp in (SRC/'components').glob('*.tsx'):
    txt=comp.read_text('utf-8', errors='replace')
    for m in re.finditer(r'<button(\s|>)', txt):
        tag=txt[m.start():txt.find('>', m.start())+1]
        if 'type=' not in tag:
            button_missing.append(f'{comp.relative_to(ROOT)}:{txt[:m.start()].count(chr(10))+1}')
for item in button_missing:
    err(f'Button missing explicit type: {item}')

generated_ui_issues=[]
for html in html_files:
    rel='/' + str(html.relative_to(DIST)).replace('index.html','').replace('\\','/')
    if rel.startswith('/google') or rel.startswith('/yandex_'):
        continue
    soup=BeautifulSoup(html.read_text('utf-8', errors='replace'), 'html.parser')
    ids=[t.get('id') for t in soup.find_all(attrs={'id': True})]
    for dup in sorted({x for x in ids if ids.count(x)>1}):
        generated_ui_issues.append(f'{rel}: duplicate id {dup}')
    for a in soup.find_all('a'):
        if not a.get('href'):
            generated_ui_issues.append(f'{rel}: anchor without href')
        if a.find('a'):
            generated_ui_issues.append(f'{rel}: nested anchor')
    for b in soup.find_all('button'):
        text=b.get_text(' ', strip=True)
        if not text and not b.get('aria-label') and not b.get('title'):
            generated_ui_issues.append(f'{rel}: button without accessible text')
for item in generated_ui_issues:
    err(f'UI static issue: {item}')
ok(f'UI static checks passed: explicit button types, href anchors, duplicate ids, accessible buttons')

# 7 Client bundle regression checks
astro_js = sorted((DIST / '_astro').glob('*.js')) if (DIST / '_astro').exists() else []
if not astro_js:
    err('No built JS files in dist/_astro')
else:
    leaked_markers = [
        'Операционный командир',
        'Идеальная Опера в разрезе',
        'Если десерт кажется плоским',
    ]
    for js in astro_js:
        txt = js.read_text('utf-8', errors='ignore')
        for marker in leaked_markers:
            if marker in txt:
                err(f'Client bundle appears to contain full article content: {js.name} marker={marker!r}')
        raw_size = js.stat().st_size
        gzip_size = len(gzip.compress(js.read_bytes()))
        if raw_size > 800_000 or gzip_size > 250_000:
            err(f'Client JS chunk too large: {js.name} raw={raw_size} gzip={gzip_size}')
        elif gzip_size > 180_000:
            warn(f'Large client JS chunk: {js.name} raw={raw_size} gzip={gzip_size}')
    ok(f'Client JS bundles checked: {len(astro_js)} files')

# Prevent client components from importing the full articles/deepContents runtime.
for comp in (SRC / 'components').glob('*.tsx'):
    txt = comp.read_text('utf-8', errors='replace')
    if re.search(r'from [\'"]\.\./data/(articles|library|deepContents)[\'"]', txt):
        err(f'Client component imports heavy data module: {comp.relative_to(ROOT)}')
ok('Client component imports checked for heavy article-content modules')

# summary report
report=[]
report.append('# Milovi School audit report')
report.append('')
report.append(f'- Errors: {len(errors)}')
report.append(f'- Warnings: {len(warnings)}')
report.append('')
report.append('## Passed checks')
for m in info: report.append(f'- {m}')
if warnings:
    report.append('\n## Warnings')
    for m in warnings: report.append(f'- {m}')
if errors:
    report.append('\n## Errors')
    for m in errors: report.append(f'- {m}')
(ROOT/'audit').mkdir(exist_ok=True)
(ROOT/'audit/site-audit-report.md').write_text('\n'.join(report), encoding='utf-8')
print('\n'.join(report))
sys.exit(1 if errors else 0)
