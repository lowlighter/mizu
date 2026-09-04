// Imports
import { type Directive, type Nullable, Phase } from "@mizu/internal/engine"
import { _if, type Cache } from "@mizu/if"
export type * from "@mizu/internal/engine"

/** `*else` directive. */
export const _else = {
  name: "*else",
  phase: Phase.TOGGLE,
  default: "true",
  execute(renderer, element, { attributes: [attribute] }) {
    const cache = renderer.cache<Cache>(_if.name)
    let previous = element.previousSibling as Nullable<HTMLElement | Comment>
    while (previous) {
      // Break on non-empty text nodes
      if ((previous.nodeType === renderer.window.Node.TEXT_NODE) && (previous.textContent?.trim())) {
        break
      }

      // Force directive to `false` when a previous operand is truthy
      const closing = cache?.templates.get(cache.generated.get(previous)!)?.end === previous
      const opened = Boolean(cache?.templates.get(previous as Comment)?.end.parentNode)
      if (closing || opened || ((renderer.isHtmlElement(previous)) && (renderer.getAttributes(previous, [_if.name, _else.name] as string[], { first: true })))) {
        return _if.execute(renderer, element, { ...arguments[2], _directive: { directive: this.name, expression: attribute.value, value: "false" } })
      }

      // Break on other elements
      if (renderer.isHtmlElement(previous)) {
        break
      }

      // Execute directive with given expression when first operand is found and is falsy (meaning all previous operand were falsy too)
      if ((renderer.isComment(previous)) && (renderer.getAttributes(renderer.cache("*").get(previous), _if.name, { first: true }))) {
        return _if.execute(renderer, element, { ...arguments[2], _directive: { directive: this.name, expression: attribute.value, value: attribute.value || this.default } })
      }
      previous = previous.previousSibling as Nullable<HTMLElement | Comment>
    }
    renderer.warn(`[${this.name}] must be immediately preceded by another [${_if.name}] or [${_else.name}], ignoring`, element)
  },
} as const satisfies Directive<{
  Default: true
}>

/** Default exports. */
export default [_if, _else]
