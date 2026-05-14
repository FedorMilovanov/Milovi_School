// Local images bundled into the single-file build via Vite.
// These are guaranteed to work even without network access.

import _pastryFruits from './pastry-fruits.jpg'
import _pastryChef from './pastry-chef.jpg'
import _pastryMacarons from './pastry-macarons.jpg'
import _pastryChocolate from './pastry-chocolate.jpg'
import _pastryPecan from './pastry-pecan.jpg'
import _pastryMogador from './pastry-mogador.jpg'

/** Normalize Vite/Astro image import to a plain URL string. */
function toSrc(img: unknown): string {
  if (!img) return ''
  if (typeof img === 'string') return img
  const o = img as Record<string, unknown>
  return (typeof o['src'] === 'string' ? o['src'] : typeof o['url'] === 'string' ? o['url'] : '') as string
}

const pastryFruits   = toSrc(_pastryFruits)
const pastryChef     = toSrc(_pastryChef)
const pastryMacarons = toSrc(_pastryMacarons)
const pastryChocolate = toSrc(_pastryChocolate)
const pastryPecan    = toSrc(_pastryPecan)
const pastryMogador  = toSrc(_pastryMogador)

export const localImages = {
  fruits:    pastryFruits,
  chef:      pastryChef,
  macarons:  pastryMacarons,
  chocolate: pastryChocolate,
  pecan:     pastryPecan,
  mogador:   pastryMogador,
} as const

// Pick a guaranteed local image by category id
export function fallbackImageFor(categoryId: string): string {
  switch (categoryId) {
    case 'cedric-grolet':
    case 'claire-heitzler':
    case 'nina-metayer':
      return pastryFruits
    case 'mercotte':
    case 'pierre-herme':
    case 'chiffres-gourmands':
      return pastryMacarons
    case 'christophe-michalak':
    case 'philippe-conticini':
    case 'dominique-ansel':
    case 'cyril-lignac':
    case 'jacques-genin':
      return pastryChocolate
    case 'francois-perret':
    case 'yann-couvreur':
    case 'nicolas-paciello':
    case 'christophe-felder':
    case 'techniques':
    case 'french-cuisine':
    case 'recipes':
    default:
      return pastryChef
  }
}

export const defaultFallback = pastryChef
