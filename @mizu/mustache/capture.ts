/**
 * Capture content between delimiters.
 *
 * @example
 * ```ts
 * import { capture } from "./capture.ts"
 *
 * const { captured, match } = capture("foo {{ bar }} baz", { start: "{{", end: "}}" })!
 * console.assert(captured === "bar")
 * console.assert(match === "{{ bar }}")
 * ```
 *
 * @author Simon Lecoq (lowlighter)
 * @license MIT
 */
export function capture(string: string, { offset = 0, start: _start = "{{", end: _end = "}}" } = {}) {
  const start = [..._start]
  const end = [..._end]
  let depth = 0
  let i = NaN
  for (let j = offset; j < string.length; j++) {
    if (start.every((character, index) => string[j + index] === character)) {
      depth++
      if (Number.isNaN(i)) {
        i = j
      }
      j += start.length
    }
    if (depth && end.every((character, index) => string[j + index] === character)) {
      depth--
      if (depth === 0) {
        return {
          a: i + start.length,
          b: j + end.length,
          match: string.slice(i, j + end.length),
          captured: string.slice(i + start.length, j).trim(),
        }
      }
      j += end.length
    }
  }
  if (depth) {
    throw new SyntaxError(`Unclosed expression, unterminated expression at: ${i}\n${string.slice(i)}`)
  }
  return null
}
