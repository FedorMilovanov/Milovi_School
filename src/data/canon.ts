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
 * Curatorial projection of the 15 Canon works.
 * Exact existing library routes/media come only from canon-library.ts.
 * Research-owned dates, origins, archives and rights remain outside this layer
 * until the Research transfer closes them.
 */
export const canonWorks: CanonWork[] = [
  {
    id: 'saint-honore', order: 1, name: 'Saint-Honoré', act: 'forme', isAnchor: true, visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 8,
    curatorLine: 'Архитектура pâte à choux, карамели и крема — один из самых узнаваемых конструктивных языков французской pâtisserie.',
    techniques: ['PÂTE À CHOUX', 'CARAMEL', 'CRÈME'],
  },
  {
    id: 'paris-brest', order: 2, name: 'Paris-Brest', act: 'forme', visualTone: 'cocoa', gridRow: 1, gridStart: 9, gridSpan: 4,
    ...canonLibrary['paris-brest'],
    curatorLine: 'Кольцевая pâte à choux и пралине превратили форму в мгновенно узнаваемый знак.',
    techniques: ['PÂTE À CHOUX', 'PRALINÉ', 'CRÈME'],
  },
  {
    id: 'religieuse', order: 3, name: 'Religieuse', act: 'forme', visualTone: 'cocoa', gridRow: 2, gridStart: 1, gridSpan: 4,
    ...canonLibrary.religieuse,
    curatorLine: 'Два choux, глазурь и вертикальная сборка делают силуэт частью рецепта.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'GLAÇAGE'],
  },
  {
    id: 'eclair', order: 4, name: 'Éclair', act: 'forme', visualTone: 'cream', gridRow: 2, gridStart: 5, gridSpan: 4,
    ...canonLibrary.eclair,
    curatorLine: 'Продольная форма choux стала самостоятельным носителем крема, глазури и современного авторского языка.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'FONDANT'],
  },
  {
    id: 'opera', order: 5, name: 'Opéra', act: 'forme', visualTone: 'cocoa', gridRow: 2, gridStart: 9, gridSpan: 4,
    ...canonLibrary.opera,
    curatorLine: 'Прямоугольник, тонкие слои и строгая высота: вкус организован как графическая конструкция.',
    techniques: ['BISCUIT JOCONDE', 'CAFÉ', 'GANACHE'],
  },

  {
    id: 'baba-au-rhum', order: 6, name: 'Baba au Rhum', act: 'signature', visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 4,
    curatorLine: 'Сироп, ферментированное тесто и подача делают пропитку не дополнением, а главным конструктивным жестом.',
    techniques: ['PÂTE LEVÉE', 'SIROP', 'IMBIBAGE'],
  },
  {
    id: 'tarte-au-citron', order: 7, name: 'Tarte au Citron', act: 'signature', visualTone: 'cream', gridRow: 2, gridStart: 1, gridSpan: 4,
    curatorLine: 'Кислота, pâte sucrée и эмульсия требуют точности, которую невозможно спрятать декором.',
    techniques: ['PÂTE SUCRÉE', 'CITRON', 'ÉMULSION'],
  },
  {
    id: 'ispahan', order: 8, name: 'Ispahan', act: 'signature', isAnchor: true, visualTone: 'rose', gridRow: 1, gridStart: 5, gridSpan: 8,
    ...canonLibrary.ispahan,
    curatorLine: 'Роза, личи и малина работают как единый узнаваемый вкусовой аккорд.',
    techniques: ['MACARON', 'ROSE', 'LITCHI · FRAMBOISE'],
  },
  {
    id: '2000-feuilles', order: 9, name: '2000 Feuilles', act: 'signature', visualTone: 'amber', gridRow: 2, gridStart: 5, gridSpan: 4,
    curatorLine: 'Ламинация и пралине становятся исследованием хруста, слоёв и контраста текстур.',
    techniques: ['FEUILLETAGE', 'PRALINÉ', 'TEXTURE'],
  },
  {
    id: 'mont-blanc', order: 10, name: 'Mont-Blanc', act: 'signature', visualTone: 'cocoa', gridRow: 2, gridStart: 9, gridSpan: 4,
    ...canonLibrary['mont-blanc'],
    curatorLine: 'Меренга, шантийи и каштан собираются в силуэт, который узнаётся ещё до первого укуса.',
    techniques: ['MERINGUE', 'CHANTILLY', 'MARRON'],
  },

  {
    id: 'kouign-amann', order: 11, name: 'Kouign-Amann', act: 'territoire', visualTone: 'amber', gridRow: 1, gridStart: 1, gridSpan: 4,
    ...canonLibrary['kouign-amann'],
    curatorLine: 'Слоёное дрожжевое тесто, масло и сахар превращают карамелизацию в саму структуру изделия.',
    techniques: ['LAMINATION', 'BEURRE', 'CARAMÉLISATION'],
  },
  {
    id: 'tarte-tatin', order: 12, name: 'Tarte Tatin', act: 'territoire', visualTone: 'amber', gridRow: 1, gridStart: 5, gridSpan: 4,
    ...canonLibrary['tarte-tatin'],
    curatorLine: 'Фрукт, карамель и перевёрнутая сборка делают технику важнее декоративной поверхности.',
    techniques: ['POMME', 'CARAMEL', 'CUISSON INVERSÉE'],
  },
  {
    id: 'tarte-tropezienne', order: 13, name: 'Tarte Tropézienne', act: 'territoire', visualTone: 'cream', gridRow: 1, gridStart: 9, gridSpan: 4,
    ...canonLibrary['tarte-tropezienne'],
    curatorLine: 'Бриошь и крем создают десерт, чья мягкость столь же важна, как узнаваемая форма.',
    techniques: ['BRIOCHE', 'CRÈME', 'SUCRE GRAIN'],
  },
  {
    id: 'canele-bordeaux', order: 14, name: 'Canelé de Bordeaux', act: 'territoire', isAnchor: true, visualTone: 'copper', gridRow: 2, gridStart: 1, gridSpan: 8,
    ...canonLibrary['canele-bordeaux'],
    curatorLine: 'Контраст почти чёрной карамельной оболочки и влажной сердцевины рождается прежде всего в форме и режиме выпечки.',
    techniques: ['MOULE', 'CARAMÉLISATION', 'CUISSON'],
  },
  {
    id: 'galette-des-rois', order: 15, name: 'Galette des Rois', act: 'territoire', visualTone: 'amber', gridRow: 2, gridStart: 9, gridSpan: 4,
    ...canonLibrary['galette-des-rois'],
    curatorLine: 'Feuilletage, миндальная начинка и сезонный ритуал соединяют ремесло с повторяющейся культурной практикой.',
    techniques: ['FEUILLETAGE', 'AMANDE', 'RAYAGE'],
  },
]

export const canonWorksByAct = (act: CanonActId) => canonWorks.filter((work) => work.act === act)
