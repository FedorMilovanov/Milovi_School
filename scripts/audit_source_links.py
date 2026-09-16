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
# Lowered again the same day (wave 3): two Académie du Goût search-result URLs and a
# bare jacquesgenin.fr root were replaced with a free ADG recipe page, a Gallica ark
# and the Bon Appétit Paris city-guide entry; stohrer.fr/pages/notre-histoire (a
# redirect to the homepage, invisible to generic_path) now points at /notre-maison/.
# Re-measured on the 2026-09-16 corpus after wave 3: 65 weak citations out of 559.
# Lowered again the same day (wave 4, batch 1): seven Académie du Goût search-result
# pages and a bare ferrandi-paris.com/fr root were replaced with concrete documents —
# five named ADG recipe pages (Bocuse, Ducasse, Michalak, Mornet, Préalpato) and the
# fully validated 1903 Wikisource text of Le guide culinaire, chapter I "Sauces".
# Re-measured after wave 4 batch 1: 58 weak citations out of 559.
# Lowered again (wave 4, batch 2): five more ADG search pages replaced with
# Meilleur du Chef recipe pages — cannelés bordelais (with the copper-mould
# culottage rules the article argues about), kouglof, financier, tuiles dentelles
# and pain perdu. MdC is preferred over ADG here because it is already a trusted
# domain, is free, and publishes the full «phases techniques», while much of ADG
# is Premium-walled and would be a login-wall citation under AGENTS.md §4.
# Re-measured after wave 4 batch 2: 53 weak citations out of 559.
# Lowered again (wave 4, batch 3): six more ADG search pages replaced with
# Meilleur du Chef pages carrying the full technique — mouler-brioche (27 °C
# proof, 1/4-3/4 tête division), quatre-quarts (the canonical four equal parts),
# pate-gaufres, beignet (Gruau T45, milk never above 40 °C), creme-renversee-
# caramel (130 g sugar / 5 cl water, plus the bitterness warning) and a labelled
# author's Mont Blanc with complete marron glacé ice-cream and mousse ratios.
# Re-measured after wave 4 batch 3: 47 weak citations out of 559.
# Lowered again (wave 4, batch 4): four more ADG search pages replaced —
# pate-feuilletee-inverse (literally the feuilletage inversé the article teaches,
# plus the full ratio from croute-bouchee-carree), tarte-normande, tartelette-
# pommes and petits sables.
# Re-measured after wave 4 batch 4: 43 weak citations out of 560.
# Lowered again (wave 4, batch 5): the last two search-result pages in
# recipe-charlotte-fraises (an ADG query and a mercotte.fr/?s= query) are gone,
# replaced by charlotte-fraise (full crème mousseline ratio and the 118 °C Italian
# meringue) and charlotte-tutti-frutti (chemisage and dacquoise assembly); plus
# madeleine-coeur-fondant (the 12-hour cold rest), souffle-chocolat-griotte,
# the complete dacquoise amande ratio and buche-marron-chocolat.
# Re-measured after wave 4 batch 5: 37 weak citations out of 560.
# Lowered again (wave 4, batch 6): four more ADG search pages replaced with
# Meilleur du Chef pages carrying complete ratios — tarte-sucre (the yeast dough
# plus the 50 g butter / 30 g cassonade finish that names the tart), ile-flottante
# (both elements quantified separately), tartelette-citron-meringuee (lemon cream
# ratio and the anti-blistering pierce) and croquembouche, where a second
# citation was added for the assembly caramel built on glucose and fondant blanc.
# Re-measured after wave 4 batch 6: 33 weak citations out of 561.
# Lowered again (wave 4, batch 7): blanc-manger, fondant au chocolat and gateau
# basque get real documents with complete ratios, and tarte bourdaloue loses both
# of its bad citations at once - the search page and a Meilleur du Chef URL that
# turned out to be a soft-404 (now recorded in KNOWN_DEAD_URLS so it can never
# come back). Re-measured after wave 4 batch 7: 29 weak citations out of 562.
# Lowered again (wave 4, batch 8): six bare roots replaced with deep documents from
# the maisons' own sites. Michalak's own page states what the Fantastik is - round,
# 3 cm high, seasonal, never frozen, recipe changed daily, 700+ creations in two
# years - and a complete visitandine gives his standard construction with ratios;
# the article about Felder's Alsatian line now cites his kougelhopf and chocolate
# kouglof instead of a regional portal root; his brioche covers the fundamentals
# article; and Genin's own ingredient declaration states the caramel composition in
# his words (sugar, butter, cream, glucose, fleur de sel) for the caramel article.
# Only apt substitutions were made: remaining roots were left rather than filled
# with an off-topic page, since a wrong citation is worse than a weak one.
# Re-measured after wave 4 batch 8: 23 weak citations out of 562, of which 2 are
# search-result pages (caramel tendre, marrons glaces).
MAX_WEAK_CITATIONS = 23

# Root-redirect ratchet, in OBSERVE mode.
#
# A citation whose specific URL 302s to the site root is dead in substance but
# invisible to both the status check and generic_path(). Detection is implemented
# above and reported here, but deliberately not enforced yet: the count can only
# be measured on a networked run, and guessing a budget would either break CI or
# hide real cases. Promotion path is the same one MAX_WEAK_CITATIONS followed —
# read the number CI publishes in artifacts/source-links-report/report.md, set it
# here, then lower it as each case is fixed.
MAX_ROOT_REDIRECTS: int | None = None

# URLs proven dead by direct fetch (hard status or soft-404 marker).
#
# This list exists because the probe below cannot run without egress: main()
# returns 0 before probing when network_available() is false, so a dead citation
# is invisible in any offline environment and only caught by CI. Recording a
# verified verdict here makes it permanent and universal - the check runs before
# the network branch, so re-introducing a known-dead URL fails locally, in review
# and in CI alike. Grow it whenever a fetch proves a cited URL dead; never remove
# an entry without a live re-verification.
KNOWN_DEAD_URLS: frozenset[str] = frozenset({
    # Fetched 2026-09-16: returns Meilleur du Chef's soft-404 page
    # ("Nous n'avons pas trouve cette page") despite HTTP 200-style rendering.
    # Cited by recipe-tarte-bourdaloue until wave 4 batch 7.
    "https://www.meilleurduchef.com/fr/recette/tarte-bourdaloue.html",
})

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


def registrable(netloc: str) -> str:
    """Host without credentials, port and www — enough to compare two URLs' sites."""
    return netloc.lower().split("@")[-1].split(":")[0].removeprefix("www.")


def root_redirect(cited: str, final: str) -> bool:
    """A specific citation that silently lands on a site root or an index/search page.

    This is a dead citation wearing a 200 response: the page moved or never existed,
    the server answers with the homepage, the title is not a soft-404 marker, and
    ``generic_path()`` only ever sees the cited string. Found in the wild on
    ``stohrer.fr/pages/notre-histoire`` -> ``stohrer.fr/``.

    Deliberately narrow, so cross-domain canonicalisation and http->https or
    trailing-slash hops are never flagged: the cited path must be specific, the
    final path must be generic, and both must sit on the same site.
    """
    if not final or final == cited:
        return False
    if generic_path(cited) or not generic_path(final):
        return False
    return registrable(urlsplit(cited).netloc) == registrable(urlsplit(final).netloc)


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
                            "reason": f"soft-404 title: {title!r}", "rootRedirect": False}
            if status >= 400:
                return {"url": url, "status": status, "title": title, "verdict": "dead",
                        "reason": f"HTTP {status}", "rootRedirect": False}
            return {"url": url, "status": status, "finalUrl": final_url, "title": title,
                    "verdict": "weak" if generic_path(url) else "ok", "reason": "",
                    "rootRedirect": root_redirect(url, final_url)}
        except urllib.error.HTTPError as error:
            if error.code in {403, 405, 429, 503} and attempt < RETRIES:
                last_error = f"HTTP {error.code}"
                time.sleep(1.5 * (attempt + 1))
                continue
            return {"url": url, "status": error.code, "title": "", "verdict": "dead",
                    "reason": f"HTTP {error.code}", "rootRedirect": False}
        except Exception as error:  # noqa: BLE001 — network faults are data here
            last_error = f"{type(error).__name__}: {error}"
            if attempt < RETRIES:
                time.sleep(1.5 * (attempt + 1))
    return {"url": url, "status": 0, "title": "", "verdict": "dead", "reason": last_error,
            "rootRedirect": False}


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

    # Runs before the network branch on purpose: these verdicts were established
    # by direct fetch and must not depend on egress being available right now.
    known_dead = [c for c in citations if c["url"] in KNOWN_DEAD_URLS]
    if known_dead:
        print(f"\nKnown-dead citations present: {len(known_dead)}", file=sys.stderr)
        for item in sorted({(c["articleId"], c["url"]) for c in known_dead}):
            print(f"  [{item[0]}] {item[1]}", file=sys.stderr)
        print("  These URLs were verified dead by direct fetch. Replace them with a "
              "live concrete document, or re-verify and drop the entry from "
              "KNOWN_DEAD_URLS.", file=sys.stderr)
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
    root_redirects = [c for c in citations if verdict[c["url"]].get("rootRedirect")]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = {
        "uniqueUrls": len(unique_urls),
        "citations": len(citations),
        "deadUrls": len(dead_urls),
        "weakCitations": len(weak_citations),
        "weakBudget": MAX_WEAK_CITATIONS,
        "rootRedirectCitations": len(root_redirects),
        "rootRedirectBudget": MAX_ROOT_REDIRECTS,
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
        f"- Редиректов на главную (мёртвая ссылка под маской 200): {summary['rootRedirectCitations']}"
        + (" (бюджет не задан, режим наблюдения)" if MAX_ROOT_REDIRECTS is None
           else f" (бюджет {MAX_ROOT_REDIRECTS})"),
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
    if root_redirects:
        lines += ["## Редирект на главную вместо цитируемого документа", "",
                  "Ответ 200, заголовок не soft-404, путь исходной строки конкретный — "
                  "гейт живости такое пропускал. Цитату нужно заменить на страницу, "
                  "которая действительно несёт утверждение.", "",
                  "| Статья | Цитируемый URL | Фактически открывается |", "|---|---|---|"]
        lines += [f"| `{c['articleId']}` | {c['url']} | {verdict[c['url']].get('finalUrl', '')} |"
                  for c in root_redirects]
        lines.append("")
    if not dead_urls and not weak_citations and not root_redirects:
        lines.append("Все цитируемые источники доступны и являются конкретными документами.")
    (OUTPUT_DIR / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("Source-link liveness gate")
    print(f"- unique urls: {summary['uniqueUrls']} across {summary['domains']} domains")
    print(f"- citations: {summary['citations']}")
    print(f"- dead urls: {summary['deadUrls']}")
    print(f"- weak citations: {summary['weakCitations']} (budget {MAX_WEAK_CITATIONS})")
    print(f"- root-redirect citations: {summary['rootRedirectCitations']} "
          f"(budget {'observe-only' if MAX_ROOT_REDIRECTS is None else MAX_ROOT_REDIRECTS})")
    print(f"- report: {OUTPUT_DIR.relative_to(ROOT) / 'report.md'}")

    if dead_urls:
        print("\nDEAD SOURCES:", file=sys.stderr)
        for item in dead_urls:
            print(f"  [{item['reason']}] {item['url']}", file=sys.stderr)
        for article_id, entries in sorted(by_article.items()):
            print(f"  article {article_id}: {entries}", file=sys.stderr)
        return 1
    if MAX_ROOT_REDIRECTS is not None and len(root_redirects) > MAX_ROOT_REDIRECTS:
        print(f"\nRoot-redirect ratchet exceeded: {len(root_redirects)} > {MAX_ROOT_REDIRECTS}.",
              file=sys.stderr)
        for item in root_redirects:
            print(f"  [{item['articleId']}] {item['url']} -> "
                  f"{verdict[item['url']].get('finalUrl', '')}", file=sys.stderr)
        return 1
    if len(weak_citations) > MAX_WEAK_CITATIONS:
        print(f"\nWeak-citation ratchet exceeded: {len(weak_citations)} > {MAX_WEAK_CITATIONS}. "
              "Replace index/search citations with concrete documents, or lower the budget "
              "deliberately — never raise it silently.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
