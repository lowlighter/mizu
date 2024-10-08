// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*skip` directive. */
export const _skip = {
  name: "*skip",
  phase: Phase.PREPROCESSING,
  setup(renderer, element) {
    if ((renderer.isHtmlElement(element)) && (element.hasAttribute(this.name))) {
      return false
    }
  },
} as Directive & { name: string }

/** Default exports. */
export default _skip
