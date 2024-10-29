// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*html` directive. */
export const _html = {
  name: "*html",
  phase: Phase.CONTENT,
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    element.innerHTML = `${await renderer.evaluate(element, attribute.value, options)}`
  },
} as Directive & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _html
