import type { IFuseOptions } from 'fuse.js'
import type { ArticleClientMeta } from '../data/types'

/**
 * Single source of truth for article search ranking.
 *
 * Home search, category filtering and Command Palette must rank the same query
 * the same way. Keeping Fuse options here prevents silent drift between entry
 * points and makes future tuning measurable.
 */
export const ARTICLE_FUSE_OPTIONS: IFuseOptions<ArticleClientMeta> = {
  keys: [
    { name: 'title', weight: 0.45 },
    { name: 'excerpt', weight: 0.2 },
    { name: 'author', weight: 0.15 },
    { name: 'tags', weight: 0.15 },
    { name: 'category', weight: 0.05 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeMatches: true,
}
