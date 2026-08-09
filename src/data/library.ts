import { articles } from './articles'
import { articleExpansions } from './articleExpansions'
import { articleOverrides } from './articleOverrides'
import { canonArticles } from './canonArticles'
import type { Article, ArticleMeta, ArticleClientMeta } from './types'

const CONTENT_EXPANSION_DATE = '2026-08-03'
const WORD_RE = /[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+(?:[-‑–—'][A-Za-zА-Яа-яЁёÀ-ÿ0-9]+)*/g

const baseIds = new Set(articles.map((article) => article.id))
const expansionIds = Object.keys(articleExpansions)
const overrideIds = Object.keys(articleOverrides)
const canonIds = new Set(canonArticles.map((article) => article.id))

if (baseIds.size === 0) {
  throw new Error('[library] Article catalog must not be empty')
}

const missingExpansionIds = [...baseIds].filter((id) => !Object.hasOwn(articleExpansions, id))
const orphanExpansionIds = expansionIds.filter((id) => !baseIds.has(id))
if (missingExpansionIds.length > 0 || orphanExpansionIds.length > 0) {
  throw new Error(
    `[library] Article/expansion id mismatch: missing=${missingExpansionIds.join(',') || 'none'}; ` +
    `orphan=${orphanExpansionIds.join(',') || 'none'}`,
  )
}

for (const id of overrideIds) {
  if (!baseIds.has(id)) throw new Error(`[library] Unknown article override id: ${id}`)
}

const canonLegacyCollisions = [...canonIds].filter((id) => baseIds.has(id))
if (canonLegacyCollisions.length > 0) {
  throw new Error(`[library] Canon article id collides with legacy catalog: ${canonLegacyCollisions.join(',')}`)
}

const estimateReadTime = (content: string) =>
  Math.max(1, Math.ceil((content.match(WORD_RE)?.length ?? 0) / 180))

const enrichArticle = (article: Article): Article => {
  const expansion = articleExpansions[article.id]
  const override = articleOverrides[article.id]
  const content = expansion ? `${article.content.trim()}\n\n${expansion.trim()}` : article.content

  return {
    ...article,
    ...override,
    content,
    readTime: Math.max(article.readTime, estimateReadTime(content)),
    updatedAt: expansion ? CONTENT_EXPANSION_DATE : article.updatedAt,
  }
}

const normalizeStandaloneArticle = (article: Article): Article => ({
  ...article,
  content: article.content.trim(),
  readTime: Math.max(article.readTime, estimateReadTime(article.content)),
})

// Full articles (with content) — use only at build time / SSG pages.
// Legacy articles retain their strict base+expansion contract; exact Canon dossiers
// are complete standalone articles and therefore do not create fake expansion rows.
const unique = new Map<string, Article>()
for (const article of articles) unique.set(article.id, enrichArticle(article))
for (const article of canonArticles) unique.set(article.id, normalizeStandaloneArticle(article))
export const libraryArticles = Array.from(unique.values()).sort((a, b) =>
  (b.date ?? '').localeCompare(a.date ?? '')
)

// Metadata only — safe for React client islands (no content shipped to browser).
export const libraryMeta: ArticleMeta[] = libraryArticles.map(({ content: _content, ...meta }) => meta)

export const libraryClientMeta: ArticleClientMeta[] = libraryMeta.map(
  ({ id, title, excerpt, category, readTime, image, imageAlt, tags, author, date }) => ({
    id, title, excerpt, category, readTime, image, imageAlt, tags, author, date,
  })
)

export type { Article, ArticleMeta, ArticleClientMeta }