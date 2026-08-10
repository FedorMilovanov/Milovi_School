#!/usr/bin/env python3
"""Fail-closed SEO/Image-SEO contract for the generated static site.

This audit intentionally checks standards-backed invariants, not folklore:
- indexable content pages permit large image previews;
- Canon exposes a preferred image plus 15 credited ImageObjects with AI provenance;
- image sitemap uses current image:loc-only markup and discovers all Canon media;
- lastmod appears only where generated Article JSON-LD provides a dateModified;
- WebSite exposes a stable alternateName fallback.

Raw search-engine ownership verification documents are intentionally excluded from
page-level SEO requirements. They are challenge-response files, not content pages.
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SITE = "https://french.milovicake.ru"
CANON = f"{SITE}/canon/"
DIGITAL_SOURCE_TYPE = "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"
IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1"

errors: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        errors.append(message)


def read_html(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def is_ownership_verification(path: Path) -> bool:
    name = path.name.lower()
    return name.startswith("google") or name.startswith("yandex_")


def jsonld_objects(soup: BeautifulSoup) -> list[object]:
    result: list[object] = []
    for node in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = node.string or node.get_text() or ""
        if not raw.strip():
            continue
        try:
            result.append(json.loads(raw))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid JSON-LD in {soup.title.string if soup.title else 'page'}: {exc}")
    return result


def flatten_jsonld(values: list[object]) -> list[dict]:
    result: list[dict] = []
    for value in values:
        if not isinstance(value, dict):
            continue
        graph = value.get("@graph")
        if isinstance(graph, list):
            result.extend(item for item in graph if isinstance(item, dict))
        else:
            result.append(value)
    return result


check(DIST.is_dir(), "dist/ must exist before SEO audit")
if not DIST.is_dir():
    print("SEO audit failed: dist/ is missing", file=sys.stderr)
    raise SystemExit(1)

# 1. Every indexable content HTML page explicitly permits large previews.
indexable_count = 0
for html_path in DIST.rglob("*.html"):
    if is_ownership_verification(html_path):
        continue
    soup = BeautifulSoup(read_html(html_path), "html.parser")
    robots = soup.find("meta", attrs={"name": re.compile(r"^robots$", re.I)})
    robots_value = (robots.get("content", "") if robots else "").lower()
    if "noindex" in robots_value:
        continue
    indexable_count += 1
    check(bool(robots), f"Indexable page lacks robots meta: {html_path.relative_to(DIST)}")
    check(
        "max-image-preview:large" in robots_value.replace(" ", ""),
        f"Indexable page must allow large image previews: {html_path.relative_to(DIST)}",
    )
check(indexable_count >= 150, f"Expected a substantial indexable corpus, found {indexable_count}")

# 2. Home WebSite entity has alternate names for site-name resolution.
home_soup = BeautifulSoup(read_html(DIST / "index.html"), "html.parser")
home_nodes = flatten_jsonld(jsonld_objects(home_soup))
website = next((node for node in home_nodes if node.get("@type") == "WebSite"), None)
check(isinstance(website, dict), "Homepage must expose WebSite JSON-LD")
if isinstance(website, dict):
    alternate = website.get("alternateName")
    check(isinstance(alternate, list) and len(alternate) >= 1, "WebSite must expose alternateName")

# 3. Canon preferred-image graph and transparent generated-media provenance.
canon_path = DIST / "canon" / "index.html"
check(canon_path.is_file(), "Generated /canon/ page is missing")
canon_soup = BeautifulSoup(read_html(canon_path), "html.parser") if canon_path.is_file() else BeautifulSoup("", "html.parser")
canon_nodes = flatten_jsonld(jsonld_objects(canon_soup))
collection = next((node for node in canon_nodes if node.get("@type") == "CollectionPage"), None)
image_objects = [node for node in canon_nodes if node.get("@type") == "ImageObject"]
check(isinstance(collection, dict), "Canon must expose CollectionPage JSON-LD")
check(len(image_objects) == 15, f"Canon must expose exactly 15 ImageObjects, found {len(image_objects)}")

image_ids = {node.get("@id") for node in image_objects if isinstance(node.get("@id"), str)}
if isinstance(collection, dict):
    primary = collection.get("primaryImageOfPage")
    primary_id = primary.get("@id") if isinstance(primary, dict) else None
    check(primary_id in image_ids, "CollectionPage.primaryImageOfPage must reference a Canon ImageObject")

for index, image in enumerate(image_objects, start=1):
    content_url = image.get("contentUrl")
    check(isinstance(content_url, str) and content_url.startswith(f"{SITE}/images/canon-sucre/"), f"Canon ImageObject {index} has invalid contentUrl")
    check(image.get("width") == 1280 and image.get("height") == 800, f"Canon ImageObject {index} must declare 1280×800")
    check(image.get("encodingFormat") == "image/webp", f"Canon ImageObject {index} must declare image/webp")
    check(bool(image.get("creditText")), f"Canon ImageObject {index} requires creditText")
    check(image.get("digitalSourceType") == DIGITAL_SOURCE_TYPE, f"Canon ImageObject {index} requires trainedAlgorithmicMedia provenance")
    if isinstance(content_url, str):
        local = DIST / urlparse(content_url).path.lstrip("/")
        check(local.is_file(), f"Canon ImageObject file missing from dist: {content_url}")

og_image = canon_soup.find("meta", attrs={"property": "og:image"})
og_alt = canon_soup.find("meta", attrs={"property": "og:image:alt"})
check(bool(og_image and str(og_image.get("content", "")).startswith(f"{SITE}/images/canon-sucre/")), "Canon OG image must be a representative Canon artwork")
check(bool(og_alt and str(og_alt.get("content", "")).strip()), "Canon OG image requires descriptive alt")
check("редакционные AI-визуализации" in canon_soup.get_text(" ", strip=True), "Canon must visibly disclose editorial AI visualizations")

# 4. Current Google image-sitemap markup: loc only, Canon discovery, truthful lastmod.
sitemap_path = DIST / "sitemap-0.xml"
check(sitemap_path.is_file(), "sitemap-0.xml is missing")
if sitemap_path.is_file():
    sitemap_text = sitemap_path.read_text(encoding="utf-8")
    for deprecated in ("image:title", "image:caption", "image:geo_location", "image:license"):
        check(f"<{deprecated}>" not in sitemap_text, f"Deprecated Google image sitemap tag must not be emitted: {deprecated}")

    root = ET.fromstring(sitemap_text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "image": IMAGE_NS}
    urls: dict[str, ET.Element] = {}
    for url_node in root.findall("sm:url", ns):
        loc_node = url_node.find("sm:loc", ns)
        if loc_node is not None and loc_node.text:
            urls[loc_node.text.strip()] = url_node

    canon_url_node = urls.get(CANON)
    check(canon_url_node is not None, "Sitemap must contain /canon/")
    if canon_url_node is not None:
        canon_locs = [
            node.text.strip()
            for node in canon_url_node.findall("image:image/image:loc", ns)
            if node.text
        ]
        check(len(canon_locs) == 15, f"/canon/ sitemap entry must contain 15 image:loc values, found {len(canon_locs)}")
        check(len(canon_locs) == len(set(canon_locs)), "Canon image sitemap URLs must be unique")
        check(all(loc.startswith(f"{SITE}/images/canon-sucre/") for loc in canon_locs), "Canon sitemap images must use dedicated Canon media")

    article_dir = DIST / "articles"
    expected_lastmods: dict[str, str] = {}
    for article_html in article_dir.glob("*/index.html"):
        article_soup = BeautifulSoup(read_html(article_html), "html.parser")
        article_nodes = flatten_jsonld(jsonld_objects(article_soup))
        article = next((node for node in article_nodes if node.get("@type") == "Article"), None)
        canonical = article_soup.find("link", attrs={"rel": "canonical"})
        if not isinstance(article, dict) or not canonical:
            continue
        modified = article.get("dateModified")
        href = canonical.get("href")
        if isinstance(modified, str) and isinstance(href, str):
            expected_lastmods[href] = modified

    check(len(expected_lastmods) >= 150, f"Expected dateModified on the article corpus, found {len(expected_lastmods)}")
    for loc, expected in expected_lastmods.items():
        node = urls.get(loc)
        check(node is not None, f"Article missing from sitemap: {loc}")
        if node is None:
            continue
        lastmod = node.find("sm:lastmod", ns)
        check(lastmod is not None and lastmod.text == expected, f"Sitemap lastmod mismatch for {loc}: expected {expected}")
        image_locs = [child.text for child in node.findall("image:image/image:loc", ns) if child.text]
        check(len(image_locs) >= 1, f"Article sitemap entry must expose an image:loc: {loc}")

if errors:
    print(f"SEO audit FAILED: {len(errors)} issue(s), {checks} checks", file=sys.stderr)
    for issue in errors:
        print(f" - {issue}", file=sys.stderr)
    raise SystemExit(1)

print(f"SEO audit passed: {checks} checks across {indexable_count} indexable pages")
