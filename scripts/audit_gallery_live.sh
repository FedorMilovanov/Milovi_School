#!/usr/bin/env bash
set -euo pipefail

LIVE_BASE="${LIVE_BASE:-https://french.milovicake.ru}"
EXPECTED_SHA="${EXPECTED_SHA:-}"
HOST="${LIVE_BASE#https://}"
HOST="${HOST%%/*}"
TMP_DIR="$(mktemp -d)"
COUNT=0
SOFT_WARNINGS=0
trap 'rm -rf "$TMP_DIR"' EXIT

pass() {
  COUNT=$((COUNT + 1))
  printf '✓ [%02d] %s\n' "$COUNT" "$1"
}

fail() {
  COUNT=$((COUNT + 1))
  printf '✗ [%02d] %s\n' "$COUNT" "$1" >&2
  exit 1
}

soft_warn() {
  SOFT_WARNINGS=$((SOFT_WARNINGS + 1))
  printf '⚠ %s\n' "$1" >&2
}

status_code() {
  curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 12 --max-time 35 "$1"
}

require_status() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local actual
  actual="$(status_code "$url")"
  [[ "$actual" == "$expected" ]] && pass "$label" || fail "$label (expected $expected, got $actual)"
}

require_contains() {
  local label="$1"
  local file="$2"
  local needle="$3"
  grep -Fqi -- "$needle" "$file" && pass "$label" || fail "$label"
}

require_not_contains() {
  local label="$1"
  local file="$2"
  local needle="$3"
  if grep -Fqi -- "$needle" "$file"; then fail "$label"; else pass "$label"; fi
}

if [[ -n "$EXPECTED_SHA" ]]; then
  matched=0
  for attempt in $(seq 1 60); do
    if curl -fsS --connect-timeout 12 --max-time 35 "$LIVE_BASE/release.json?gallery-audit=$attempt" > "$TMP_DIR/release.json"; then
      if EXPECTED_SHA="$EXPECTED_SHA" python3 - "$TMP_DIR/release.json" <<'PY'
import json, os, sys
with open(sys.argv[1], encoding='utf-8') as fh:
    payload = json.load(fh)
ok = payload.get('repository') == 'FedorMilovanov/Milovi_School' and payload.get('sha') == os.environ['EXPECTED_SHA']
raise SystemExit(0 if ok else 1)
PY
      then
        matched=1
        break
      fi
    fi
    sleep 10
  done
  [[ "$matched" == 1 ]] && pass "Live release witness matches the audited commit" || fail "Live release witness did not reach $EXPECTED_SHA"
else
  curl -fsS --connect-timeout 12 --max-time 35 "$LIVE_BASE/release.json" > "$TMP_DIR/release.json"
  pass "Live release witness is reachable"
fi

curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/" > "$TMP_DIR/home.html"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/materials/" > "$TMP_DIR/materials.html"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/robots.txt" > "$TMP_DIR/robots.txt"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/sitemap-index.xml" > "$TMP_DIR/sitemap-index.xml"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$LIVE_BASE/sitemap-0.xml" > "$TMP_DIR/sitemap-0.xml"
curl -fsSI --connect-timeout 12 --max-time 35 "$LIVE_BASE/materials/" > "$TMP_DIR/headers.txt"

require_status "HTTPS homepage returns 200" "$LIVE_BASE/"
require_status "HTTPS materials gallery returns 200" "$LIVE_BASE/materials/"
require_status "robots.txt returns 200" "$LIVE_BASE/robots.txt"
require_status "sitemap index returns 200" "$LIVE_BASE/sitemap-index.xml"
require_status "primary sitemap returns 200" "$LIVE_BASE/sitemap-0.xml"
require_status "service worker returns 200" "$LIVE_BASE/sw.js"
require_status "privacy page returns 200" "$LIVE_BASE/privacy/"
require_status "editorial policy returns 200" "$LIVE_BASE/editorial-policy/"
require_status "sources page returns 200" "$LIVE_BASE/sources/"
require_status "corrections page returns 200" "$LIVE_BASE/corrections/"
require_status "unknown route returns real 404" "$LIVE_BASE/__gallery-audit-missing__/" 404

http_location="$(curl -sSI --connect-timeout 12 --max-time 35 "http://$HOST/" | tr -d '\r' | awk 'tolower($1)=="location:" {print $2; exit}')"
[[ "$http_location" == https://* ]] && pass "HTTP redirects to HTTPS" || fail "HTTP redirects to HTTPS"

release_content_type="$(curl -sSI --connect-timeout 12 --max-time 35 "$LIVE_BASE/release.json" | tr -d '\r' | awk 'tolower($1)=="content-type:" {print tolower($2); exit}')"
[[ "$release_content_type" == application/json* ]] && pass "release.json is served as JSON" || fail "release.json is served as JSON"

EXPECTED_SHA="$EXPECTED_SHA" python3 - "$TMP_DIR/release.json" <<'PY'
import json, os, sys
with open(sys.argv[1], encoding='utf-8') as fh:
    payload = json.load(fh)
assert payload.get('repository') == 'FedorMilovanov/Milovi_School'
if os.environ.get('EXPECTED_SHA'):
    assert payload.get('sha') == os.environ['EXPECTED_SHA']
assert isinstance(payload.get('sha'), str) and len(payload['sha']) == 40
PY
pass "release.json repository and SHA contract is valid"

require_contains "Materials page has a non-empty title" "$TMP_DIR/materials.html" "<title>"
require_contains "Materials page has a meta description" "$TMP_DIR/materials.html" "name=\"description\""
require_contains "Materials page has a viewport meta" "$TMP_DIR/materials.html" "name=\"viewport\""
require_contains "Materials page has canonical metadata" "$TMP_DIR/materials.html" "rel=\"canonical\""
require_contains "Materials canonical points to live gallery" "$TMP_DIR/materials.html" "$LIVE_BASE/materials/"
require_contains "Materials page has Open Graph title" "$TMP_DIR/materials.html" "property=\"og:title\""
require_contains "Materials page has Open Graph image" "$TMP_DIR/materials.html" "property=\"og:image\""
require_contains "Materials page has Russian document language" "$TMP_DIR/materials.html" "lang=\"ru\""
require_contains "Gallery heading is present in server HTML" "$TMP_DIR/materials.html" "Галерея материалов"
require_not_contains "Materials page is not marked noindex" "$TMP_DIR/materials.html" "noindex"
require_not_contains "Materials HTML has no insecure absolute resource URLs" "$TMP_DIR/materials.html" "src=\"http://"

curl -sS -o "$TMP_DIR/not-found.html" --connect-timeout 12 --max-time 35 "$LIVE_BASE/__gallery-audit-missing__/"
require_contains "404 page carries noindex, follow" "$TMP_DIR/not-found.html" "noindex, follow"

require_contains "robots.txt advertises a sitemap" "$TMP_DIR/robots.txt" "Sitemap:"
require_contains "robots.txt points at the live HTTPS host" "$TMP_DIR/robots.txt" "$LIVE_BASE"
require_contains "sitemap index references sitemap-0.xml" "$TMP_DIR/sitemap-index.xml" "sitemap-0.xml"
require_contains "primary sitemap includes the materials gallery" "$TMP_DIR/sitemap-0.xml" "$LIVE_BASE/materials/"

python3 - "$TMP_DIR/sitemap-0.xml" "$LIVE_BASE" <<'PY'
import sys, xml.etree.ElementTree as ET
path, base = sys.argv[1:]
root = ET.parse(path).getroot()
locs = [node.text.strip() for node in root.iter() if node.tag.endswith('loc') and node.text]
page_locs = [loc for loc in locs if '/images/' not in loc]
article_locs = [loc for loc in page_locs if '/articles/' in loc]
assert len(article_locs) >= 100, len(article_locs)
assert len(page_locs) == len(set(page_locs)), 'duplicate page locs'
assert all(loc.startswith(base) for loc in page_locs), 'foreign or non-HTTPS loc'
PY
pass "Sitemap has 100+ unique same-origin article URLs"

python3 - "$TMP_DIR/materials.html" "$LIVE_BASE" > "$TMP_DIR/extracted.json" <<'PY'
import json, re, sys
from urllib.parse import urljoin
html, base = open(sys.argv[1], encoding='utf-8').read(), sys.argv[2]

def unique_urls(values):
    result = []
    for value in values:
        absolute = urljoin(base + '/', value)
        if absolute not in result:
            result.append(absolute)
    return result

hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.I)
articles = [url for url in unique_urls(hrefs) if '/articles/' in url]
images = unique_urls(re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, flags=re.I))
stylesheet_hrefs = re.findall(r'<link[^>]+rel=["\'][^"\']*stylesheet[^"\']*["\'][^>]+href=["\']([^"\']+)["\']', html, flags=re.I)
stylesheet_hrefs += re.findall(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\'][^"\']*stylesheet[^"\']*["\']', html, flags=re.I)
styles = unique_urls(stylesheet_hrefs)
script_srcs = unique_urls(re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, flags=re.I))
script_tags = len(re.findall(r'<script\b', html, flags=re.I))
assets = unique_urls(stylesheet_hrefs + re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, flags=re.I))
print(json.dumps({
    'articles': articles,
    'images': images,
    'styles': styles,
    'script_srcs': script_srcs,
    'script_tags': script_tags,
    'assets': assets,
}, ensure_ascii=False))
PY

python3 - "$TMP_DIR/extracted.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
assert len(payload['articles']) >= 100, len(payload['articles'])
assert len(payload['articles']) == len(set(payload['articles']))
PY
pass "Server-rendered gallery exposes 100+ unique article links"

sample_article="$(python3 - "$TMP_DIR/extracted.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1], encoding='utf-8'))['articles'][0])
PY
)"
require_status "First gallery article URL returns 200" "$sample_article"
curl -fsS --compressed --connect-timeout 12 --max-time 35 "$sample_article" > "$TMP_DIR/article.html"
require_contains "Sample article canonical matches its URL" "$TMP_DIR/article.html" "$sample_article"
require_contains "Sample article has Article JSON-LD" "$TMP_DIR/article.html" "\"@type\":\"Article\""
require_not_contains "Sample article is not marked noindex" "$TMP_DIR/article.html" "noindex"

python3 - "$TMP_DIR/extracted.json" > "$TMP_DIR/url-sample.txt" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
urls = payload['articles'][:12] + payload['images'][:12] + payload['assets'][:12]
for url in dict.fromkeys(urls):
    print(url)
PY
sample_count=0
while IFS= read -r url; do
  [[ -z "$url" ]] && continue
  code="$(status_code "$url")"
  [[ "$code" == 200 ]] || fail "Sample gallery dependency returns 200: $url (got $code)"
  sample_count=$((sample_count + 1))
done < "$TMP_DIR/url-sample.txt"
(( sample_count >= 20 )) && pass "$sample_count sampled article/image/asset URLs are healthy" || fail "Too few gallery dependencies were sampled"

style_count="$(python3 - "$TMP_DIR/extracted.json" <<'PY'
import json, sys
print(len(json.load(open(sys.argv[1], encoding='utf-8'))['styles']))
PY
)"
(( style_count >= 1 )) && pass "Gallery server HTML references a production stylesheet" || fail "Gallery server HTML references a production stylesheet"

script_tag_count="$(python3 - "$TMP_DIR/extracted.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1], encoding='utf-8'))['script_tags'])
PY
)"
(( script_tag_count >= 1 )) && pass "Gallery server HTML contains hydration or runtime scripts" || fail "Gallery server HTML contains hydration or runtime scripts"

image_count="$(python3 - "$TMP_DIR/extracted.json" <<'PY'
import json, sys
print(len(json.load(open(sys.argv[1], encoding='utf-8'))['images']))
PY
)"
(( image_count >= 20 )) && pass "Gallery server HTML exposes a meaningful image set" || fail "Gallery server HTML exposes a meaningful image set"

response_time="$(curl -sS -o /dev/null --connect-timeout 12 --max-time 35 -w '%{time_total}' "$LIVE_BASE/materials/")"
python3 - "$response_time" <<'PY'
import sys
assert float(sys.argv[1]) < 8.0, sys.argv[1]
PY
pass "Live gallery responds in under 8 seconds from GitHub runner"

require_contains "Live gallery response includes a cache policy" "$TMP_DIR/headers.txt" "cache-control:"
require_contains "Live gallery response includes a content type" "$TMP_DIR/headers.txt" "content-type:"

cert_end="$(echo | openssl s_client -servername "$HOST" -connect "$HOST:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2-)"
[[ -n "$cert_end" ]] || fail "TLS certificate expiry can be read"
python3 - "$cert_end" <<'PY'
from datetime import datetime, timezone
import sys
expiry = datetime.strptime(sys.argv[1], '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
assert (expiry - datetime.now(timezone.utc)).days >= 14
PY
pass "TLS certificate remains valid for at least 14 days"

cert_text="$(echo | openssl s_client -servername "$HOST" -connect "$HOST:443" 2>/dev/null | openssl x509 -noout -text)"
grep -Fq "$HOST" <<< "$cert_text" && pass "TLS certificate covers the live hostname" || fail "TLS certificate covers the live hostname"

curl -fsS --connect-timeout 12 --max-time 35 "https://dns.google/resolve?name=$HOST&type=A" > "$TMP_DIR/google-dns.json"
python3 - "$TMP_DIR/google-dns.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
assert payload.get('Status') == 0
assert payload.get('Answer')
PY
pass "Google Public DNS resolves the live host"

curl -fsS -H 'accept: application/dns-json' --connect-timeout 12 --max-time 35 "https://cloudflare-dns.com/dns-query?name=$HOST&type=A" > "$TMP_DIR/cloudflare-dns.json"
python3 - "$TMP_DIR/cloudflare-dns.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
assert payload.get('Status') == 0
assert payload.get('Answer')
PY
pass "Cloudflare DNS resolves the live host"

if [[ -n "$EXPECTED_SHA" ]]; then
  curl -fsS -H 'Accept: application/vnd.github+json' --connect-timeout 12 --max-time 35 \
    "https://api.github.com/repos/FedorMilovanov/Milovi_School/commits/$EXPECTED_SHA" > "$TMP_DIR/github-commit.json"
  EXPECTED_SHA="$EXPECTED_SHA" python3 - "$TMP_DIR/github-commit.json" <<'PY'
import json, os, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
assert payload.get('sha') == os.environ['EXPECTED_SHA']
PY
  pass "GitHub public API exposes the audited commit"
fi

encoded_url="$(python3 - "$LIVE_BASE/materials/" <<'PY'
import sys
from urllib.parse import quote
print(quote(sys.argv[1], safe=''))
PY
)"
if curl -fsS --connect-timeout 15 --max-time 90 "https://validator.w3.org/nu/?doc=$encoded_url&out=json" > "$TMP_DIR/w3c.json"; then
  if python3 - "$TMP_DIR/w3c.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
errors = [m for m in payload.get('messages', []) if m.get('type') == 'error']
if errors:
    for item in errors[:10]:
        print(item.get('message', 'validator error'), file=sys.stderr)
raise SystemExit(0 if not errors else 1)
PY
  then
    pass "W3C Nu validator reports no HTML errors for gallery"
  else
    fail "W3C Nu validator reports HTML errors for gallery"
  fi
else
  soft_warn "W3C validator was temporarily unreachable"
fi

if curl -fsS --connect-timeout 15 --max-time 90 \
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$encoded_url&strategy=desktop&category=performance&category=accessibility&category=seo" \
  > "$TMP_DIR/pagespeed.json"; then
  if python3 - "$TMP_DIR/pagespeed.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
categories = payload.get('lighthouseResult', {}).get('categories', {})
required = {'performance', 'accessibility', 'seo'}
assert required.issubset(categories)
for key in sorted(required):
    score = categories[key].get('score')
    print(f'PageSpeed {key}: {score}')
PY
  then
    pass "Google PageSpeed API returned performance/accessibility/SEO audits"
  else
    soft_warn "Google PageSpeed returned an incomplete response"
  fi
else
  soft_warn "Google PageSpeed API was rate-limited or unavailable"
fi

if curl -fsS --connect-timeout 15 --max-time 60 \
  "https://api.ssllabs.com/api/v3/analyze?host=$HOST&fromCache=on&all=done" > "$TMP_DIR/ssllabs.json"; then
  python3 - "$TMP_DIR/ssllabs.json" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8'))
print('SSL Labs status:', payload.get('status'))
for endpoint in payload.get('endpoints') or []:
    if endpoint.get('grade'):
        print('SSL Labs grade:', endpoint['grade'])
PY
  pass "SSL Labs API returned a cached host assessment"
else
  soft_warn "SSL Labs cached assessment was unavailable"
fi

if (( COUNT < 49 )); then
  fail "Live audit executed at least 49 hard checks"
fi

printf '\nExternal gallery audit passed: %d hard checks, %d soft warnings.\n' "$COUNT" "$SOFT_WARNINGS"
