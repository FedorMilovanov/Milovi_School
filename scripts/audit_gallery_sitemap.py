#!/usr/bin/env python3
"""Validate page and image locs with distinct XML namespaces (not URL heuristics).

The sitemap specification permits an image:loc on a different HTTPS origin.
It does not permit foreign page URLs in a site's own urlset. Previous checks
mistakenly selected every element ending in "loc", treating remote image URLs
as pages, so a legitimate museum/source cover failed the deployment witness.
"""
from __future__ import annotations

import argparse
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

PAGE_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1"
SM = {"sm": PAGE_NS, "image": IMAGE_NS}


def validate(xml_text: str, base: str, minimum_articles: int = 100) -> tuple[int, int]:
    base_url = urlsplit(base)
    assert base_url.scheme == "https" and base_url.hostname, "Expected HTTPS live base"
    assert not base_url.path.strip("/"), "Expected site root as live base"
    expected = f"{base_url.scheme}://{base_url.netloc}"

    root = ET.fromstring(xml_text)
    assert root.tag == f"{{{PAGE_NS}}}urlset", "Not a sitemap urlset"
    page_nodes = root.findall("sm:url/sm:loc", SM)
    image_nodes = root.findall("sm:url/image:image/image:loc", SM)

    def value(node: ET.Element) -> str:
        return (node.text or "").strip()

    pages = [value(node) for node in page_nodes]
    images = [value(node) for node in image_nodes]

    assert pages and all(pages), "Empty page loc"
    articles = [url for url in pages if urlsplit(url).path.startswith("/articles/")]
    assert len(articles) >= minimum_articles, f"Not enough article URLs: {len(articles)}"
    assert len(pages) == len(set(pages)), "Duplicate page locs"

    for page in pages:
        parsed = urlsplit(page)
        assert parsed.scheme == "https" and f"{parsed.scheme}://{parsed.netloc}" == expected, (
            f"Foreign or non-HTTPS page loc: {page}"
        )
        assert parsed.path.startswith("/") and not parsed.query and not parsed.fragment, (
            f"Noncanonical page loc: {page}"
        )

    for image in images:
        parsed = urlsplit(image)
        assert parsed.scheme == "https" and parsed.hostname, f"Invalid HTTPS image loc: {image}"
        # Unlike page locs, image:loc is allowed on an external HTTPS origin.
    return len(pages), len(images)


def selftest() -> None:
    base = "https://french.milovicake.ru"
    foreign_image = "https://raw.githubusercontent.com/example/cover.webp"

    def xml(page_urls: list[str], image_urls: list[str]) -> str:
        url_nodes = []
        for idx, page in enumerate(page_urls):
            img = "".join(f"<image:image><image:loc>{link}</image:loc></image:image>" for link in (image_urls if idx == 0 else []))
            url_nodes.append(f"<url><loc>{page}</loc>{img}</url>")
        return (
            f'<urlset xmlns="{PAGE_NS}" xmlns:image="{IMAGE_NS}">'
            + "".join(url_nodes)
            + "</urlset>"
        )

    safe = xml([f"{base}/articles/one/", f"{base}/history/"], [foreign_image, f"{base}/images/a.webp"])
    assert validate(safe, base, minimum_articles=1) == (2, 2)

    invalid_fixtures = (
        (xml([f"{base}/articles/one/", "https://bad.example/articles/two/"], [foreign_image]), 1),
        (xml([f"{base}/articles/one/", "http://french.milovicake.ru/history/"], []), 1),
        (xml([f"{base}/articles/one/", f"{base}/articles/one/"], []), 1),
        (xml([f"{base}.evil.example/articles/one/"], []), 1),
        (xml([f"{base}/articles/one/"], ["http://raw.githubusercontent.com/example/cover.webp"]), 1),
        (xml([f"{base}/articles/one/"], []), 2),
    )
    for bad_xml, minimum in invalid_fixtures:
        try:
            validate(bad_xml, base, minimum_articles=minimum)
        except AssertionError:
            continue
        raise AssertionError("Invalid sitemap passed regression tests")
    print("Sitemap XML namespace selftest: PASS (external HTTPS image; foreign pages blocked)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("xml", nargs="?")
    parser.add_argument("base", nargs="?")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest()
        return
    if not args.xml or not args.base:
        parser.error("xml path and base URL are required unless --selftest")
    with open(args.xml, "r", encoding="utf-8") as handle:
        pages, images = validate(handle.read(), args.base)
    print(f"Sitemap: PASS {pages} page locs, {images} image locs (HTTPS and namespace-aware)")


if __name__ == "__main__":
    main()
