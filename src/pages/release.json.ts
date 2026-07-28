import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = () => {
  const sha = (import.meta.env.PUBLIC_RELEASE_SHA ?? 'development').trim()
  return new Response(
    JSON.stringify({
      repository: 'FedorMilovanov/Milovi_School',
      sha,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
