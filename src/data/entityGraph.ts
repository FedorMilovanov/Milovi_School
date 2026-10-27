/**
 * Canonical entity graph for Patisserie Russe.
 *
 * Single source of truth for every `@id` used in JSON-LD across the site, so
 * the homepage, /about/, /methodology/ and the 157 article pages reference the
 * SAME nodes instead of re-declaring conflicting copies.
 *
 * Positioning (owner decision, 2026-10-27):
 *   - Patisserie Russe is an INDEPENDENT educational project. It is NOT a
 *     publication of the Milovi Cake confectionery and carries no author/
 *     editor claims on behalf of that business.
 *   - The site was created, edited and designed by Fedor Milovanov using
 *     generative AI tooling. He is the `creator` / `editor` of the project.
 *   - Milovi Cake (https://milovicake.ru) is a SEPARATE confectionery that
 *     supports the project. None of its staff are credited as authors or
 *     reviewers of the French recipe analyses published here.
 *   - The educational/editorial, search-discovery and portfolio intentions of
 *     the project are internal and are NOT stated in public copy.
 *
 * No personal identifiers (tax IDs, private addresses, phone numbers,
 * certificates, personal photos) of any private individual appear in this
 * graph. Only the project's creator is named, with the roles confirmed by the
 * owner. AGENTS.md §4: source != author; no invented credentials.
 */

export const SITE_URL = 'https://french.milovicake.ru'
export const BRAND_URL = 'https://milovicake.ru'

/** Stable canonical identifiers. Never change without a redirect plan. */
export const ENTITY_IDS = {
  school: `${SITE_URL}/#school`,
  website: `${SITE_URL}/#website`,
  creator: `${SITE_URL}/#fedor`,
  organization: `${BRAND_URL}/#organization`,
  business: `${BRAND_URL}/#business`,
} as const

/** Educational boundary — repeated in schema, UI and llms.txt (truth contract). */
export const EDUCATIONAL_DISCLAIMER =
  'Patisserie Russe — независимый образовательный и исследовательский проект ' +
  'Фёдора Милованова, созданный с применением генеративных нейросетей. ' +
  'Материалы и разборы французских рецептур публикуются исключительно в ' +
  'учебных целях и не являются коммерческим меню кондитерской Milovi Cake. ' +
  'Кондитерская Milovi Cake и её сотрудники не являются авторами или ' +
  'рецензентами этих учебных разборов.'

/** The project's creator/editor/designer. No private identifiers by design. */
export const creatorNode = {
  '@type': 'Person',
  '@id': ENTITY_IDS.creator,
  name: 'Фёдор Милованов',
  alternateName: 'Fedor Milovanov',
  jobTitle: 'Создатель, редактор и дизайнер образовательного проекта Patisserie Russe',
  description:
    'Создал Patisserie Russe как независимую образовательную библиотеку о ' +
    'французской кондитерской школе, применив генеративные нейросети для ' +
    'дизайна, редактуры и технической реализации.',
  url: `${SITE_URL}/about/`,
  knowsAbout: [
    'Французская кондитерская школа',
    'Генеративные нейросети в веб-разработке',
    'Редакционные стандарты и проверка источников',
  ],
} as const

/** Separate confectionery — a sponsor entity, NOT the publisher of this site. */
export const businessNode = {
  '@type': 'Bakery',
  '@id': ENTITY_IDS.business,
  name: 'Milovi Cake',
  url: BRAND_URL,
  parentOrganization: { '@id': ENTITY_IDS.organization },
} as const

export const organizationNode = {
  '@type': 'Organization',
  '@id': ENTITY_IDS.organization,
  name: 'Milovi Cake',
  url: BRAND_URL,
} as const

export const schoolNode = {
  '@type': 'EducationalOrganization',
  '@id': ENTITY_IDS.school,
  name: 'Patisserie Russe',
  alternateName: ['Milovi School', 'French Pastry Archive'],
  url: SITE_URL,
  inLanguage: 'ru',
  description:
    'Русскоязычная образовательная библиотека о французской кондитерской ' +
    'школе: 157 материалов об истории, техниках, ингредиентах и шефах.',
  disambiguatingDescription: EDUCATIONAL_DISCLAIMER,
  founder: { '@id': ENTITY_IDS.creator },
  sponsor: { '@id': ENTITY_IDS.organization },
} as const

/** Full graph for the homepage, /about/ and /methodology/. */
export function entityGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      creatorNode,
      businessNode,
      organizationNode,
      schoolNode,
    ],
  }
}

/** Minimal reference for article JSON-LD (keeps payload small, IDs stable). */
export const creatorRef = { '@id': ENTITY_IDS.creator } as const
export const schoolRef = { '@id': ENTITY_IDS.school } as const
