#!/usr/bin/env python3
"""Permanent gate: every cited French source must be a real, reachable document.

AGENTS.md §4 forbids publishing claims without evidence and §0.11 forbids fake
claims. A citation that 404s, that sits behind a login wall, or that points at a
search-results page is not evidence: the reader cannot verify it. This gate turns
that editorial rule into a build contract instead of relying on memory.

Two severity tiers:

* ``dead``  — hard failure. HTTP 4xx/5xx, DNS/TLS failure, or a soft-404 body
  (``introuvable`` / ``not authorized`` / ``page not found``).
* ``weak``  — ratcheted failure. Search-result pages, bare site roots and other
  index-only citations. The corpus still carries some of these, so the budget is
  frozen at ``MAX_WEAK_CITATIONS`` and may only ever be lowered. Raising it
  requires an explicit editorial decision, not a silent regression.

Network behaviour: CI has egress, local sandboxes often do not. A control probe
decides which mode applies. Without egress the gate reports ``skipped`` and exits
0 so that offline ``npm run validate`` stays meaningful; the live workflows run it
with ``--require-network`` so a silent skip can never pass as green.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ARTICLES_PATH = ROOT / "src" / "data" / "articles.ts"
EXPANSIONS_DIR = ROOT / "src" / "data" / "articleExpansionParts"
CANON_CONTENTS_PATH = ROOT / "src" / "data" / "canonArticleContents.ts"
CANON_APPENDICES_PATH = ROOT / "src" / "data" / "canonArticleAppendices.ts"
CANON_ARTICLES_PATH = ROOT / "src" / "data" / "canonArticles.ts"
OUTPUT_DIR = ROOT / "artifacts" / "source-links-report"

# Frozen ratchet. Lower it as weak citations are replaced by real documents.
# Measured on the 2026-09-15 corpus: 73 weak citations out of 554.
# Lowered 2026-09-16: Gallica SRU search URLs and bare inao.gouv.fr roots were
# replaced with real documents (ark:/12148/bpt6k6209316c, igp-nougat-de-montelimar,
# produit/nougat-de-montelimar-4392, igp-indication-geographique-protegee);
# calisson gained UFCA projet-igp, the INAO product registry and Sénat n° 1572S.
# Re-measured on the 2026-09-16 corpus: 68 weak citations out of 558.
MAX_WEAK_CITATIONS = 68

ENTRY_RE = re.compile(r"(?m)^\s*'([^']+)'\s*:\s*`((?:\\`|[^`])*)`\s*,")
MARKDOWN_URL_RE = re.compile(r"\[[^\]]*\]\((https?://[^)\s]+)\)")
BARE_URL_RE = re.compile(r"(?<![(\[])https?://[^\s<>'\"`)\]]+")
SOURCE_URL_FIELD_RE = re.compile(r"(?m)^\s*sourceUrl\s*:\s*'([^']+)'")

# A page whose visible title/heading says this is a soft-404 even on HTTP 200.
SOFT_404_MARKERS = (
    "introuvable",
    "page not found",
    "not found",
    "vous n'êtes pas autorisé",
    "you are not authorized",
    "access denied",
    "accès refusé",
    "erreur 404",
    "404 not found",
)
CONTROL_URL = "https://www.w3.org/"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0 Safari/537.36 MiloviSchool-SourceGate/1.0"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6",
}
RETRIES = 2
TIMEOUT = 30


def generic_path(url: str) -> bool:
    """True for citations that resolve to a site root or an index/search page."""
    parsed = urlsplit(url)
    path = parsed.path.rstrip("/") or "/"
    if path in {"/", "/fr", "/en", "/en-us", "/recettes", "/articles", "/univers", "/search"}:
        return True
    if re.search(r"(?:^|/)(?:recherche|search|results)(?:/|$)", path, flags=re.I):
        return True
    if re.search(r"(?:\?|&)(?:q|s|query|search|keywords?)=", parsed.query, flags=re.I):
        return True
    return False


def collect_citations() -> list[dict[str, str]]:
    """Every source URL the corpus publishes, with the article that cites it."""
    citations: list[dict[str, str]] = []

    def add(article_id: str, url: str, origin: str) -> None:
        citations.append({"articleId": article_id, "url": url.strip().rstrip(","), "origin": origin})

    def scan_entries(text: str, origin: str) -> None:
        for article_id, body in ENTRY_RE.findall(text):
            for url in MARKDOWN_URL_RE.findall(body):
                add(article_id, url, origin)

    for path in sorted(EXPANSIONS_DIR.glob("part*.ts")):
        scan_entries(path.read_text(encoding="utf-8"), "expansion")
    for path in (CANON_CONTENTS_PATH, CANON_APPENDICES_PATH):
        if path.exists():
            scan_entries(path.read_text(encoding="utf-8"), "canon")

    for path, label in ((ARTICLES_PATH, "metadata"), (CANON_ARTICLES_PATH, "canon-metadata")):
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for url in SOURCE_URL_FIELD_RE.findall(text):
            add("__metadata__", url, label)

    return citations


def probe(url: str) -> dict[str, object]:
    last_error = "unknown"
    for attempt in range(RETRIES + 1):
        try:
            request = urllib.request.Request(url, headers=HEADERS, method="GET")
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                raw = response.read(120_000)
                status = int(response.status)
                final_url = response.geturl()
            body = raw.decode("utf-8", errors="ignore").lower()
            head = re.search(r"<title[^>]*>(.*?)</title>", body, flags=re.S)
            title = re.sub(r"\s+", " ", head.group(1)).strip() if head else ""
            if 200 <= status < 400 and title:
                lowered = title.lower()
                if any(marker in lowered for marker in SOFT_404_MARKERS):
                    return {"url": url, "status": status, "title": title, "verdict": "dead",
                            "reason": f"soft-404 title: {title!r}"}
            if status >= 400:
                return {"url": url, "status": status, "title": title, "verdict": "dead",
                        "reason": f"HTTP {status}"}
            return {"url": url, "status": status, "finalUrl": final_url, "title": title,
                    "verdict": "weak" if generic_path(url) else "ok", "reason": ""}
        except urllib.error.HTTPError as error:
            if error.code in {403, 405, 429, 503} and attempt < RETRIES:
                last_error = f"HTTP {error.code}"
                time.sleep(1.5 * (attempt + 1))
                continue
            return {"url": url, "status": error.code, "title": "", "verdict": "dead",
                    "reason": f"HTTP {error.code}"}
        except Exception as error:  # noqa: BLE001 — network faults are data here
            last_error = f"{type(error).__name__}: {error}"
            if attempt < RETRIES:
                time.sleep(1.5 * (attempt + 1))
    return {"url": url, "status": 0, "title": "", "verdict": "dead", "reason": last_error}


def network_available() -> bool:
    try:
        request = urllib.request.Request(CONTROL_URL, headers=HEADERS, method="HEAD")
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return int(response.status) < 500
    except Exception:  # noqa: BLE001
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-network", action="store_true",
                        help="fail instead of skipping when egress is unavailable")
    parser.add_argument("--max-workers", type=int, default=8)
    args = parser.parse_args()

    citations = collect_citations()
    if not citations:
        print("Source-link gate parsed no citations — parser regression", file=sys.stderr)
        return 1

    if not network_available():
        message = ("Source-link gate SKIPPED: no network egress. "
                   "Live CI runs this with --require-network.")
        if args.require_network:
            print(message, file=sys.stderr)
            return 1
        print(message)
        return 0

    unique_urls = sorted({item["url"] for item in citations})
    print(f"Probing {len(unique_urls)} unique source URLs "
          f"({len(citations)} citations across the corpus)…")
    with ThreadPoolExecutor(max_workers=args.max_workers) as pool:
        results = list(pool.map(probe, unique_urls))

    verdict = {item["url"]: item for item in results}
    by_article: dict[str, list[str]] = {}
    for citation in citations:
        result = verdict[citation["url"]]
        if result["verdict"] == "dead":
            by_article.setdefault(citation["articleId"], []).append(
                f"{citation['url']} ({result['reason']})")

    dead_urls = [item for item in results if item["verdict"] == "dead"]
    weak_citations = [c for c in citations if verdict[c["url"]]["verdict"] == "weak"]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = {
        "uniqueUrls": len(unique_urls),
        "citations": len(citations),
        "deadUrls": len(dead_urls),
        "weakCitations": len(weak_citations),
        "weakBudget": MAX_WEAK_CITATIONS,
        "domains": len({urlsplit(u).netloc.lower().removeprefix("www.") for u in unique_urls}),
        "statusCounts": dict(Counter(str(item["status"]) for item in results)),
    }
    (OUTPUT_DIR / "report.json").write_text(
        json.dumps({"summary": summary, "results": results,
                    "deadByArticle": by_article}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")

    lines = [
        "# Аудит живости французских источников",
        "",
        f"- Уникальных URL: {summary['uniqueUrls']}",
        f"- Цитирований в корпусе: {summary['citations']}",
        f"- Доменов: {summary['domains']}",
        f"- Мёртвых URL: {summary['deadUrls']}",
        f"- Слабых цитат (корень/поиск): {summary['weakCitations']} "
        f"(бюджет {MAX_WEAK_CITATIONS})",
        "",
    ]
    if dead_urls:
        lines += ["## Мёртвые источники", "", "| URL | Причина |", "|---|---|"]
        lines += [f"| {item['url']} | {item['reason']} |" for item in dead_urls]
        lines.append("")
    if weak_citations:
        lines += ["## Слабые цитаты (подлежат замене на конкретные документы)", "",
                  "| Статья | URL |", "|---|---|"]
        lines += [f"| `{c['articleId']}` | {c['url']} |" for c in weak_citations]
        lines.append("")
    if not dead_urls and not weak_citations:
        lines.append("Все цитируемые источники доступны и являются конкретными документами.")
    (OUTPUT_DIR / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("Source-link liveness gate")
    print(f"- unique urls: {summary['uniqueUrls']} across {summary['domains']} domains")
    print(f"- citations: {summary['citations']}")
    print(f"- dead urls: {summary['deadUrls']}")
    print(f"- weak citations: {summary['weakCitations']} (budget {MAX_WEAK_CITATIONS})")
    print(f"- report: {OUTPUT_DIR.relative_to(ROOT) / 'report.md'}")

    if dead_urls:
        print("\nDEAD SOURCES:", file=sys.stderr)
        for item in dead_urls:
            print(f"  [{item['reason']}] {item['url']}", file=sys.stderr)
        for article_id, entries in sorted(by_article.items()):
            print(f"  article {article_id}: {entries}", file=sys.stderr)
        return 1
    if len(weak_citations) > MAX_WEAK_CITATIONS:
        print(f"\nWeak-citation ratchet exceeded: {len(weak_citations)} > {MAX_WEAK_CITATIONS}. "
              "Replace index/search citations with concrete documents, or lower the budget "
              "deliberately — never raise it silently.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
