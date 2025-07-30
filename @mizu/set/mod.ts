// Imports
import { type Cache, type Context, type Directive, type Nullable, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*set` directive. */
export const _set: Directive<{
  Cache: WeakMap<HTMLElement | Comment, Nullable<Context>>
}> = {
  name: "*set",
  phase: Phase.CONTEXT,
  init(this: typeof _set, renderer) {
    renderer.cache<Cache<typeof this>>(this.name, new WeakMap())
  },
  async execute(this: typeof _set, renderer, element, { attributes: [attribute], cache, ...options }) {
    if (!cache.has(element)) {
      const context = await renderer.evaluate(element, attribute.value, options)
      if (typeof context !== "object") {
        renderer.warn(`[${this.name}] expects an object but got ${typeof context}, ignoring`, element)
        return
      }
      cache.set(element, context ? options.context.with(context as Record<PropertyKey, unknown>) : null)
    }
    return { context: cache.get(element) }
  },
}

/** Default exports. */
export default _set
