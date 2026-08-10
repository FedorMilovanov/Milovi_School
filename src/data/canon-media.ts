export interface CanonMediaBinding {
  image: string
  imageAlt: string
  imageMobile?: string
}

/**
 * Dedicated standardized exhibition media for Le Canon Sucré.
 *
 * Media identity stays independent from article publication in canon-library.ts:
 * exact Canon artwork can land before its dossier exists without inventing a route.
 * Production contract: 1280×800 WebP, centered crop-safe composition, no text/branding.
 */
export const canonMedia = {
  'saint-honore': {
    image: '/images/canon-sucre/saint-honore.webp',
    imageAlt: 'Saint-Honoré — pâte feuilletée, choux caramélisés et crème',
  },
  'paris-brest': {
    image: '/images/canon-sucre/paris-brest.webp',
    imageAlt: 'Paris-Brest — couronne de pâte à choux et crème pralinée',
  },
  religieuse: {
    image: '/images/canon-sucre/religieuse.webp',
    imageAlt: 'Religieuse — deux choux glacés et collerette de crème',
  },
  eclair: {
    image: '/images/canon-sucre/eclair.webp',
    imageAlt: 'Éclair — pâte à choux allongée et glaçage chocolat',
  },
  opera: {
    image: '/images/canon-sucre/opera.webp',
    imageAlt: 'Gâteau Opéra — couches de Joconde, café et chocolat',
  },
  'baba-au-rhum': {
    image: '/images/canon-sucre/baba-au-rhum.webp',
    imageAlt: 'Baba au Rhum — baba cannelé imbibé avec Chantilly',
  },
  'tarte-au-citron': {
    image: '/images/canon-sucre/tarte-au-citron.webp',
    imageAlt: 'Tarte au Citron — pâte sucrée fine et crème citron',
  },
  ispahan: {
    image: '/images/canon-sucre/ispahan.webp',
    imageAlt: 'Ispahan — macaron rose, framboises et crème',
  },
  '2000-feuilles': {
    image: '/images/canon-sucre/2000-feuilles.webp',
    imageAlt: '2000 Feuilles — feuilletage caramélisé et crème pralinée',
  },
  'mont-blanc': {
    image: '/images/canon-sucre/mont-blanc.webp',
    imageAlt: 'Mont-Blanc — vermicelles de marron et crème',
  },
  'kouign-amann': {
    image: '/images/canon-sucre/kouign-amann.webp',
    imageAlt: 'Kouign-Amann — feuilletage breton profondément caramélisé',
  },
  'tarte-tatin': {
    image: '/images/canon-sucre/tarte-tatin.webp',
    imageAlt: 'Tarte Tatin — pommes caramélisées et pâte fine',
  },
  'tarte-tropezienne': {
    image: '/images/canon-sucre/tarte-tropezienne.webp',
    imageAlt: 'Tarte Tropézienne — brioche, crème et sucre grain',
  },
  'canele-bordeaux': {
    image: '/images/canon-sucre/canele-bordeaux.webp',
    imageAlt: 'Canelé de Bordeaux — coque sombre profondément caramélisée',
  },
  'galette-des-rois': {
    image: '/images/canon-sucre/galette-des-rois.webp',
    imageAlt: 'Galette des Rois — feuilletage doré et rayage traditionnel',
  },
} as const satisfies Record<string, CanonMediaBinding>

export type CanonMediaId = keyof typeof canonMedia
