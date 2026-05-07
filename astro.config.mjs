import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// https://french.milovicake.ru
export default defineConfig({
  site: 'https://french.milovicake.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
