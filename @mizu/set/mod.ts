// Imports
import { type Cache, type Context, type Directive, type Nullable, Phase } from "@mizu/render/engine"
export type * from "@mizu/render/engine"

/** `*set` directive. */
export const _set = {
  name: "*set",
  phase: Phase.CONTEXT,
  init(renderer) {
    renderer.cache<Cache<typeof _set>>(this.name, new WeakMap())
  },
  async execute(renderer, element, { attributes: [attribute], cache, ...options }) {
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
} as Directive<WeakMap<HTMLElement | Comment, Nullable<Context>>>

/** Default exports. */
export default _set
