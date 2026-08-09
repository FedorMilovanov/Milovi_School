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
  curatorLine?: string
  techniques?: string[]
  articleId?: string
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
 * Curatorial shell only. Research-owned dates, places, technique claims,
 * archive sources and article links are intentionally added later.
 */
export const canonWorks: CanonWork[] = [
  { id: 'saint-honore', order: 1, name: 'Saint-Honoré', act: 'forme', isAnchor: true, visualTone: 'amber' },
  { id: 'paris-brest', order: 2, name: 'Paris-Brest', act: 'forme', visualTone: 'cocoa' },
  { id: 'religieuse', order: 3, name: 'Religieuse', act: 'forme', visualTone: 'cocoa' },
  { id: 'eclair', order: 4, name: 'Éclair', act: 'forme', visualTone: 'cream' },
  { id: 'opera', order: 5, name: 'Opéra', act: 'forme', visualTone: 'cocoa' },

  { id: 'baba-au-rhum', order: 6, name: 'Baba au Rhum', act: 'signature', visualTone: 'amber' },
  { id: 'tarte-au-citron', order: 7, name: 'Tarte au Citron', act: 'signature', visualTone: 'cream' },
  { id: 'ispahan', order: 8, name: 'Ispahan', act: 'signature', isAnchor: true, visualTone: 'rose' },
  { id: '2000-feuilles', order: 9, name: '2000 Feuilles', act: 'signature', visualTone: 'amber' },
  { id: 'mont-blanc', order: 10, name: 'Mont-Blanc', act: 'signature', visualTone: 'cocoa' },

  { id: 'kouign-amann', order: 11, name: 'Kouign-Amann', act: 'territoire', visualTone: 'amber' },
  { id: 'tarte-tatin', order: 12, name: 'Tarte Tatin', act: 'territoire', visualTone: 'amber' },
  { id: 'tarte-tropezienne', order: 13, name: 'Tarte Tropézienne', act: 'territoire', visualTone: 'cream' },
  { id: 'canele-bordeaux', order: 14, name: 'Canelé de Bordeaux', act: 'territoire', isAnchor: true, visualTone: 'copper' },
  { id: 'galette-des-rois', order: 15, name: 'Galette des Rois', act: 'territoire', visualTone: 'amber' },
]

export const canonWorksByAct = (act: CanonActId) => canonWorks.filter((work) => work.act === act)
