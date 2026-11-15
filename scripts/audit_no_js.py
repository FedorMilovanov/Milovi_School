#!/usr/bin/env python3
"""No-JS contract for the public pages.

The site is statically rendered, but the interesting content lives inside React
islands. If a component animates its text from `opacity: 0`, framer-motion writes
`style="opacity:0"` into the static HTML — the text is then present in the
document but invisible for every client that runs without scripts (readers with
JS disabled, corporate proxies, blocked bundles, some crawlers' text passes).

This gate fails closed on that class of regression:

1. the headline of each key page exists in the HTML and is not hidden by an
   inline `opacity:0` / `visibility:hidden` / `display:none` ancestor;
2. each key page still carries its content as text (word budgets) and keeps the
   specific editorial markers a reader must see;
3. text blocks (headings, paragraphs, list items) are never hidden behind an
   inline `opacity:0` unless they are part of JS-only chrome (`<nav>`);
4. the reveal animations stay gated on `html.js`, i.e. the shipped CSS never
   hides content when the class is absent.

Usage: python scripts/audit_no_js.py [dist]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "dist"

HIDING_STYLE_RE = re.compile(
    r"(?:opacity\s*:\s*0(?:\.0+)?\s*(?:;|$)|visibility\s*:\s*hidden|display\s*:\s*none)",
    re.I,
)

# page -> (minimum visible words, required visible markers)
KEY_PAGES: dict[str, tuple[int, tuple[str, ...]]] = {
    "index.html": (500, ("Архив по темам", "Техники", "Рецепты")),
    "canon/index.html": (1200, ("LE CANON", "15 десертов")),
    "materials/index.html": (1500, ("Галерея материалов",)),
    "history/index.html": (600, ("История",)),
    "about/index.html": (350, ()),
    "methodology/index.html": (300, ()),
}

errors: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        errors.append(message)


def hidden_by_inline_style(node) -> bool:
    """True if the node or any ancestor hides itself through an inline style."""
    current = node
    while current is not None and getattr(current, "attrs", None) is not None:
        style = current.attrs.get("style") or ""
        if HIDING_STYLE_RE.search(style):
            return True
        current = current.parent
    return False


def visible_text(soup: BeautifulSoup) -> str:
    clone = BeautifulSoup(str(soup), "html.parser")
    for tag in clone(["script", "style", "noscript"]):
        tag.decompose()
    return clone.get_text(" ", strip=True)


def main() -> int:
    if not DIST.is_dir():
        print("No-JS audit failed: dist/ is missing", file=sys.stderr)
        return 1

    for rel, (min_words, markers) in KEY_PAGES.items():
        path = DIST / rel
        check(path.is_file(), f"Key page is missing from the build: {rel}")
        if not path.is_file():
            continue
        raw = path.read_text(encoding="utf-8")
        soup = BeautifulSoup(raw, "html.parser")

        check("classList.add('js')" in raw, f"{rel}: pre-paint script must mark html.js")

        headings = soup.find_all("h1")
        check(len(headings) == 1, f"{rel}: expected exactly one h1, found {len(headings)}")
        for heading in headings:
            text = heading.get_text(" ", strip=True)
            check(bool(text), f"{rel}: h1 is empty")
            check(
                not hidden_by_inline_style(heading),
                f"{rel}: h1 must not be hidden by inline styles (no-JS readers would see nothing)",
            )

        text = visible_text(soup)
        words = len(text.split())
        check(words >= min_words, f"{rel}: visible text without JS is {words} words, expected >= {min_words}")
        # LuxuryText renders headings as one <span> per letter, so compare the
        # markers with all whitespace removed.
        squashed = re.sub(r"\s+", "", text)
        for marker in markers:
            check(
                re.sub(r"\s+", "", marker) in squashed,
                f"{rel}: visible text without JS is missing {marker!r}",
            )

    # Text blocks must not be parked at opacity:0 by the server. Navigation
    # chrome (<nav>) is exempt: its controls are JS handlers by design.
    for html_path in sorted(DIST.rglob("*.html")):
        rel = html_path.relative_to(DIST)
        soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
        for node in soup.find_all(["h1", "h2", "h3", "p", "li"]):
            if len(node.get_text(" ", strip=True).split()) < 3:
                continue
            if node.find_parent("nav") is not None:
                continue
            check(
                not hidden_by_inline_style(node),
                f"{rel}: <{node.name}> is hidden by an inline style without JS: "
                f"{node.get_text(' ', strip=True)[:70]!r}",
            )

    # The reveal/entrance animations must stay opt-in: `html.js` is added by the
    # pre-paint script, so an unscoped hiding rule would break every no-JS client.
    css_files = sorted(DIST.glob("_astro/*.css"))
    check(bool(css_files), "No CSS bundle found in dist/_astro")
    hiding = re.compile(r"\.(reveal|enter-up)(?:\.in)?\{([^}]*)\}", re.I)
    for css in css_files:
        text = css.read_text(encoding="utf-8")
        for match in hiding.finditer(text):
            body = match.group(2)
            if not re.search(r"opacity\s*:\s*0(?:\.0+)?(?:;|$)", body, re.I):
                continue
            prefix = text[max(0, match.start() - 8):match.start()]
            check(
                prefix == "html.js ",
                f"{css.name}: hiding rule must be scoped to html.js: {prefix + match.group(0)}",
            )
        if ".reveal" in text:
            check("html.js .reveal" in text, f"{css.name}: .reveal styles must be scoped to html.js")
        if ".enter-up" in text:
            check("html.js .enter-up" in text, f"{css.name}: .enter-up styles must be scoped to html.js")

    if errors:
        print(f"No-JS audit FAILED: {len(errors)} issue(s), {checks} checks", file=sys.stderr)
        for issue in errors[:40]:
            print(f" - {issue}", file=sys.stderr)
        if len(errors) > 40:
            print(f" - … {len(errors) - 40} more", file=sys.stderr)
        return 1

    print(f"No-JS audit passed: {checks} checks across {len(KEY_PAGES)} key pages and the shipped CSS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
