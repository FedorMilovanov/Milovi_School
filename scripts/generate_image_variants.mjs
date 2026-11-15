#!/usr/bin/env node

/**
 * Deterministic responsive derivatives for card-sized article imagery.
 *
 * Why this exists: every card on `/materials/` and in "related" blocks rendered
 * at ~336 CSS px but served the full-size original — 1448-1698 px, 200-390 KB
 * each, ~6.8 MB on the first view of the gallery (measured in Chromium 153), and
 * a 4.07x oversampling ratio on the article page. Nothing in the build ever
 * produced a smaller file, and `srcset` cannot point at files that do not exist.
 *
 * Contract:
 *  - input:  `public/images/articles/*.webp` (+ `public/images/categories/*.webp`)
 *  - output: `public/images/variants/<name>-480.webp`, `<name>-960.webp`
 *  - idempotent: a derivative is regenerated only when the source is newer
 *  - fail-closed: a broken source aborts the build instead of shipping an image
 *    that silently renders at the wrong size
 *
 * The output directory is gitignored, like the Canon gateway derivative: these
 * are build artifacts, not sources. `sharp` is the dependency declared by the
 * infrastructure owner; it is imported explicitly so a missing install fails here
 * with a readable message instead of at the first `srcset` request.
 */

import { readdir, stat, mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const WIDTHS = [480, 960]
// A derivative that is larger than its source is a regression, not an
// optimisation: `cat-recipes.webp` is 1638 px at 129 KB, while a naive 960 px
// re-encode at q78 came out at 142 KB. Step the quality down until the candidate
// actually beats the source, and drop it if nothing does.
const QUALITY_STEPS = [78, 68, 58, 48]
const SOURCE_DIRS = ['public/images', 'public/images/articles', 'public/images/categories', 'public/images/canon-sucre']
const OUTPUT_DIR = 'public/images/variants'
const MANIFEST = 'src/data/imageVariants.generated.ts'

async function loadSharp() {
  try {
    const module = await import('sharp')
    return module.default ?? module
  } catch (error) {
    throw new Error(
      'sharp is not installed; responsive image derivatives need it as a devDependency ' +
        '(declared in package.json).',
      { cause: error },
    )
  }
}

async function listSources() {
  const files = []
  for (const dir of SOURCE_DIRS) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.webp')) files.push(path.join(dir, entry.name))
    }
  }
  return files.sort()
}

async function isStale(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([stat(source), stat(target)])
    return sourceStat.mtimeMs > targetStat.mtimeMs
  } catch {
    return true
  }
}

async function main() {
  const sharp = await loadSharp()
  const sources = await listSources()
  if (sources.length === 0) throw new Error('No source images found for responsive derivatives')

  await mkdir(OUTPUT_DIR, { recursive: true })

  let written = 0
  let skipped = 0
  const failures = []
  /**
   * `${publicPath}` -> available widths. Committed so the React components can
   * build `srcset` deterministically on both the server and the client (a client
   * bundle cannot read the filesystem, and guessing widths would ship 404s for
   * sources that are narrower than a step).
   */
  const manifest = {}

  // libvips already works inside its own thread pool, so a small queue of files
  // in flight (8) keeps all cores busy without thrashing — 224 sources drop from
  // ~42 s sequential to a few seconds.
  const CONCURRENCY = 8
  let cursor = 0

  const worker = async () => {
    while (cursor < sources.length) {
      const source = sources[cursor]
      cursor += 1
      const name = path.basename(source, '.webp')
      let metadata
      try {
        metadata = await sharp(source).metadata()
      } catch (error) {
        failures.push(`${source}: ${error instanceof Error ? error.message : String(error)}`)
        continue
      }
      if (!metadata.width) {
        failures.push(`${source}: no intrinsic width`)
        continue
      }

      const sourceBytes = (await stat(source)).size
      for (const width of WIDTHS) {
        // Never upscale: a derivative wider than the source is a bigger lie than none.
        if (metadata.width <= width) continue
        const target = path.join(OUTPUT_DIR, `${name}-${width}.webp`)
        const publicPath = `/${path.relative('public', source).split(path.sep).join('/')}`

        if (!(await isStale(source, target))) {
          if ((await stat(target)).size < sourceBytes) {
            skipped += 1
            manifest[publicPath] = [...(manifest[publicPath] ?? []), width]
            continue
          }
          // Stale-but-too-big: re-encode below.
        }

        let encoded = null
        for (const quality of QUALITY_STEPS) {
          const candidate = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer()
          if (candidate.length < sourceBytes) {
            encoded = candidate
            break
          }
        }

        if (!encoded) {
          // No quality level beats the original: do not advertise this width, and
          // remove a file a previous run may have left behind.
          await rm(target, { force: true })
          continue
        }

        await writeFile(target, encoded)
        written += 1
        manifest[publicPath] = [...(manifest[publicPath] ?? []), width]
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const manifestBody = Object.entries(manifest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([publicPath, widths]) => `  '${publicPath}': [${widths.join(', ')}],`)
    .join('\n')
  const manifestSource =
    '// Generated by scripts/generate_image_variants.mjs — do not edit by hand.\n' +
    '// Maps a public image path to the widths that actually exist on disk, so\n' +
    '// components never emit a `srcset` candidate that would 404.\n' +
    'export const IMAGE_VARIANT_WIDTHS: Readonly<Record<string, readonly number[]>> = {\n' +
    `${manifestBody}\n}\n`
  await writeFile(MANIFEST, manifestSource, 'utf8')

  if (failures.length > 0) {
    console.error(`[image-variants] FAILED for ${failures.length} source(s):`)
    for (const failure of failures) console.error(` - ${failure}`)
    process.exitCode = 1
    return
  }

  const totalBytes = (await readdir(OUTPUT_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
    .reduce(async (sum, entry) => (await sum) + (await stat(path.join(OUTPUT_DIR, entry.name))).size, Promise.resolve(0))
  console.log(
    `[image-variants] ${sources.length} source(s), ${written} written, ${skipped} up to date, ` +
      `${((await totalBytes) / 1024).toFixed(0)} KB of derivatives, ${Object.keys(manifest).length} manifest entries`,
  )
}

main().catch((error) => {
  console.error(`[image-variants] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
