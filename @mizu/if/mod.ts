// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/**
 * `*if` directive.
 *
 * @internal `_directive.value` Force the directive to use specified value rather than the attribute value.
 * @internal `_directive.expression` Set the original expression for the directive if element is commented out.
 * @internal `_directive.directive` Set the original directive name for the directive if element is commented out.
 */
export const _if: Directive = {
  name: "*if",
  phase: Phase.TOGGLE,
  async execute(this: typeof _if, renderer, element, { attributes: [attribute], ...options }) {
    const result = Boolean(await renderer.evaluate(element, arguments[2]._directive?.value ?? attribute.value, options))
    switch (true) {
      // Switch comment to element if truthy
      case result && (renderer.isComment(element)) && (renderer.cache("*").has(element)): {
        const original = renderer.uncomment(element)
        return { element: original }
      }
      // Switch element to comment if falsy
      case (!result) && (renderer.isHtmlElement(element)): {
        const comment = renderer.comment(element, { expression: attribute.value, directive: _if.name, ...arguments[2]._directive })
        return { element: comment, final: true }
      }
    }
  },
}

/** Default exports. */
export default _if
