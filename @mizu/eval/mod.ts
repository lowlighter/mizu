// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*eval` directive. */
export const _eval: Directive<{
  Cache: WeakMap<HTMLElement, Attr>
}> = {
  name: "*eval",
  phase: Phase.CUSTOM_PROCESSING,
  init(this: typeof _eval, renderer) {
    renderer.cache<Cache<typeof this>>(this.name, new WeakMap())
  },
  execute(this: typeof _eval, renderer, element, { attributes: [attribute], cache }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    cache.set(element, attribute)
  },
  async cleanup(this: typeof _eval, renderer, element, { cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    if (cache.has(element)) {
      const attribute = cache.get(element)!
      cache.delete(element)
      await renderer.evaluate(element, attribute.value, { ...options, args: [] })
    }
  },
}

/** Default exports. */
export default _eval
