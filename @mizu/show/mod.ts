// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*show` directive. */
export const _show = {
  name: "*show",
  phase: Phase.DISPLAY,
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const result = Boolean(await renderer.evaluate(element, attribute.value, options))
    if (result) {
      element.style.removeProperty("display")
      if (!element.style.length) {
        element.removeAttribute("style")
      }
    } else {
      element.style.setProperty("display", "none", "important")
    }
  },
} as Directive

/** Default exports. */
export default _show
