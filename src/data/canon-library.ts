export interface CanonLibraryBinding {
  articleId: string
}

/**
 * Exact Canon → existing library route bindings only.
 * Media lives in canon-media.ts so a final exhibition image can be integrated
 * independently from dossier publication. No historical claims or UI copy here.
 */
export const canonLibrary = {
  'saint-honore': { articleId: 'recipe-saint-honore' },
  'paris-brest': { articleId: 'paris-brest-race-dessert' },
  religieuse: { articleId: 'michalak-religieuse' },
  eclair: { articleId: 'eclair-histoire-complete' },
  opera: { articleId: 'opera-gateau-histoire' },
  'baba-au-rhum': { articleId: 'recipe-baba-rhum-alain-ducasse' },
  ispahan: { articleId: 'herme-ispahan-deep' },
  'mont-blanc': { articleId: 'recipe-mont-blanc' },
  'kouign-amann': { articleId: 'lignac-kouign-amann' },
  'tarte-tatin': { articleId: 'recipe-tarte-tatin' },
  'tarte-tropezienne': { articleId: 'recipe-tarte-tropezienne' },
  'canele-bordeaux': { articleId: 'recipe-canele' },
  'galette-des-rois': { articleId: 'cuisine-galette' },
} as const satisfies Record<string, CanonLibraryBinding>

export type CanonLibraryId = keyof typeof canonLibrary
