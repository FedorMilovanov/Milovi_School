/**
 * Canonical entity graph for Patisserie Russe / Milovi School.
 *
 * Source of truth for every `@id` used in JSON-LD across the site. Keeping the
 * identifiers here prevents drift between the homepage, /about/, /methodology/
 * and the 157 article pages: each page emits a @graph that references the SAME
 * nodes instead of re-declaring conflicting copies.
 *
 * Verified 2026-10-27 against live first-party pages (owner-confirmed):
 *   https://milovicake.ru/o-konditere/   — full name, taxID, address, phone, photo
 *   https://milovicake.ru/certificates/  — the five named training credentials
 *   https://milovicake.ru/privacy/       — operator name and taxID
 *   https://t.me/MiloviCake, https://vk.com/milovi_cake,
 *   https://www.youtube.com/@milovi_cake — sameAs profiles
 * The main site also links back to this library and states the boundary:
 * educational materials are NOT the commercial menu of Milovi Cake.
 *
 * Per AGENTS.md §4 (source != author) we do NOT replace the editorial
 * `author` of articles with a person. Articles get `editor`/`reviewedBy`
 * references to the person node only, backed by a visible byline block.
 */

export const SITE_URL = 'https://french.milovicake.ru'
export const BRAND_URL = 'https://milovicake.ru'

/** Stable canonical identifiers. Never change without a redirect plan. */
export const ENTITY_IDS = {
  school: `${SITE_URL}/#school`,
  website: `${SITE_URL}/#website`,
  organization: `${BRAND_URL}/#organization`,
  business: `${BRAND_URL}/#business`,
  person: `${BRAND_URL}/#viktoria`,
} as const

/** Educational boundary — repeated in schema, UI and llms.txt (truth contract). */
export const EDUCATIONAL_DISCLAIMER =
  'Patisserie Russe (Milovi School) — независимый образовательный и ' +
  'исследовательский проект. Материалы и разборы французских рецептур ' +
  'публикуются исключительно в учебных целях и не являются коммерческим ' +
  'меню кондитерской Milovi Cake.'

export const viktoriaNode = {
  '@type': 'Person',
  '@id': ENTITY_IDS.person,
  name: 'Виктория Викторовна Милованова',
  alternateName: 'Виктория Милованова',
  jobTitle:
    'Шеф-кондитер, основатель Milovi Cake и автор образовательного проекта Patisserie Russe',
  taxID: '263006403654',
  url: `${BRAND_URL}/o-konditere/`,
  image: `${BRAND_URL}/img/viktoria.webp`,
  worksFor: { '@id': ENTITY_IDS.business },
  sameAs: [
    `${BRAND_URL}/o-konditere/`,
    `${BRAND_URL}/certificates/`,
    `${SITE_URL}/about/`,
    'https://vk.com/milovi_cake',
    'https://t.me/MiloviCake',
    'https://www.youtube.com/@milovi_cake',
  ],
  hasCredential: [
    { '@type': 'EducationalOccupationalCredential', name: 'Торт от А до Я — Кондитерская школа Praline' },
    { '@type': 'EducationalOccupationalCredential', name: 'Торт на миллион 3.0 — Ксения Большан' },
    { '@type': 'EducationalOccupationalCredential', name: 'Акварельная роспись по мастике. Барельеф — Praline' },
    { '@type': 'EducationalOccupationalCredential', name: 'Детские торты — Кондитерская школа Praline' },
    { '@type': 'EducationalOccupationalCredential', name: 'Шоколадная флористика — Ирина Мошкина' },
  ],
} as const

export const businessNode = {
  '@type': 'Bakery',
  '@id': ENTITY_IDS.business,
  name: 'Milovi Cake',
  url: BRAND_URL,
  image: `${BRAND_URL}/img/head_desktop.webp`,
  telephone: '+79119038886',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Пулковская ул., 19',
    addressLocality: 'Санкт-Петербург',
    postalCode: '196158',
    addressCountry: 'RU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 59.83494,
    longitude: 30.350265,
  },
  founder: { '@id': ENTITY_IDS.person },
  parentOrganization: { '@id': ENTITY_IDS.organization },
} as const

export const organizationNode = {
  '@type': 'Organization',
  '@id': ENTITY_IDS.organization,
  name: 'Milovi Cake',
  url: BRAND_URL,
  founder: { '@id': ENTITY_IDS.person },
} as const

export const schoolNode = {
  '@type': 'EducationalOrganization',
  '@id': ENTITY_IDS.school,
  name: 'Patisserie Russe — Milovi School',
  alternateName: ['Patisserie Russe', 'Milovi School', 'French Pastry Archive'],
  url: SITE_URL,
  inLanguage: 'ru',
  description:
    'Русскоязычная образовательная библиотека о французской кондитерской ' +
    'школе: 157 материалов об истории, техниках, ингредиентах и шефах.',
  disambiguatingDescription: EDUCATIONAL_DISCLAIMER,
  parentOrganization: { '@id': ENTITY_IDS.organization },
  founder: { '@id': ENTITY_IDS.person },
  sameAs: [`${BRAND_URL}/o-konditere/`],
} as const

/** Full graph for the homepage, /about/ and /methodology/. */
export function entityGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      viktoriaNode,
      businessNode,
      organizationNode,
      schoolNode,
    ],
  }
}

/** Minimal reference for article JSON-LD (keeps payload small, IDs stable). */
export const editorRef = { '@id': ENTITY_IDS.person } as const
export const schoolRef = { '@id': ENTITY_IDS.school } as const
