/**
 * Single source of truth for inline JSON-LD serialization.
 *
 * The payload is embedded inside `<script type="application/ld+json">`, i.e. in
 * HTML, so plain `JSON.stringify` is not safe there:
 *
 * - a literal `<` (for example `</script>` inside a description) can terminate
 *   the element early and drop the graph entirely;
 * - U+2028 / U+2029 are legal in JSON but not inside JS string literals.
 *
 * We therefore emit the JSON escapes `\u003c`, `\u2028`, `\u2029`. Those are
 * valid JSON escape sequences, so crawlers parse the exact same values, while
 * the raw bytes can no longer break out of the script element.
 *
 * Note the writer-side difference: `.replace(/</g, '\\u003c')` produces the two
 * character `\u003c` escape in the output text. Writing `'\\\\u003c'` (as some
 * older page-local copies did) produced a literal backslash in the parsed value.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
