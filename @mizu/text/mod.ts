// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*text` directive. */
export const _text = {
  name: "*text",
  phase: Phase.CONTENT,
  default: "this.innerHTML",
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (renderer.isComment(element)) {
      return
    }
    element.textContent = `${await renderer.evaluate(
      element,
      attribute.value || this.default,
      options,
    )}`
  },
} as Directive & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _text
