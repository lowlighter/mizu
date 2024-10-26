// Imports
import { type Directive, Phase, resolve } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** Typings. */
export const typings = {
  modifiers: {
    trim: { type: Boolean, enforce: true },
  },
} as const

/** `*markdown` directive. */
export const _markdown = {
  name: "*markdown",
  phase: Phase.CONTENT,
  default: "this.textContent",
  typings,
  import: {
    markdown: resolve("@libs/markdown", import.meta),
  },
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (renderer.isComment(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, typings, { modifiers: true })
    const { Renderer } = await import(`${this.import.markdown}/renderer`)
    let markdown = Renderer
    if (parsed.tag) {
      markdown = await Renderer.with({ plugins: parsed.tag.split(",").map((name) => `${this.import.markdown}/plugins/${name}`) })
    }
    let content = `${await renderer.evaluate(element, attribute.value || this.default, options)}`
    if (parsed.modifiers.trim) {
      const trim = content.match(/^[ \t]*\S/m)?.[0].match(/\S/)?.index ?? 0
      content = content.replaceAll(new RegExp(`^[ \\t]{${trim}}`, "gm"), "")
    }
    element.innerHTML = await markdown.render(content)
  },
} as Directive<null, typeof typings> & { default: NonNullable<Directive["default"]>; import: NonNullable<Directive["import"]> }

/** Default exports. */
export default _markdown
