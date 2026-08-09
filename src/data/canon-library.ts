export interface CanonLibraryBinding {
  image: string
  imageAlt: string
  articleId: string
  linkLabel: string
}

/**
 * Exact bindings from Canon objects to material that already exists in the
 * Pâtisserie Russe library. Keep this registry factual and small: no historical
 * claims, no provisional archive sources, and no synthetic fallback media.
 *
 * Objects that do not yet have an exact product material are intentionally
 * absent. The exhibition renders those as catalogue works until Research and
 * product content provide an exact binding.
 */
export const canonLibrary = {
  'saint-honore': {
    image: '/images/articles/recipe-saint-honore.webp',
    imageAlt: 'Saint-Honoré',
    articleId: 'recipe-saint-honore',
    linkLabel: 'Открыть разбор',
  },
  'paris-brest': {
    image: '/images/articles/paris-brest-race-dessert.webp',
    imageAlt: 'Paris-Brest',
    articleId: 'paris-brest-race-dessert',
    linkLabel: 'Открыть историю',
  },
  religieuse: {
    image: '/images/articles/michalak-religieuse.webp',
    imageAlt: 'Religieuse — современная интерпретация Christophe Michalak',
    articleId: 'michalak-religieuse',
    linkLabel: 'Изучить интерпретацию',
  },
  eclair: {
    image: '/images/articles/eclair-histoire-complete.webp',
    imageAlt: 'Éclair',
    articleId: 'eclair-histoire-complete',
    linkLabel: 'Открыть историю',
  },
  opera: {
    image: '/images/articles/opera-gateau-histoire.webp',
    imageAlt: 'Gâteau Opéra',
    articleId: 'opera-gateau-histoire',
    linkLabel: 'Открыть историческое досье',
  },
  'baba-au-rhum': {
    image: '/images/articles/recipe-baba-rhum-alain-ducasse.webp',
    imageAlt: 'Baba au Rhum',
    articleId: 'recipe-baba-rhum-alain-ducasse',
    linkLabel: 'Открыть разбор',
  },
  ispahan: {
    image: '/images/articles/herme-ispahan-deep.webp',
    imageAlt: 'Ispahan Pierre Hermé',
    articleId: 'herme-ispahan-deep',
    linkLabel: 'Открыть досье',
  },
  'mont-blanc': {
    image: '/images/articles/recipe-mont-blanc.webp',
    imageAlt: 'Mont-Blanc aux marrons',
    articleId: 'recipe-mont-blanc',
    linkLabel: 'Открыть разбор',
  },
  'kouign-amann': {
    image: '/images/articles/lignac-kouign-amann.webp',
    imageAlt: 'Kouign-Amann',
    articleId: 'lignac-kouign-amann',
    linkLabel: 'Изучить технику',
  },
  'tarte-tatin': {
    image: '/images/articles/recipe-tarte-tatin.webp',
    imageAlt: 'Tarte Tatin',
    articleId: 'recipe-tarte-tatin',
    linkLabel: 'Открыть разбор',
  },
  'tarte-tropezienne': {
    image: '/images/articles/recipe-tarte-tropezienne.webp',
    imageAlt: 'Tarte Tropézienne',
    articleId: 'recipe-tarte-tropezienne',
    linkLabel: 'Открыть разбор',
  },
  'canele-bordeaux': {
    image: '/images/articles/recipe-canele.webp',
    imageAlt: 'Canelé de Bordeaux',
    articleId: 'recipe-canele',
    linkLabel: 'Открыть технику',
  },
  'galette-des-rois': {
    image: '/images/articles/cuisine-galette.webp',
    imageAlt: 'Galette des Rois',
    articleId: 'cuisine-galette',
    linkLabel: 'Открыть материал',
  },
} as const satisfies Record<string, CanonLibraryBinding>

export type CanonLibraryId = keyof typeof canonLibrary
