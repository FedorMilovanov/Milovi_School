#!/usr/bin/env bash
set -euo pipefail

LIVE_BASE="${LIVE_BASE:-https://french.milovicake.ru}"
EXPECTED_SHA="${EXPECTED_SHA:-}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/canon/" > "$TMP_DIR/canon.html"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/sitemap-0.xml" > "$TMP_DIR/sitemap.xml"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/release.json" > "$TMP_DIR/release.json"

EXPECTED_SHA="$EXPECTED_SHA" LIVE_BASE="$LIVE_BASE" python3 - "$TMP_DIR" <<'PY'
from __future__ import annotations

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(sys.argv[1])
live = os.environ['LIVE_BASE'].rstrip('/')
expected_sha = os.environ.get('EXPECTED_SHA', '').strip()

release = json.loads((root / 'release.json').read_text(encoding='utf-8'))
assert release.get('repository') == 'FedorMilovanov/Milovi_School'
if expected_sha:
    assert release.get('sha') == expected_sha, (release.get('sha'), expected_sha)

canon = (root / 'canon.html').read_text(encoding='utf-8')
assert f'<link rel="canonical" href="{live}/canon/"' in canon
robots = re.search(r'<meta name="robots" content="([^"]+)"', canon, flags=re.I)
assert robots and 'max-image-preview:large' in robots.group(1).replace(' ', '').lower()
og = re.search(r'<meta property="og:image" content="([^"]+)"', canon, flags=re.I)
assert og and og.group(1).startswith(f'{live}/images/canon-sucre/')
assert 'trainedAlgorithmicMedia' in canon
assert 'редакционные AI-визуализации' in canon

sitemap_text = (root / 'sitemap.xml').read_text(encoding='utf-8')
for deprecated in ('image:title', 'image:caption', 'image:geo_location', 'image:license'):
    assert f'<{deprecated}>' not in sitemap_text, deprecated

ns = {
    'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9',
    'image': 'http://www.google.com/schemas/sitemap-image/1.1',
}
tree = ET.fromstring(sitemap_text)
urls = {}
for node in tree.findall('sm:url', ns):
    loc = node.find('sm:loc', ns)
    if loc is not None and loc.text:
        urls[loc.text.strip()] = node

canon_node = urls.get(f'{live}/canon/')
assert canon_node is not None
canon_images = [node.text.strip() for node in canon_node.findall('image:image/image:loc', ns) if node.text]
assert len(canon_images) == 15, len(canon_images)
assert len(set(canon_images)) == 15
assert all(url.startswith(f'{live}/images/canon-sucre/') for url in canon_images)

article_nodes = [(loc, node) for loc, node in urls.items() if '/articles/' in loc]
assert len(article_nodes) >= 150, len(article_nodes)
with_lastmod = sum(1 for _, node in article_nodes if node.find('sm:lastmod', ns) is not None)
assert with_lastmod >= 150, with_lastmod
with_image = sum(1 for _, node in article_nodes if node.find('image:image/image:loc', ns) is not None)
assert with_image == len(article_nodes), (with_image, len(article_nodes))

print(f'Live SEO proof passed: {len(article_nodes)} articles, {with_lastmod} lastmod, 15 Canon images')
PY

key_file="$(find public -maxdepth 1 -type f -name '*.txt' -printf '%f\n' 2>/dev/null | while read -r name; do stem="${name%.txt}"; value="$(tr -d '\r\n' < "public/$name")"; if [[ "$stem" =~ ^[A-Za-z0-9-]{8,128}$ && "$value" == "$stem" ]]; then printf '%s\n' "$name"; fi; done)"
[[ "$(printf '%s\n' "$key_file" | sed '/^$/d' | wc -l)" -eq 1 ]]
key_value="${key_file%.txt}"
live_key="$(curl -fsS --connect-timeout 12 --max-time 35 "$LIVE_BASE/$key_file" | tr -d '\r\n')"
[[ "$live_key" == "$key_value" ]]
printf 'Live IndexNow key proof passed: %s\n' "$key_file"
