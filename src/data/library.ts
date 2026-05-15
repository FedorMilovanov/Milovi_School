import { articles, articlesMeta } from './articles'
import type { Article, ArticleMeta } from './types'

// Full articles (with content) — use only at build time / SSG pages
const unique = new Map<string, Article>()
for (const article of articles) unique.set(article.id, article)
export const libraryArticles = Array.from(unique.values()).sort((a, b) => b.readTime - a.readTime)

// Metadata only — safe for React client islands (no content shipped to browser)
const uniqueMeta = new Map<string, ArticleMeta>()
for (const a of articlesMeta) uniqueMeta.set(a.id, a)
export const libraryMeta = Array.from(uniqueMeta.values()).sort((a, b) => b.readTime - a.readTime)

// Slimmed-down metadata for client-side islands (CommandPalette, Related, etc.)
// This dramatically reduces HTML payload size (~60-70% smaller)
export interface ArticleClientMeta {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: number
  image: string
  imageAlt?: string
  tags?: string[]
  author?: string
  date?: string
}

export const libraryClientMeta: ArticleClientMeta[] = libraryMeta.map(
  ({ id, title, excerpt, category, readTime, image, imageAlt, tags, author, date }) => ({
    id, title, excerpt, category, readTime, image, imageAlt, tags, author, date,
  })
)

export type { Article, ArticleMeta }