/**
 * Russian grammatical plural forms.
 *
 * @param n       — the number
 * @param forms   — [singular: 1, few: 2-4, many: 5+]  e.g. ['материал', 'материала', 'материалов']
 * @returns the correct form for n
 *
 * @example
 * pluralRu(1,  ['материал', 'материала', 'материалов']) // → 'материал'
 * pluralRu(3,  ['материал', 'материала', 'материалов']) // → 'материала'
 * pluralRu(11, ['материал', 'материала', 'материалов']) // → 'материалов'
 * pluralRu(21, ['материал', 'материала', 'материалов']) // → 'материал'
 */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs    = Math.abs(Math.trunc(n))
  const mod100 = abs % 100
  const mod10  = abs % 10

  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1)                   return forms[0]
  if (mod10 >= 2 && mod10 <= 4)     return forms[1]
  return forms[2]
}

// Pre-defined word sets used across the project
export const MATERIAL  = ['материал',  'материала',  'материалов']  as [string, string, string]
export const RESULT    = ['результат', 'результата', 'результатов'] as [string, string, string]
export const HEADING   = ['раздел',    'раздела',    'разделов']    as [string, string, string]
export const DAY       = ['день',      'дня',        'дней']        as [string, string, string]
