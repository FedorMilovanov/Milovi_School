export interface CanonLibraryBinding {
  articleId: string
}

/**
 * Exact Canon → published library route bindings only.
 * Media lives in canon-media.ts so exhibition media and article publication
 * remain independent concerns. No historical claims or UI copy live here.
 *
 * For objects whose legacy history article contains superseded origin wording,
 * Canon deliberately links to the technical dossier while documentary history
 * is carried by canon-research.ts under fail-closed wording.
 */
export const canonLibrary = {
  'saint-honore': { articleId: 'recipe-saint-honore' },
  'paris-brest': { articleId: 'recipe-paris-brest-classique' },
  religieuse: { articleId: 'michalak-religieuse' },
  eclair: { articleId: 'recipe-eclairs-adam' },
  opera: { articleId: 'recipe-opera-dalloyau' },
  'baba-au-rhum': { articleId: 'recipe-baba-rhum-alain-ducasse' },
  'tarte-au-citron': { articleId: 'genin-tarte-au-citron-canon' },
  ispahan: { articleId: 'herme-ispahan-deep' },
  '2000-feuilles': { articleId: 'herme-2000-feuilles-canon' },
  'mont-blanc': { articleId: 'recipe-mont-blanc' },
  'kouign-amann': { articleId: 'lignac-kouign-amann' },
  'tarte-tatin': { articleId: 'recipe-tarte-tatin' },
  'tarte-tropezienne': { articleId: 'recipe-tarte-tropezienne' },
  'canele-bordeaux': { articleId: 'recipe-canele' },
  'galette-des-rois': { articleId: 'cuisine-galette' },
} as const satisfies Record<string, CanonLibraryBinding>

export type CanonLibraryId = keyof typeof canonLibrary