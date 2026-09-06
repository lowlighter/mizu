/**
 * Serialize a string into a JavaScript literal safe for inline scripts.
 *
 * Unlike `JSON.stringify()`, the result can neither terminate a `<script>` element nor contain line separators.
 */
export function quote(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}
