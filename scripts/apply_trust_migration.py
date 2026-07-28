#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'scripts' / 'audit_site.py'

source = AUDIT.read_text('utf-8')
old = """    canon=soup.find('link', rel='canonical')
    if not canon or not canon.get('href','').startswith(SITE): err(f'Missing/invalid canonical in {rel}')
"""
new = """    canon=soup.find('link', rel='canonical')
    is_error_page = rel in {'/404.html', '/404/'}
    if is_error_page:
        if canon: err(f'404 must not emit canonical in {rel}')
    elif not canon or not canon.get('href','').startswith(SITE):
        err(f'Missing/invalid canonical in {rel}')
"""
if old not in source:
    if new in source:
        print('audit migration already applied')
        raise SystemExit(0)
    raise SystemExit('expected canonical audit block not found')
AUDIT.write_text(source.replace(old, new, 1), 'utf-8')
print('updated audit_site.py for canonical-free 404')
