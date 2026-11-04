// Build-time-only search metadata shared across article pages.
// Full article bodies must not enter the browser search index.
import type { APIRoute } from 'astro'
import { libraryClientMeta } from '../data/library'

export const GET: APIRoute = () =>
  new Response(JSON.stringify(libraryClientMeta), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
