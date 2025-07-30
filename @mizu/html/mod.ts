// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*html` directive. */
export const _html: Directive<{
  Default: true
}> = {
  name: "*html",
  phase: Phase.CONTENT,
  async execute(this: typeof _html, renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    element.innerHTML = `${await renderer.evaluate(element, attribute.value, options)}`
  },
}

/** Default exports. */
export default _html
