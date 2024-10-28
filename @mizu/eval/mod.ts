// Imports
import { type Cache, type Directive, Phase } from "@mizu/render/engine"
export type * from "@mizu/render/engine"

/** `*eval` directive. */
export const _eval = {
  name: "*eval",
  phase: Phase.CUSTOM_PROCESSING,
  init(renderer) {
    renderer.cache<Cache<typeof _eval>>(this.name, new WeakMap())
  },
  execute(renderer, element, { attributes: [attribute], cache }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    cache.set(element, attribute)
  },
  async cleanup(renderer, element, { cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    if (cache.has(element)) {
      const attribute = cache.get(element)!
      cache.delete(element)
      await renderer.evaluate(element, attribute.value, options)
    }
  },
} as Directive<WeakMap<HTMLElement, Attr>>

/** Default exports. */
export default _eval
