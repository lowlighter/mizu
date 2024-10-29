// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*is` directive. */
export const _is = {
  name: "*is",
  phase: Phase.MORPHING,
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }

    // Check whether element needs to be morphed
    const tagname = `${await renderer.evaluate(element, attribute.value, options)}`.toLocaleUpperCase()
    if (tagname === element.tagName) {
      return
    }
    const original = renderer.cache("*").get(element) ?? element
    let morphed = original

    // Create morphed element if tagname doesn't match and keep track of original element
    if (tagname !== original.tagName) {
      morphed = renderer.createElement(tagname)
      renderer.cache("*").set(morphed, original)
    }

    // Replace element with morphed element while keeping same children and cloning attributes
    if (element !== morphed) {
      for (const child of Array.from(element.childNodes) as HTMLElement[]) {
        morphed.appendChild(child)
      }
      Array.from(element.attributes).forEach((attribute) => morphed.attributes.setNamedItem(attribute.cloneNode(true) as Attr))
      element.replaceWith(morphed)
    }

    // Clean up previous element if it isn't original element
    if (element !== original) {
      renderer.cache("*").delete(element)
    }

    return { element: morphed }
  },
} as Directive

/** Default exports. */
export default _is
