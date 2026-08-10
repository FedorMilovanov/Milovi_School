#!/usr/bin/env python3
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / 'src' / 'components' / 'CanonGateway.tsx'
CSS = ROOT / 'src' / 'styles' / 'canon-gateway.css'
ASSET = ROOT / 'public' / 'images' / 'canon-sucre' / 'canon-gateway-hero.webp'
EXPECTED_BYTES = 77970
EXPECTED_SHA256 = 'a954f979338ba59328cf2d92ea4e848265ce17054b5b6b807ff45fe9a8afd5fc'

errors: list[str] = []

if not ASSET.exists():
    errors.append('Missing final owner-selected Canon gateway asset')
else:
    data = ASSET.read_bytes()
    size = len(data)
    digest = hashlib.sha256(data).hexdigest()
    if size != EXPECTED_BYTES:
        errors.append(f'Canon gateway derivative byte size changed: {size} != {EXPECTED_BYTES}')
    if digest != EXPECTED_SHA256:
        errors.append(f'Canon gateway derivative SHA-256 changed: {digest}')

component = COMPONENT.read_text('utf-8') if COMPONENT.exists() else ''
css = CSS.read_text('utf-8') if CSS.exists() else ''

required_component = [
    "'/images/canon-sucre/canon-gateway-hero.webp'",
    'width={1916}',
    'height={821}',
]
for token in required_component:
    if token not in component:
        errors.append(f'CanonGateway lost panoramic master contract: {token}')

for retired in ('canon-gateway-media-item', 'GATEWAY_SELECTION'):
    if retired in component or retired in css:
        errors.append(f'Retired fragmented gateway construct returned: {retired}')

if 'inset: 0;' not in css:
    errors.append('Desktop gateway media must remain a full-bleed image plane')
if 'object-fit: cover;' not in css:
    errors.append('Desktop gateway requires bounded cover art direction')
if not re.search(r'object-position:\s*(?:50|5[0-9])%\s+(?:5[0-9])%;', css):
    errors.append('Desktop gateway vertical crop anchor is missing')

mobile_contracts = [
    'height: clamp(190px, 42vw, 340px);',
    'object-fit: contain;',
    'object-position: 50% 50%;',
]
for token in mobile_contracts:
    if token not in css:
        errors.append(f'Mobile gateway must preserve the complete panoramic composition: {token}')

if errors:
    print('# Canon gateway asset gate')
    for error in errors:
        print(f'- FAIL: {error}')
    raise SystemExit(1)

print('# Canon gateway asset gate')
print(f'- PASS: exact final panoramic derivative present ({ASSET.stat().st_size} bytes)')
print(f'- PASS: SHA-256 locked to {EXPECTED_SHA256}')
print('- PASS: 1916×821 dimensions declared in component')
print('- PASS: desktop full-bleed crop preserves the low horizontal lineup')
print('- PASS: mobile uses contained panorama instead of cutting pastry forms')
print('- PASS: retired five-panel gateway constructs absent')
