export interface CanonMediaBinding {
  image: string
  imageAlt: string
  imageMobile?: string
  /**
   * Subject-scale correction inside the fixed 16:10 exhibition frame.
   * Keep this exceptional and data-owned: it is for masters whose pastry was
   * generated materially smaller than the rest of the pack, not for layout.
   */
  imageScale?: number
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
    imageAlt: 'Saint-Honoré (Сент-Оноре): слоёная основа, карамелизированные шу и крем',
  },
  'paris-brest': {
    image: '/images/canon-sucre/paris-brest.webp',
    imageAlt: 'Paris-Brest (Пари-Брест): кольцо из заварного теста с пралине-кремом',
  },
  religieuse: {
    image: '/images/canon-sucre/religieuse.webp',
    imageAlt: 'Religieuse (Религиоз): два глазированных шу с кремовой коллереткой',
  },
  eclair: {
    image: '/images/canon-sucre/eclair.webp',
    imageAlt: 'Éclair (эклер): вытянутое заварное пирожное с тонкой глазурью',
    imageScale: 1.04,
  },
  opera: {
    image: '/images/canon-sucre/opera.webp',
    imageAlt: 'Gâteau Opéra (Опера): ровные слои бисквита Joconde, кофе и шоколада',
  },
  'baba-au-rhum': {
    image: '/images/canon-sucre/baba-au-rhum.webp',
    imageAlt: 'Baba au Rhum (ромовая баба): пропитанный рифлёный баба с кремом Chantilly',
  },
  'tarte-au-citron': {
    image: '/images/canon-sucre/tarte-au-citron.webp',
    imageAlt: 'Tarte au Citron (лимонный тарт): тонкая pâte sucrée и гладкий цитрусовый крем',
    imageScale: 1.24,
  },
  ispahan: {
    image: '/images/canon-sucre/ispahan.webp',
    imageAlt: 'Ispahan Пьера Эрме: розовый макарон, малина, личи и розовый крем',
  },
  '2000-feuilles': {
    image: '/images/canon-sucre/2000-feuilles.webp',
    imageAlt: '2000 Feuilles Пьера Эрме: карамелизированное слоёное тесто и пралине-крем',
  },
  'mont-blanc': {
    image: '/images/canon-sucre/mont-blanc.webp',
    imageAlt: 'Mont-Blanc (Монблан): тонкие нити каштанового крема поверх Chantilly',
  },
  'kouign-amann': {
    image: '/images/canon-sucre/kouign-amann.webp',
    imageAlt: 'Kouign-Amann (куинь-аман): слоёная бретонская выпечка с глубокой карамелизацией',
  },
  'tarte-tatin': {
    image: '/images/canon-sucre/tarte-tatin.webp',
    imageAlt: 'Tarte Tatin (тарт Татен): карамелизированные яблоки на тонкой хрустящей основе',
  },
  'tarte-tropezienne': {
    image: '/images/canon-sucre/tarte-tropezienne.webp',
    imageAlt: 'Tarte Tropézienne (тарт Тропезьен): золотистая бриошь с ровным слоем крема',
  },
  'canele-bordeaux': {
    image: '/images/canon-sucre/canele-bordeaux.webp',
    imageAlt: 'Canelé de Bordeaux (канеле): тёмная карамельная корка и светлая влажная сердцевина',
  },
  'galette-des-rois': {
    image: '/images/canon-sucre/galette-des-rois.webp',
    imageAlt: 'Galette des Rois (галет де руа): золотистое слоёное тесто с традиционным rayage',
    imageScale: 1.18,
  },
} as const satisfies Record<string, CanonMediaBinding>

export type CanonMediaId = keyof typeof canonMedia
