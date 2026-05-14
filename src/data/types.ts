export interface RecipeData {
  prepTime: string
  cookTime: string
  yield: string
  calories?: string
  ingredients: string[]
}

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  author: string
  readTime: number
  image: string
  tags: string[]
  date?: string
  updatedAt?: string
  sourceUrl?: string
  sourceLabel?: string
  recipeData?: RecipeData
  faq?: { question: string; answer: string }[]
  /** SEO: human description of the actual image, not just duplicated title */
  imageAlt?: string
  /** SEO: concise title used in image sitemap / ImageObject */
  imageTitle?: string
  /** Visible editorial caption under hero image */
  imageCaption?: string
  /** Credit/licence/source note for image metadata */
  imageCredit?: string
  imageWidth?: number
  imageHeight?: number
}

// Metadata only (no full article body) — safe to pass into client islands.
export type ArticleMeta = Omit<Article, 'content'>
