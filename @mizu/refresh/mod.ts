// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*refresh` directive. */
export const _refresh: Directive<{
  Cache: WeakMap<HTMLElement | Comment, { id: number; interval: number }>
}> = {
  name: "*refresh",
  phase: Phase.POSTPROCESSING,
  init(this: typeof _refresh, renderer) {
    renderer.cache<Cache<typeof this>>(this.name, new WeakMap())
  },
  setup(this: typeof _refresh, _, __, { state }) {
    if (!("$refresh" in state)) {
      Object.assign(state, { $refresh: false })
    }
    return { state }
  },
  async execute(this: typeof _refresh, renderer, element, { attributes: [attribute], cache, ...options }) {
    const value = await renderer.evaluate(element, attribute.value, options) as string

    // Clear interval if value is null
    if (value === null) {
      clearTimeout(cache.get(element)?.id)
      cache.delete(element)
      return
    }

    // Setup interval configuration for later use
    const interval = Number.parseInt(`${1000 * Number(value)}`)
    if ((Number.isNaN(interval)) || (interval <= 0)) {
      renderer.warn(`[${this.name}] expects a finite positive number but got ${value}, ignoring`, element)
      return
    }
    const cached = cache.get(element) ?? cache.set(element, { interval, id: NaN }).get(element)!
    if (((cached.interval !== interval) && (!Number.isNaN(cached.id))) || (options.state[renderer.internal("refreshing")])) {
      clearTimeout(cached.id)
      cached.id = NaN
    }
  },
  cleanup(this: typeof _refresh, renderer, element, { cache, ...options }) {
    // Cleanup interval from commented out elements
    if ((renderer.isComment(element)) && (cache.has(renderer.cache("*").get(element)!))) {
      element = renderer.cache("*").get(element)!
      clearTimeout(cache.get(element)?.id)
      cache.delete(element)
      return
    }

    // Setup interval if needed
    if (!Number.isNaN(cache.get(element)?.id)) {
      return
    }
    cache.get(element)!.id = setTimeout(() => {
      if (element.isConnected) {
        renderer.render(element as HTMLElement, { ...options, state: { ...options.state, $refresh: true, [renderer.internal("refreshing")]: true } })
      }
    }, cache.get(element)!.interval)
  },
}

/** Default exports. */
export default _refresh
