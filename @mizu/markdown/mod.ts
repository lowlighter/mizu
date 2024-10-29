// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

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
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, typings, { modifiers: true })
    const { Renderer } = await import("./import/markdown/renderer.ts")
    let markdown = Renderer
    if (parsed.tag) {
      const plugins = await Promise.all(parsed.tag.split(",").map(async (name) => (await import(`./import/markdown/plugins/${name}.ts`)).default))
      markdown = await Renderer.with({ plugins }) as unknown as typeof markdown
    }
    let content = `${await renderer.evaluate(element, attribute.value || this.default, options)}`
    if (parsed.modifiers.trim) {
      const trim = content.match(/^[ \t]*\S/m)?.[0].match(/\S/)?.index ?? 0
      content = content.replaceAll(new RegExp(`^[ \\t]{${trim}}`, "gm"), "")
    }
    element.innerHTML = await markdown.render(content)
  },
} as Directive<null, typeof typings> & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _markdown
