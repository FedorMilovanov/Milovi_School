import { canonLibrary } from './canon-library'

export type CanonActId = 'forme' | 'signature' | 'territoire'

export interface CanonWork {
  id: string
  order: number
  name: string
  act: CanonActId
  isAnchor?: boolean
  visualTone: 'amber' | 'rose' | 'cocoa' | 'cream' | 'copper'
  gridRow: 1 | 2
  gridStart: number
  gridSpan: 4 | 8
  image?: string
  imageMobile?: string
  imageAlt?: string
  curatorLine?: string
  techniques?: string[]
  articleId?: string
  linkLabel?: string
}

export interface CanonAct {
  id: CanonActId
  roman: 'I' | 'II' | 'III'
  title: string
  subtitle: string
}

export const canonActs: CanonAct[] = [
  { id: 'forme', roman: 'I', title: 'LA FORME', subtitle: 'Когда конструкция стала языком.' },
  { id: 'signature', roman: 'II', title: 'LA SIGNATURE', subtitle: 'Когда классика обрела автора или Maison.' },
  { id: 'territoire', roman: 'III', title: 'LE TERRITOIRE', subtitle: 'Когда место, сезон и ритуал стали частью формы.' },
]

/**
 * Every curatorial work is resolved through the same factual binding registry.
 * Adding an exact route/media binding in canon-library.ts automatically enables
 * the collection image and article navigation without duplicating route/media
 * identity in this file. Curatorial/UI copy remains owned here.
 */
function defineCanonWork(work: CanonWork): CanonWork {
  const binding = canonLibrary[work.id as keyof typeof canonLibrary]
  return binding ? { ...work, ...binding } : work
}

/**
 * Curatorial projection of the 15 Canon works.
 * Research-owned dates, origins, archives and rights remain outside this layer
 * until the Research transfer closes them.
 */
export const canonWorks: CanonWork[] = [
  defineCanonWork({
    id: 'saint-honore', order: 1, name: 'Saint-Honoré', act: 'forme', isAnchor: true, visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 8,
    curatorLine: 'Архитектура pâte à choux, карамели и крема — один из самых узнаваемых конструктивных языков французской pâtisserie.',
    techniques: ['PÂTE À CHOUX', 'CARAMEL', 'CRÈME'],
    linkLabel: 'Открыть разбор',
  }),
  defineCanonWork({
    id: 'paris-brest', order: 2, name: 'Paris-Brest', act: 'forme', visualTone: 'cocoa', gridRow: 1, gridStart: 9, gridSpan: 4,
    curatorLine: 'Кольцевая pâte à choux и пралине превратили форму в мгновенно узнаваемый знак.',
    techniques: ['PÂTE À CHOUX', 'PRALINÉ', 'CRÈME'],
    linkLabel: 'Открыть историю',
  }),
  defineCanonWork({
    id: 'religieuse', order: 3, name: 'Religieuse', act: 'forme', visualTone: 'cocoa', gridRow: 2, gridStart: 1, gridSpan: 4,
    curatorLine: 'Два choux, глазурь и вертикальная сборка делают силуэт частью рецепта.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'GLAÇAGE'],
    linkLabel: 'Изучить интерпретацию',
  }),
  defineCanonWork({
    id: 'eclair', order: 4, name: 'Éclair', act: 'forme', visualTone: 'cream', gridRow: 2, gridStart: 5, gridSpan: 4,
    curatorLine: 'Продольная форма choux стала самостоятельным носителем крема, глазури и современного авторского языка.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'FONDANT'],
    linkLabel: 'Открыть историю',
  }),
  defineCanonWork({
    id: 'opera', order: 5, name: 'Opéra', act: 'forme', visualTone: 'cocoa', gridRow: 2, gridStart: 9, gridSpan: 4,
    curatorLine: 'Прямоугольник, тонкие слои и строгая высота: вкус организован как графическая конструкция.',
    techniques: ['BISCUIT JOCONDE', 'CAFÉ', 'GANACHE'],
    linkLabel: 'Открыть историческое досье',
  }),

  defineCanonWork({
    id: 'baba-au-rhum', order: 6, name: 'Baba au Rhum', act: 'signature', visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 4,
    curatorLine: 'Сироп, ферментированное тесто и подача делают пропитку не дополнением, а главным конструктивным жестом.',
    techniques: ['PÂTE LEVÉE', 'SIROP', 'IMBIBAGE'],
    linkLabel: 'Открыть разбор',
  }),
  defineCanonWork({
    id: 'tarte-au-citron', order: 7, name: 'Tarte au Citron', act: 'signature', visualTone: 'cream', gridRow: 2, gridStart: 1, gridSpan: 4,
    curatorLine: 'Кислота, pâte sucrée и эмульсия требуют точности, которую невозможно спрятать декором.',
    techniques: ['PÂTE SUCRÉE', 'CITRON', 'ÉMULSION'],
  }),
  defineCanonWork({
    id: 'ispahan', order: 8, name: 'Ispahan', act: 'signature', isAnchor: true, visualTone: 'rose', gridRow: 1, gridStart: 5, gridSpan: 8,
    curatorLine: 'Роза, личи и малина работают как единый узнаваемый вкусовой аккорд.',
    techniques: ['MACARON', 'ROSE', 'LITCHI · FRAMBOISE'],
    linkLabel: 'Открыть досье',
  }),
  defineCanonWork({
    id: '2000-feuilles', order: 9, name: '2000 Feuilles', act: 'signature', visualTone: 'amber', gridRow: 2, gridStart: 5, gridSpan: 4,
    curatorLine: 'Ламинация и пралине становятся исследованием хруста, слоёв и контраста текстур.',
    techniques: ['FEUILLETAGE', 'PRALINÉ', 'TEXTURE'],
  }),
  defineCanonWork({
    id: 'mont-blanc', order: 10, name: 'Mont-Blanc', act: 'signature', visualTone: 'cocoa', gridRow: 2, gridStart: 9, gridSpan: 4,
    curatorLine: 'Меренга, шантийи и каштан собираются в силуэт, который узнаётся ещё до первого укуса.',
    techniques: ['MERINGUE', 'CHANTILLY', 'MARRON'],
    linkLabel: 'Открыть разбор',
  }),

  defineCanonWork({
    id: 'kouign-amann', order: 11, name: 'Kouign-Amann', act: 'territoire', visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 4,
    curatorLine: 'Слоёное дрожжевое тесто, масло и сахар превращают карамелизацию в саму структуру изделия.',
    techniques: ['LAMINATION', 'BEURRE', 'CARAMÉLISATION'],
    linkLabel: 'Изучить технику',
  }),
  defineCanonWork({
    id: 'tarte-tatin', order: 12, name: 'Tarte Tatin', act: 'territoire', visualTone: 'amber', gridRow: 1, gridStart: 5, gridSpan: 4,
    curatorLine: 'Фрукт, карамель и перевёрнутая сборка делают технику важнее декоративной поверхности.',
    techniques: ['POMME', 'CARAMEL', 'CUISSON INVERSÉE'],
    linkLabel: 'Открыть разбор',
  }),
  defineCanonWork({
    id: 'tarte-tropezienne', order: 13, name: 'Tarte Tropézienne', act: 'territoire', visualTone: 'cream', gridRow: 1, gridStart: 9, gridSpan: 4,
    curatorLine: 'Бриошь и крем создают десерт, чья мягкость столь же важна, как узнаваемая форма.',
    techniques: ['BRIOCHE', 'CRÈME', 'SUCRE GRAIN'],
    linkLabel: 'Открыть разбор',
  }),
  defineCanonWork({
    id: 'canele-bordeaux', order: 14, name: 'Canelé de Bordeaux', act: 'territoire', isAnchor: true, visualTone: 'copper', gridRow: 2, gridStart: 1, gridSpan: 8,
    curatorLine: 'Контраст почти чёрной карамельной оболочки и влажной сердцевины рождается прежде всего в форме и режиме выпечки.',
    techniques: ['MOULE', 'CARAMÉLISATION', 'CUISSON'],
    linkLabel: 'Открыть технику',
  }),
  defineCanonWork({
    id: 'galette-des-rois', order: 15, name: 'Galette des Rois', act: 'territoire', visualTone: 'amber', gridRow: 2, gridStart: 9, gridSpan: 4,
    curatorLine: 'Feuilletage, миндальная начинка и сезонный ритуал соединяют ремесло с повторяющейся культурной практикой.',
    techniques: ['FEUILLETAGE', 'AMANDE', 'RAYAGE'],
    linkLabel: 'Открыть материал',
  }),
]

const canonWorkIds = new Set(canonWorks.map((work) => work.id))
const orphanBindings = Object.keys(canonLibrary).filter((id) => !canonWorkIds.has(id))
if (orphanBindings.length > 0) {
  throw new Error(`[canon] Factual binding has no curatorial work: ${orphanBindings.join(', ')}`)
}

export const canonWorksByAct = (act: CanonActId) => canonWorks.filter((work) => work.act === act)
