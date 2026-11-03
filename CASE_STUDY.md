# Case study: evidence-aware French pastry editorial library

## Context and problem

Patisserie Russe is a source-based educational and editorial site on the history and practice of French pâtisserie. The challenge is not simply generating article pages: it is keeping **article identity, documentary claims, image provenance, search markup and released HTML** consistent across a growing corpus.

The repository's [README.md](README.md) records a dated production scope of **157 article routes** plus the separate **Le Canon Sucré** collection of **15 works, 15 dedicated WebP assets and 15 real article bindings**. These are project snapshots, not hard-coded constants or claims about live traffic.

## Implementation

- **Static, crawlable pages:** Astro SSG generates `/`, `/articles/<id>/`, `/materials/` and `/canon/`. Sources include [src/pages/articles/[id].astro](src/pages/articles/%5Bid%5D.astro), [src/pages/materials.astro](src/pages/materials.astro) and [src/pages/canon.astro](src/pages/canon.astro).
- **Build-time content boundary:** the article corpus remains build-time; client React islands receive only browser-safe metadata. The site's navigation remains native MPA, not an unverified return to `ClientRouter`.
- **Separate editorial evidence:** the Canon collection's items, research and media are registered independently in [src/data/canon.ts](src/data/canon.ts), [src/data/canon-research.ts](src/data/canon-research.ts) and [src/data/canon-media.ts](src/data/canon-media.ts). A generated image or popular legend does not become a historical source merely by appearing on a page.
- **SEO as a verifiable rendering contract:** generated article metadata, canonical links, JSON-LD and sitemap images are checked against real output rather than supplied by decorative keyword fields. Relevant implementations include [scripts/audit_seo.py](scripts/audit_seo.py), [scripts/audit_rendered_content.py](scripts/audit_rendered_content.py) and [astro.config.mjs](astro.config.mjs).
- **Fail-closed release process:** `npm run validate` combines TypeScript, linting, content/source quality, security audit, static build, generated-HTML audits and privacy contract; release evidence distinguishes `main`, built output and exact deployed SHA.

## Test and evidence trail

From repository root, with Node.js and npm versions specified in [package.json](package.json):

```sh
npm ci
npm run validate
```

For sourced historical content, the [source-link self-test](scripts/audit_source_links.py) distinguishes dead links from transient blocked transport failures. A network-free local run may skip external link checks; dedicated CI must use `npm run audit:source-links:strict` and should not silently report unavailable external evidence as verified.

Le Canon Sucré's immutable scope, release conditions, source disputes and deferred ideas are documented in [docs/le-canon-sucre/CLOSEOUT.md](docs/le-canon-sucre/CLOSEOUT.md). The repository's [AGENTS.md](AGENTS.md) is authoritative on protected design and engineering decisions.

## Observed outcome and limits

This codebase implements a published editorial product with a verifiable route/data/SEO structure and dedicated automated gates. It is **not evidence** that every historic assertion is undisputed, that every AI-generated illustration depicts an authentic artifact, that a green PR was deployed, or that the site has a particular audience, ranking or revenue.

The site is associated with [Milovi Cake](https://milovicake.ru), but neither this architecture nor its recipes prove that Milovi Cake manufactures or uses every described recipe. See [OWNER.md](OWNER.md) for the engineering, pastry-business and third-party-source attribution boundary.
