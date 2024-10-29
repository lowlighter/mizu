// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
import { _for, _id } from "@mizu/for"
import { _if } from "@mizu/if"
export type * from "@mizu/internal/engine"

/** Typings. */
export const typings = {
  modifiers: {
    not: { type: Boolean },
  },
} as const

/** `*empty` directive. */
export const _empty = {
  name: "*empty",
  phase: Phase.TOGGLE,
  typings,
  execute(renderer, element, { attributes: [attribute] }) {
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    const cache = renderer.cache<Cache<typeof _for>>(_for.name)
    const seen = [] as HTMLElement[]
    let previous = element.previousSibling as HTMLElement
    while (previous) {
      // Break on non-empty text nodes
      if ((previous.nodeType === renderer.window.Node.TEXT_NODE) && (previous.textContent?.trim())) {
        break
      }

      // Break on element node that was not created by a for directive or without an empty directive
      if ((renderer.isHtmlElement(previous)) && (!renderer.getAttributes(previous, [_empty.name, _id.name], { first: true }))) {
        seen.push(previous)
      }

      // Execute directive on first for loop found
      if ((renderer.isComment(previous)) && (cache?.has(previous))) {
        const items = [...cache.get(previous)!.items.values()]
        const $generated = items.length
        if (seen.some((item) => !items.includes(item))) {
          break
        }
        return {
          ..._if.execute(renderer, element, { ...arguments[2], _directive: { directive: this.name, expression: attribute.value, value: `!${parsed.modifiers.not ? "!" : ""}${$generated}` } }),
          state: { $generated },
        }
      }
      previous = (previous as HTMLElement).previousSibling as HTMLElement
    }
    renderer.warn(`[${this.name}] must be immediately preceded by a [${_for.name}] or [${_empty.name}] directive, ignoring`, element)
    return { state: { $generated: NaN } }
  },
} as Directive<null, typeof typings> & { name: string }

/** Default exports. */
export default [_for, _empty]
