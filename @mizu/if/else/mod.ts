// Imports
import { type Directive, Phase } from "@mizu/render/engine"
import { _if } from "@mizu/if"
export type * from "@mizu/render/engine"

/** `*else` directive. */
export const _else = {
  name: "*else",
  phase: Phase.TOGGLE,
  default: "true",
  execute(renderer, element, { attributes: [attribute] }) {
    let previous = element.previousSibling as HTMLElement
    while (previous) {
      // Break on non-empty text nodes
      if ((previous.nodeType === renderer.window.Node.TEXT_NODE) && (previous.textContent?.trim())) {
        break
      }

      // Force directive to `false` when a previous operand is truthy
      if ((renderer.isHtmlElement(previous))) {
        if (renderer.getAttributes(previous, [_if.name, _else.name] as string[], { first: true })) {
          return _if.execute(renderer, element, { ...arguments[2], _directive: { directive: this.name, expression: attribute.value, value: "false" } })
        }
        break
      }

      // Execute directive with given expression when first operand is found and is falsy (meaning all previous operand were falsy too)
      if ((renderer.isComment(previous)) && (renderer.getAttributes(renderer.cache("*").get(previous), _if.name, { first: true }))) {
        return _if.execute(renderer, element, { ...arguments[2], _directive: { directive: this.name, expression: attribute.value, value: attribute.value || this.default } })
      }
      previous = (previous as HTMLElement).previousSibling as HTMLElement
    }
    renderer.warn(`[${this.name}] must be immediately preceded by another [${_if.name}] or [${_else.name}], ignoring`, element)
  },
} as Directive

/** Default exports. */
export default [_if, _else]
