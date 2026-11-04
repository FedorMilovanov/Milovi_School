#!/usr/bin/env python3
"""Fail-closed build audit: article hydration contains only related-card metadata.

The complete CommandPalette index is built as a shared static JSON document,
not embedded into every individual article's SSR HTML.
"""
from __future__ import annotations

import json
import statistics
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
INDEX = DIST / "article-index.json"
REQUIRED_META = {"id", "title", "excerpt", "category", "readTime", "image", "tags", "author"}
ALLOWED_META = REQUIRED_META | {"imageAlt", "date"}


class IslandParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.article_props: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "astro-island":
            return
        data = dict(attrs)
        if "ArticlePageShell" in (data.get("component-url") or ""):
            props = data.get("props")
            assert props is not None, "ArticlePageShell is missing serialized props"
            self.article_props.append(props)


def main() -> None:
    assert INDEX.is_file(), "Missing built article-index.json"
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    assert isinstance(index, list) and len(index) >= 100, "Invalid/empty article index"
    ids: set[str] = set()
    for item in index:
        assert isinstance(item, dict), "Malformed search metadata"
        assert REQUIRED_META <= item.keys(), "Search metadata missing required fields"
        assert item.keys() <= ALLOWED_META, "Search metadata contains excess fields"
        assert isinstance(item["id"], str) and item["id"] not in ids
        ids.add(item["id"])
        assert "content" not in item, "Full article content leaked to search index"

    pages = sorted((DIST / "articles").glob("*/index.html"))
    assert len(pages) == len(index), "Search index and article routes have different ID sets"
    assert {page.parent.name for page in pages} == ids, "Article IDs differ from index"

    sizes: list[int] = []
    for page in pages:
        parser = IslandParser()
        parser.feed(page.read_text(encoding="utf-8"))
        assert len(parser.article_props) == 1, f"{page}: expected one ArticlePageShell"
        raw = parser.article_props[0]
        payload = json.loads(raw)
        assert "allMeta" not in payload, f"{page}: full metadata still in HTML"
        related = payload.get("relatedMeta")
        assert isinstance(related, list) and related[0] == 1, f"{page}: missing related array"
        related_items = related[1]
        assert isinstance(related_items, list) and len(related_items) <= 3
        article = payload.get("article")
        assert isinstance(article, list) and article[0] == 0
        article_id = article[1]["id"][1]
        assert article_id == page.parent.name, f"{page}: mismatched article ID"
        category = article[1]["category"][1]
        tagged = article[1].get("tags")
        article_tags = {entry[1] for entry in tagged[1]} if tagged and tagged[0] == 1 else set()
        same_category = [
            item for item in index if item["id"] != article_id and item["category"] == category
        ]
        expected_related = (
            same_category[:3]
            if len(same_category) >= 3
            else (
                same_category
                + [
                    item
                    for item in index
                    if item["id"] != article_id
                    and item["category"] != category
                    and any(tag in article_tags for tag in item["tags"])
                ]
            )[:3]
        )
        related_ids: list[str] = []
        for related_item in related_items:
            assert related_item[0] == 0
            related_id = related_item[1]["id"][1]
            assert related_id in ids and related_id != article_id, f"{page}: invalid related card"
            related_ids.append(related_id)
        assert related_ids == [item["id"] for item in expected_related], (
            f"{page}: related-card selection or order changed"
        )
        sizes.append(len(raw))

    print(
        "Article client payload audit passed: "
        f"{len(pages)} article pages, {len(index)} indexed records, "
        f"median island props={int(statistics.median(sizes))} chars, "
        f"max={max(sizes)} chars, search index={INDEX.stat().st_size} bytes, "
        "all related-card arrays <=3 and no full-library hydration."
    )


if __name__ == "__main__":
    main()
