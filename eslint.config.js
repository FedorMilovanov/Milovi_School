import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  location: 'readonly',
  crypto: 'readonly',
  URL: 'readonly',
  Response: 'readonly',
  fetch: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  encodeURIComponent: 'readonly',
  Date: 'readonly',
  Number: 'readonly',
  performance: 'readonly',
  IntersectionObserver: 'readonly',
  HTMLElement: 'readonly',
  HTMLButtonElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLDetailsElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLSpanElement: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  Node: 'readonly',
  ServiceWorker: 'readonly',
  ServiceWorkerRegistration: 'readonly',
  console: 'readonly',
}

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'src/**/*.astro'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'astro.config.mjs'],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-control-regex': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        self: 'readonly',
        caches: 'readonly',
      },
    },
  },
  {
    files: ['public/analytics-consent.js'],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
    },
  },
  {
    files: ['scripts/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['scripts/audit_gallery_preview.mjs'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        process: 'readonly',
        Event: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
  },
])
