// Imports
import { type Cache, type Directive, type Optional, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*refresh` directive. */
export const _refresh = {
  name: "*refresh",
  phase: Phase.POSTPROCESSING,
  init(renderer) {
    renderer.cache<Cache<typeof _refresh>>(this.name, new WeakMap())
  },
  setup(_, __, { state }) {
    if (!("$refresh" in state)) {
      Object.assign(state, { $refresh: false })
    }
    return { state }
  },
  async execute(renderer, element, { attributes: [attribute], cache, ...options }) {
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
    const cached = cache.get(element) ?? cache.set(element, { interval, id: undefined }).get(element)!
    if (((cached.interval !== interval) && (cached.id !== undefined)) || (options.state[renderer.internal("refreshing")])) {
      clearTimeout(cached.id)
      cached.id = undefined
    }
  },
  cleanup(renderer, element, { cache, ...options }) {
    // Cleanup interval from commented out elements
    if ((renderer.isComment(element)) && (cache.has(renderer.cache("*").get(element)!))) {
      element = renderer.cache("*").get(element)!
      clearTimeout(cache.get(element)?.id)
      cache.delete(element)
      return
    }

    // Setup interval if needed
    const cached = cache.get(element)
    if ((!cached) || (cached.id !== undefined)) {
      return
    }
    cached.id = setTimeout(() => {
      if (element.isConnected) {
        renderer.render(element as HTMLElement, { ...options, state: { ...options.state, $refresh: true, [renderer.internal("refreshing")]: true } })
      }
    }, cached.interval)
  },
} as const satisfies Directive<{
  Cache: WeakMap<HTMLElement | Comment, { id: Optional<ReturnType<typeof setTimeout>>; interval: number }>
}>

/** Default exports. */
export default _refresh
