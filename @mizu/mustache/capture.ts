/** Tokens. */
const tokens = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
} as Record<PropertyKey, string>

/**
 * Capture content between delimiters.
 *
 * ```ts
 * const { captured, match } = capture("foo {{ bar }} baz")!
 * console.assert(captured === "bar")
 * console.assert(match === "{{ bar }}")
 * ```
 *
 * @author Simon Lecoq (lowlighter)
 * @license MIT
 */
export function capture(string: string, offset = 0) {
  const stack = []
  let a = NaN
  let d = 2
  let quoted = false
  for (let i = offset; i < string.length; i++) {
    // Start capturing upon meeting mustache opening
    if (Number.isNaN(a)) {
      if ((string[i] === "{") && (string[i + 1] === "{")) {
        if (string[i + 2] === "{") {
          d = 3
        }
        a = i
        i += d - 1
      }
      continue
    }
    // Close capturing on mustache closing (stack must be empty)
    if ((!stack.length) && (string[i] === "}") && (string[i + 1] === "}") && ((d === 2) || (string[i + 2] === "}"))) {
      return {
        a,
        b: i + d,
        match: string.slice(a, i + d),
        captured: string.slice(a + d, i).trim(),
        triple: d === 3,
      }
    }
    // Close group on closing token
    if (string[i] === tokens[stack.at(-1)!]) {
      stack.pop()
      continue
    }
    // Open group on opening token
    if ((!quoted) && (string[i] in tokens)) {
      stack.push(string[i])
      quoted = ["'", '"', "`"].includes(string[i])
      continue
    }
  }
  // Throw on mustache unclosed
  if (!Number.isNaN(a)) {
    throw new SyntaxError(`Unclosed expression, unterminated expression at: ${a}\n${string.slice(a)}`)
  }
  return null
}
