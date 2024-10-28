// Imports
import { type Directive, Phase } from "@mizu/render/engine"
import mapping from "./mapping.json" with { type: "json" }
export type * from "@mizu/render/engine"

/** Typings. */
export const typings = {
  modifiers: {
    trim: { type: Boolean, enforce: true },
  },
} as const

/** `*code` directive. */
export const _code = {
  name: "*code",
  phase: Phase.CONTENT,
  typings,
  default: "this.textContent",
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }

    // Load language syntax
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    const language = (mapping as Record<PropertyKey, string>)[parsed.tag] ?? "plaintext"
    const { hljs } = await import("./import/highlight.js/core.ts")
    if (!hljs.getLanguage(language)) {
      const { syntax } = await import(`./import/highlight.js/languages/${language}.ts`)
      hljs.registerLanguage(language, syntax)
    }

    // Retrieve code
    let code = `${await renderer.evaluate(element, attribute.value || this.default, options)}`

    // Trim indentation
    if (parsed.modifiers.trim) {
      const trim = code.match(/^[ \t]*\S/m)?.[0].match(/\S/)?.index ?? 0
      code = code.replaceAll(new RegExp(`^[ \\t]{${trim}}`, "gm"), "")
    }

    // Highlight code
    code = hljs.highlight(code, { language }).value
    if (parsed.modifiers.trim) {
      code = code.trim()
    }
    element.innerHTML = code

    // Trim parent
    if ((parsed.modifiers.trim) && (element.parentElement?.tagName === "PRE")) {
      element.parentElement.innerHTML = element.parentElement.innerHTML.trim()
    }
  },
} as Directive<null, typeof typings> & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _code
