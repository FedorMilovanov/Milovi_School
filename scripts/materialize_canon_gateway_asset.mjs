import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(root, 'assets/canon-gateway-hero')
const target = resolve(root, 'public/images/canon-sucre/canon-gateway-hero.webp')
const expectedBytes = 77970
const expectedSha256 = 'a954f979338ba59328cf2d92ea4e848265ce17054b5b6b807ff45fe9a8afd5fc'

const parts = [
  'part-00.b64',
  'part-01.b64',
  'part-02.b64',
  'part-03a.b64',
  'part-03b.b64',
  'part-04.b64',
  'part-05.b64',
  'part-06.b64',
].map((name) => resolve(sourceDir, name))

const encoded = (await Promise.all(parts.map((part) => readFile(part, 'utf8'))))
  .join('')
  .replace(/\s+/g, '')
const bytes = Buffer.from(encoded, 'base64')
const sha256 = createHash('sha256').update(bytes).digest('hex')

if (bytes.length !== expectedBytes || sha256 !== expectedSha256) {
  throw new Error(
    `Canon gateway asset integrity failure: got ${bytes.length} bytes / ${sha256}, expected ${expectedBytes} / ${expectedSha256}`,
  )
}

await mkdir(dirname(target), { recursive: true })
await writeFile(target, bytes)
console.log(`Canon gateway asset materialized: ${bytes.length} bytes, sha256=${sha256}`)
