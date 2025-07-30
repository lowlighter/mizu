// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*text` directive. */
export const _text: Directive<{
  Default: true
}> = {
  name: "*text",
  phase: Phase.CONTENT,
  default: "this.innerHTML",
  async execute(this: typeof _text, renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    element.textContent = `${await renderer.evaluate(element, attribute.value || this.default, options)}`
  },
}

/** Default exports. */
export default _text
