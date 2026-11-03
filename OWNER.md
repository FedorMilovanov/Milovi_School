# Ownership, editorial responsibility and provenance

**Repository:** [FedorMilovanov/Milovi_School](https://github.com/FedorMilovanov/Milovi_School)  
**Public project:** [Patisserie Russe / french.milovicake.ru](https://french.milovicake.ru)  
**Related brand:** [Milovi Cake](https://milovicake.ru)

## Responsibilities

- **Fedor Milovanov** — engineering, static-site architecture, technical maintenance, publishing checks, SEO/release automation and source-traceability process. The implementation involves human-directed AI-assisted tooling; repository ownership does not imply that every line was typed manually.
- **Viktoria Milovanova** — the confectionery business and production associated with the Milovi Cake brand. This editorial school is related to that business, **not** a claim that Milovi Cake makes or sells every recipe or product described in the historical library.
- **Historical and culinary information** — must be attributed to the actual documented sources for the specific claim. The site maintainer is not automatically the historical author or inventor of recipes or techniques.
- **Photography and generated editorial media** — subject to their individual attribution, provenance and rights reviews; AI-generated illustrations are not primary historical evidence.

This is a roles-and-attribution note, **not** a new copyright or redistribution license. No blanket license is granted for third-party articles, scans, photographs, trademarks, or externally sourced materials.

## Where the current engineering and editorial rules live

| Area | Canonical reference |
|---|---|
| Maintainer/agent constraints and protected decisions | [AGENTS.md](AGENTS.md) |
| Routes, architecture, validation and release summary | [README.md](README.md) |
| New major sections, metadata, SEO and release evidence | [docs/PRODUCTION_SECTION_PLAYBOOK.md](docs/PRODUCTION_SECTION_PLAYBOOK.md) |
| Curated collection closeout and stable product boundary | [docs/le-canon-sucre/CLOSEOUT.md](docs/le-canon-sucre/CLOSEOUT.md) |
| Source/claim and media quality checks | [scripts/audit_source_links.py](scripts/audit_source_links.py), [scripts/audit_canon_research.py](scripts/audit_canon_research.py), [scripts/audit_canon_media.py](scripts/audit_canon_media.py) |
| Practical outcome and explicit limitations | [CASE_STUDY.md](CASE_STUDY.md) |

## Reporting and changes

Submit ordinary technical or factual corrections through the repository's established workflow. Follow [SECURITY.md](SECURITY.md) for vulnerabilities. Before publishing an article correction, new media or a new section, establish source identity and rights first; see `AGENTS.md`. Do not treat `main` source code, a green build and a verified deployed production SHA as interchangeable evidence.
