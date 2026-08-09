import type { CanonMediaId } from './canon-media'

export type CanonEvidenceKind = 'PRIMARY' | 'DOCUMENTED' | 'HOUSE' | 'INSTITUTIONAL' | 'CONFLICT' | 'BOUNDED'

export interface CanonResearchMilestone {
  id: string
  date: string
  sortKey: number
  workIds: readonly CanonMediaId[]
  title: string
  text: string
  evidence: CanonEvidenceKind
}

/**
 * Product-safe transfer from LE_CANON_SUCRE Research Wave 2 terminal authority.
 * Dates are documentary milestones, not automatic invention dates.
 * Only bounded/closed claims are represented here; visual-custody and locator
 * holds remain outside Product.
 */
export const canonResearchMilestones: readonly CanonResearchMilestone[] = [
  {
    id: 'saint-honore-1840-1873',
    date: '1840 / 1873',
    sortKey: 1840,
    workIds: ['saint-honore'],
    title: 'Saint-Honoré: origin account, then documented architecture',
    text: 'Lacam’s later account places the Chiboust story in 1840; Gouffé’s 1873 text independently closes the recognizable choux architecture. The 1840 date remains retrospective, not a contemporaneous event record.',
    evidence: 'BOUNDED',
  },
  {
    id: 'citron-1845',
    date: '1845',
    sortKey: 1845,
    workIds: ['tarte-au-citron'],
    title: 'Lemon tart architecture is already in circulation',
    text: 'Acton’s first-edition text maps thin pastry shells with a cooked lemon, egg, sugar and butter filling. It closes an early transnational architecture, not a national invention claim.',
    evidence: 'PRIMARY',
  },
  {
    id: 'eclair-1848',
    date: '1848',
    sortKey: 1848,
    workIds: ['eclair'],
    title: 'Éclair: earliest current French pastry locator in the corpus',
    text: 'A cream-filled pastry called éclairs is tightly located in Charles Paul de Kock’s 1848 text. This is a locator milestone, not an invention date.',
    evidence: 'DOCUMENTED',
  },
  {
    id: 'bailleux-1860',
    date: '1860',
    sortKey: 1860,
    workIds: ['religieuse', 'baba-au-rhum'],
    title: 'Professional named-entry layer',
    text: 'Bailleux’s expanded third edition directly exposes Religieuse, Babas parisiens, Savarin and Baba at institutional table-of-contents level. The corpus does not back-project those entries into the 1856 first edition.',
    evidence: 'INSTITUTIONAL',
  },
  {
    id: 'mont-blanc-1891-1896',
    date: '1891 / 1896',
    sortKey: 1891,
    workIds: ['mont-blanc'],
    title: 'Mont-Blanc before Angelina',
    text: 'Artusi documents a close chestnut-strand and whipped-cream predecessor in 1891; Farmer’s 1896 first edition contains a dessert explicitly headed Mont Blanc. Angelina’s 1903 line is therefore a famous house signature, not category invention.',
    evidence: 'PRIMARY',
  },
  {
    id: 'opera-1899',
    date: '1899',
    sortKey: 1899.1,
    workIds: ['opera'],
    title: 'The name “gâteau opéra” predates the Dalloyau form',
    text: 'A Grand Hôtel advertising lead records the name in 1899. Research explicitly keeps that object separate from Dalloyau’s later 1955 architecture.',
    evidence: 'BOUNDED',
  },
  {
    id: 'tatin-1899-1903',
    date: '1899 / 1903',
    sortKey: 1899.2,
    workIds: ['tarte-tatin'],
    title: 'Tatin documentary fame before the accident legend',
    text: 'Period evidence already identifies the Tatin tart and the Hôtel Tatin apple-tart specialty. Those early witnesses establish fame and transmission, but they do not establish an accident story.',
    evidence: 'DOCUMENTED',
  },
  {
    id: 'paris-brest-1909-1910',
    date: '1909–1910',
    sortKey: 1909,
    workIds: ['paris-brest'],
    title: 'Paris-Brest keeps a real two-year source conflict',
    text: 'The descendant/La Poste line preserves 1909; the current Maison preserves 1910. Product must publish the conflict rather than synthesize a commission-versus-launch story.',
    evidence: 'CONFLICT',
  },
  {
    id: 'opera-1955',
    date: '1955',
    sortKey: 1955.1,
    workIds: ['opera'],
    title: 'Dalloyau’s canonical modern Opéra line',
    text: 'Dalloyau and industry sources support Cyriaque Gavillon’s 1955 house creation as the canonical modern architecture, without equating it to the 1899 name lead.',
    evidence: 'HOUSE',
  },
  {
    id: 'tropezienne-1955-1956',
    date: '1955 / 1956',
    sortKey: 1955.2,
    workIds: ['tarte-tropezienne'],
    title: 'Tropézienne: creation and film chronology stay separate',
    text: 'House and municipal history anchor the pastry to 1955; the Saint-Tropez film shoot belongs to May–July 1956. The familiar “named in 1955 during filming” shortcut is therefore rejected.',
    evidence: 'BOUNDED',
  },
  {
    id: 'galette-1975',
    date: '1975',
    sortKey: 1975,
    workIds: ['galette-des-rois'],
    title: 'Modern Élysée galette ritual',
    text: 'Élysée primary records close the reception tradition since 1975 and the republican no-fève practice. A direct Saturnalia-to-modern-galette continuity is not asserted.',
    evidence: 'PRIMARY',
  },
  {
    id: 'canele-1985',
    date: '1985',
    sortKey: 1985,
    workIds: ['canele-bordeaux'],
    title: 'Canelé professional institutionalization',
    text: 'Regional, library and professional sources converge on 1985 professional institutionalization and the collective-mark story; exact historical mark particulars remain outside Product.',
    evidence: 'INSTITUTIONAL',
  },
  {
    id: 'ispahan-1997',
    date: '1997',
    sortKey: 1997,
    workIds: ['ispahan'],
    title: 'Ispahan enters the official chronology',
    text: 'The 1997 milestone is supported across official and institutional chronology for Pierre Hermé’s rose, lychee and raspberry signature.',
    evidence: 'HOUSE',
  },
  {
    id: 'kouign-protection-1999',
    date: 'c. 1999',
    sortKey: 1999,
    workIds: ['kouign-amann'],
    title: 'Kouign-Amann protection activity becomes documented',
    text: 'Independent 2001 reporting establishes Douarnenez association protection activity about two years earlier; participant sources give 15 December 1999. Exact INPI numbers and classes are deliberately omitted.',
    evidence: 'BOUNDED',
  },
  {
    id: '2000-feuilles-millennium',
    date: '≈ 2000',
    sortKey: 2000,
    workIds: ['2000-feuilles'],
    title: '2000 Feuilles: modern signature identity',
    text: 'Pierre Hermé’s current composition and signature status are closed; millennium-era naming context is supported at bounded editorial level. An unacquired Ladurée precursor page is not repeated.',
    evidence: 'HOUSE',
  },
  {
    id: 'genin-2010',
    date: '2010',
    sortKey: 2010,
    workIds: ['tarte-au-citron'],
    title: 'Genin technique enters authorized publisher custody',
    text: 'Éditions Alternatives documents the Genin/Astier lemon-tart publication and its dough, baking and lemon-cream technique. A precise 2009 citron-basilic creation date remains later-reporting only.',
    evidence: 'DOCUMENTED',
  },
]

const researchIds = new Set<string>()
let previousSortKey = -Infinity
for (const milestone of canonResearchMilestones) {
  if (researchIds.has(milestone.id)) throw new Error(`[canon-research] Duplicate milestone id: ${milestone.id}`)
  researchIds.add(milestone.id)
  if (milestone.sortKey < previousSortKey) throw new Error(`[canon-research] Timeline is not chronological at ${milestone.id}`)
  previousSortKey = milestone.sortKey
  if (milestone.workIds.length === 0) throw new Error(`[canon-research] Milestone has no Canon work: ${milestone.id}`)
}
