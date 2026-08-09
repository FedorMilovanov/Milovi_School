export type CanonActId = 'forme' | 'signature' | 'territoire'

export interface CanonWork {
  id: string
  order: number
  name: string
  act: CanonActId
  isAnchor?: boolean
  visualTone: 'amber' | 'rose' | 'cocoa' | 'cream' | 'copper'
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
  {
    id: 'forme',
    roman: 'I',
    title: 'LA FORME',
    subtitle: 'Когда конструкция стала языком.',
  },
  {
    id: 'signature',
    roman: 'II',
    title: 'LA SIGNATURE',
    subtitle: 'Когда классика обрела автора или Maison.',
  },
  {
    id: 'territoire',
    roman: 'III',
    title: 'LE TERRITOIRE',
    subtitle: 'Когда место, сезон и ритуал стали частью формы.',
  },
]

/**
 * Collection projection over the existing library.
 * Only already-existing article routes and images are bound here. Historical
 * dates, origin claims, archival objects and rights-sensitive material remain
 * outside this file until the Research transfer closes them.
 *
 * A work without `image` is intentionally rendered as a finished catalogue
 * plate, never as a fake pastry illustration or skeleton placeholder.
 */
export const canonWorks: CanonWork[] = [
  {
    id: 'saint-honore', order: 1, name: 'Saint-Honoré', act: 'forme', isAnchor: true, visualTone: 'amber',
    curatorLine: 'Архитектура pâte à choux, карамели и крема — один из самых узнаваемых конструктивных языков французской pâtisserie.',
    techniques: ['PÂTE À CHOUX', 'CARAMEL', 'CRÈME'],
  },
  {
    id: 'paris-brest', order: 2, name: 'Paris-Brest', act: 'forme', visualTone: 'cocoa',
    image: '/images/articles/paris-brest-race-dessert.webp', imageAlt: 'Paris-Brest',
    articleId: 'paris-brest-race-dessert', linkLabel: 'Открыть историю',
    curatorLine: 'Кольцевая pâte à choux и пралине превратили форму в мгновенно узнаваемый знак.',
    techniques: ['PÂTE À CHOUX', 'PRALINÉ', 'CRÈME'],
  },
  {
    id: 'religieuse', order: 3, name: 'Religieuse', act: 'forme', visualTone: 'cocoa',
    image: '/images/articles/michalak-religieuse.webp', imageAlt: 'Religieuse — современная интерпретация Christophe Michalak',
    articleId: 'michalak-religieuse', linkLabel: 'Изучить интерпретацию',
    curatorLine: 'Два choux, глазурь и вертикальная сборка делают силуэт частью рецепта.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'GLAÇAGE'],
  },
  {
    id: 'eclair', order: 4, name: 'Éclair', act: 'forme', visualTone: 'cream',
    image: '/images/articles/eclair-histoire-complete.webp', imageAlt: 'Éclair',
    articleId: 'eclair-histoire-complete', linkLabel: 'Открыть историю',
    curatorLine: 'Продольная форма choux стала самостоятельным носителем крема, глазури и современного авторского языка.',
    techniques: ['PÂTE À CHOUX', 'CRÈME', 'FONDANT'],
  },
  {
    id: 'opera', order: 5, name: 'Opéra', act: 'forme', visualTone: 'cocoa',
    image: '/images/articles/opera-gateau-histoire.webp', imageAlt: 'Gâteau Opéra',
    articleId: 'opera-gateau-histoire', linkLabel: 'Открыть историческое досье',
    curatorLine: 'Прямоугольник, тонкие слои и строгая высота: вкус организован как графическая конструкция.',
    techniques: ['BISCUIT JOCONDE', 'CAFÉ', 'GANACHE'],
  },

  {
    id: 'baba-au-rhum', order: 6, name: 'Baba au Rhum', act: 'signature', visualTone: 'amber',
    curatorLine: 'Сироп, ферментированное тесто и подача делают пропитку не дополнением, а главным конструктивным жестом.',
    techniques: ['PÂTE LEVÉE', 'SIROP', 'IMBIBAGE'],
  },
  {
    id: 'tarte-au-citron', order: 7, name: 'Tarte au Citron', act: 'signature', visualTone: 'cream',
    curatorLine: 'Кислота, pâte sucrée и эмульсия требуют точности, которую невозможно спрятать декором.',
    techniques: ['PÂTE SUCRÉE', 'CITRON', 'ÉMULSION'],
  },
  {
    id: 'ispahan', order: 8, name: 'Ispahan', act: 'signature', isAnchor: true, visualTone: 'rose',
    image: '/images/articles/herme-ispahan-deep.webp', imageAlt: 'Ispahan Pierre Hermé',
    articleId: 'herme-ispahan-deep', linkLabel: 'Открыть досье',
    curatorLine: 'Роза, личи и малина работают как единый узнаваемый вкусовой аккорд.',
    techniques: ['MACARON', 'ROSE', 'LITCHI · FRAMBOISE'],
  },
  {
    id: '2000-feuilles', order: 9, name: '2000 Feuilles', act: 'signature', visualTone: 'amber',
    curatorLine: 'Ламинация и пралине становятся исследованием хруста, слоёв и контраста текстур.',
    techniques: ['FEUILLETAGE', 'PRALINÉ', 'TEXTURE'],
  },
  {
    id: 'mont-blanc', order: 10, name: 'Mont-Blanc', act: 'signature', visualTone: 'cocoa',
    image: '/images/articles/recipe-mont-blanc.webp', imageAlt: 'Mont-Blanc aux marrons',
    articleId: 'recipe-mont-blanc', linkLabel: 'Открыть разбор',
    curatorLine: 'Меренга, шантийи и каштан собираются в силуэт, который узнаётся ещё до первого укуса.',
    techniques: ['MERINGUE', 'CHANTILLY', 'MARRON'],
  },

  {
    id: 'kouign-amann', order: 11, name: 'Kouign-Amann', act: 'territoire', visualTone: 'amber',
    image: '/images/articles/lignac-kouign-amann.webp', imageAlt: 'Kouign-Amann',
    articleId: 'lignac-kouign-amann', linkLabel: 'Изучить технику',
    curatorLine: 'Слоёное дрожжевое тесто, масло и сахар превращают карамелизацию в саму структуру изделия.',
    techniques: ['LAMINATION', 'BEURRE', 'CARAMÉLISATION'],
  },
  {
    id: 'tarte-tatin', order: 12, name: 'Tarte Tatin', act: 'territoire', visualTone: 'amber',
    image: '/images/articles/recipe-tarte-tatin.webp', imageAlt: 'Tarte Tatin',
    articleId: 'recipe-tarte-tatin', linkLabel: 'Открыть разбор',
    curatorLine: 'Фрукт, карамель и перевёрнутая сборка делают технику важнее декоративной поверхности.',
    techniques: ['POMME', 'CARAMEL', 'CUISSON INVERSÉE'],
  },
  {
    id: 'tarte-tropezienne', order: 13, name: 'Tarte Tropézienne', act: 'territoire', visualTone: 'cream',
    image: '/images/articles/recipe-tarte-tropezienne.webp', imageAlt: 'Tarte Tropézienne',
    articleId: 'recipe-tarte-tropezienne', linkLabel: 'Открыть разбор',
    curatorLine: 'Бриошь и крем создают десерт, чья мягкость столь же важна, как узнаваемая форма.',
    techniques: ['BRIOCHE', 'CRÈME', 'SUCRE GRAIN'],
  },
  {
    id: 'canele-bordeaux', order: 14, name: 'Canelé de Bordeaux', act: 'territoire', isAnchor: true, visualTone: 'copper',
    image: '/images/articles/recipe-canele.webp', imageAlt: 'Canelé de Bordeaux',
    articleId: 'recipe-canele', linkLabel: 'Открыть технику',
    curatorLine: 'Контраст почти чёрной карамельной оболочки и влажной сердцевины рождается прежде всего в форме и режиме выпечки.',
    techniques: ['MOULE', 'CARAMÉLISATION', 'CUISSON'],
  },
  {
    id: 'galette-des-rois', order: 15, name: 'Galette des Rois', act: 'territoire', visualTone: 'amber',
    image: '/images/articles/cuisine-galette.webp', imageAlt: 'Galette des Rois',
    articleId: 'cuisine-galette', linkLabel: 'Открыть материал',
    curatorLine: 'Feuilletage, миндальная начинка и сезонный ритуал соединяют ремесло с повторяющейся культурной практикой.',
    techniques: ['FEUILLETAGE', 'AMANDE', 'RAYAGE'],
  },
]

export const canonWorksByAct = (act: CanonActId) => canonWorks.filter((work) => work.act === act)
