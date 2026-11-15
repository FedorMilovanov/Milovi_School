import { URL } from 'node:url'
import { Buffer } from 'node:buffer'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Run the pure UI helper without changing the application's TS/build settings.
const source = await readFile(new URL('../src/utils/markdownLinks.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { splitMarkdownLinks, safeInlineHref } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const fixtures = [
  ['plain text', ['plain text']],
  ['[one](https://example.org/a)', ['', 'one', 'https://example.org/a', '']],
  ['Before [PDF](https://commons.wikimedia.org/wiki/File:The_modern_cook_(IA_moderncook02lach).pdf) after', ['Before ', 'PDF', 'https://commons.wikimedia.org/wiki/File:The_modern_cook_(IA_moderncook02lach).pdf', ' after']],
  ['[Wiki](https://fr.wikipedia.org/wiki/Financier_(p%C3%A2tisserie))', ['', 'Wiki', 'https://fr.wikipedia.org/wiki/Financier_(p%C3%A2tisserie)', '']],
  ['[nested](https://example.org/a(b(c))) and [local](/materials/)', ['', 'nested', 'https://example.org/a(b(c))', ' and ', 'local', '/materials/', '']],
  ['[escaped](https://example.org/a\\(b\\))', ['', 'escaped', 'https://example.org/a(b)', '']],
  ['[unclosed](https://example.org/a(b)', ['[unclosed](https://example.org/a(b)']],
  ['![image](/image.webp)', ['![image](/image.webp)']],
]
for (const [input, expected] of fixtures) assert.deepEqual(splitMarkdownLinks(input), expected, input)
for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.org', 'https://x.test/\nscript']) assert.equal(safeInlineHref(url), null, url)
for (const url of ['https://x.test/a(b)', '/materials/', '#section', 'mailto:editor@example.org']) assert.equal(safeInlineHref(url), url)
console.log(`UI helper audit passed: ${fixtures.length} parsing fixtures and 8 URL-policy cases`)
