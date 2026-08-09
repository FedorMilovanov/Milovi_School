import { canonWorks } from './canon'
import type { CanonMediaId } from './canon-media'

export interface CanonTechniqueRow {
  id: string
  label: string
  workIds: readonly CanonMediaId[]
}

/**
 * Educational relationships used by the Technique Index.
 * Work order/name is never duplicated here: the 15 display columns come from
 * canonWorks, so reordering or renaming the Canon cannot silently desync the
 * matrix. This registry owns only the technique-to-work relationship.
 */
export const canonTechniqueRows: readonly CanonTechniqueRow[] = [
  { id: 'choux', label: 'PÂTE À CHOUX', workIds: ['saint-honore', 'paris-brest', 'religieuse', 'eclair'] },
  { id: 'lamination', label: 'FEUILLETAGE · LAMINATION', workIds: ['saint-honore', '2000-feuilles', 'kouign-amann', 'galette-des-rois'] },
  { id: 'caramel', label: 'CARAMEL · CARAMÉLISATION', workIds: ['saint-honore', '2000-feuilles', 'kouign-amann', 'tarte-tatin', 'canele-bordeaux'] },
  { id: 'praline', label: 'PRALINÉ', workIds: ['paris-brest', '2000-feuilles'] },
  { id: 'levee', label: 'PÂTE LEVÉE · BRIOCHE', workIds: ['baba-au-rhum', 'kouign-amann', 'tarte-tropezienne'] },
  { id: 'meringue', label: 'MERINGUE', workIds: ['mont-blanc'] },
  { id: 'emulsion', label: 'ÉMULSION', workIds: ['tarte-au-citron'] },
  { id: 'mould', label: 'CUISSON MOULÉE', workIds: ['canele-bordeaux'] },
]

const canonIds = new Set<string>(canonWorks.map((work) => work.id))
const rowIds = new Set<string>()
let relationshipCount = 0

for (const row of canonTechniqueRows) {
  if (!row.id || !row.label) throw new Error('[canon-techniques] Technique rows require stable ids and labels')
  if (rowIds.has(row.id)) throw new Error(`[canon-techniques] Duplicate technique row id: ${row.id}`)
  rowIds.add(row.id)

  if (row.workIds.length === 0) throw new Error(`[canon-techniques] Technique row has no works: ${row.id}`)
  const relationshipIds: readonly string[] = row.workIds
  const duplicates = relationshipIds.filter((id, index) => relationshipIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    throw new Error(`[canon-techniques] Duplicate work relationship in ${row.id}: ${[...new Set(duplicates)].join(', ')}`)
  }

  const unknown = relationshipIds.filter((id) => !canonIds.has(id))
  if (unknown.length > 0) {
    throw new Error(`[canon-techniques] Unknown Canon work in ${row.id}: ${unknown.join(', ')}`)
  }
  relationshipCount += row.workIds.length
}

if (canonTechniqueRows.length !== 8) {
  throw new Error(`[canon-techniques] Expected 8 technique rows, received ${canonTechniqueRows.length}`)
}
if (relationshipCount !== 21) {
  throw new Error(`[canon-techniques] Expected 21 technique/work relationships, received ${relationshipCount}`)
}

export const canonTechniqueRelationshipCount = relationshipCount