// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
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
      return
    }

    // Setup interval configuration for later use
    const interval = Number.parseInt(`${1000 * Number(value)}`)
    if ((Number.isNaN(interval)) || (interval <= 0)) {
      renderer.warn(`[${this.name}] expects a finite positive number but got ${value}, ignoring`, element)
      return
    }
    clearTimeout(cache.get(element)?.id)
    cache.set(element, { interval, id: NaN })
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
    if (!Number.isNaN(cache.get(element)?.id)) {
      return
    }
    cache.get(element)!.id = setTimeout(() => renderer.render(element as HTMLElement, { ...options, state: { ...options.state, $refresh: true } }), cache.get(element)!.interval)
  },
} as Directive<WeakMap<HTMLElement | Comment, { id: number; interval: number }>>

/** Default exports. */
export default _refresh
