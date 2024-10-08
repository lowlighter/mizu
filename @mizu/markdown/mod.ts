// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*markdown` directive. */
export const _markdown = {
  name: "*markdown",
  phase: Phase.CONTENT,
  default: "this.textContent",
  import: {
    markdown: import.meta.resolve("@libs/markdown"),
  },
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (renderer.isComment(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute)
    const { Renderer } = await import(`${this.import.markdown}/renderer`)
    let markdown = Renderer
    if (parsed.tag) {
      markdown = await Renderer.with({ plugins: parsed.tag.split(",").map((name) => `${this.import.markdown}/plugins/${name}`) })
    }
    element.innerHTML = await markdown.render(`${await renderer.evaluate(element, attribute.value || this.default, options)}`)
  },
} as Directive & { default: NonNullable<Directive["default"]>; import: NonNullable<Directive["import"]> }

/** Default exports. */
export default _markdown
