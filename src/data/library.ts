import { articles, articlesMeta, type Article, type ArticleMeta } from './articles'

// Full articles (with content) — use only at build time / SSG pages
const unique = new Map<string, Article>()
for (const article of articles) unique.set(article.id, article)
export const libraryArticles = Array.from(unique.values()).sort((a, b) => b.readTime - a.readTime)

// Metadata only — safe for React client islands (no content shipped to browser)
const uniqueMeta = new Map<string, ArticleMeta>()
for (const a of articlesMeta) uniqueMeta.set(a.id, a)
export const libraryMeta = Array.from(uniqueMeta.values()).sort((a, b) => b.readTime - a.readTime)

export type { Article, ArticleMeta }
