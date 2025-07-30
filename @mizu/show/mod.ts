// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*show` directive. */
export const _show: Directive<{
  Default: true
}> = {
  name: "*show",
  phase: Phase.DISPLAY,
  default: "true",
  async execute(this: typeof _show, renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const result = Boolean(await renderer.evaluate(element, attribute.value || this.default, options))
    if (result) {
      element.style.removeProperty("display")
      if (!element.style.length) {
        element.removeAttribute("style")
      }
      if (renderer.window.getComputedStyle(element).display === "none") {
        element.style.setProperty("display", "initial", "important")
      }
    } else {
      element.style.setProperty("display", "none", "important")
    }
  },
}

/** Default exports. */
export default _show
