export interface CanonMediaBinding {
  image: string
  imageAlt: string
  imageMobile?: string
}

/**
 * Canon exhibition media only. Media identity is deliberately independent from
 * article publication: an exact Canon image can be integrated before its dossier
 * exists without inventing a clickable route. Final generated Canon artwork can
 * replace these current exact object images one work at a time.
 */
export const canonMedia = {
  'saint-honore': {
    image: '/images/articles/recipe-saint-honore.webp',
    imageAlt: 'Saint-Honoré',
  },
  'paris-brest': {
    image: '/images/articles/paris-brest-race-dessert.webp',
    imageAlt: 'Paris-Brest',
  },
  religieuse: {
    image: '/images/articles/michalak-religieuse.webp',
    imageAlt: 'Religieuse — современная интерпретация Christophe Michalak',
  },
  eclair: {
    image: '/images/articles/eclair-histoire-complete.webp',
    imageAlt: 'Éclair',
  },
  opera: {
    image: '/images/articles/opera-gateau-histoire.webp',
    imageAlt: 'Gâteau Opéra',
  },
  'baba-au-rhum': {
    image: '/images/articles/recipe-baba-rhum-alain-ducasse.webp',
    imageAlt: 'Baba au Rhum',
  },
  ispahan: {
    image: '/images/articles/herme-ispahan-deep.webp',
    imageAlt: 'Ispahan Pierre Hermé',
  },
  'mont-blanc': {
    image: '/images/articles/recipe-mont-blanc.webp',
    imageAlt: 'Mont-Blanc aux marrons',
  },
  'kouign-amann': {
    image: '/images/articles/lignac-kouign-amann.webp',
    imageAlt: 'Kouign-Amann',
  },
  'tarte-tatin': {
    image: '/images/articles/recipe-tarte-tatin.webp',
    imageAlt: 'Tarte Tatin',
  },
  'tarte-tropezienne': {
    image: '/images/articles/recipe-tarte-tropezienne.webp',
    imageAlt: 'Tarte Tropézienne',
  },
  'canele-bordeaux': {
    image: '/images/articles/recipe-canele.webp',
    imageAlt: 'Canelé de Bordeaux',
  },
  'galette-des-rois': {
    image: '/images/articles/cuisine-galette.webp',
    imageAlt: 'Galette des Rois',
  },
} as const satisfies Record<string, CanonMediaBinding>

export type CanonMediaId = keyof typeof canonMedia
