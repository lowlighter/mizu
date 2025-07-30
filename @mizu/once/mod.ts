// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*once` directive. */
export const _once: Directive<{
  Cache: WeakSet<HTMLElement | Comment>
}> = {
  name: "*once",
  phase: Phase.POSTPROCESSING,
  init(this: typeof _once, renderer) {
    renderer.cache<Cache<typeof this>>(this.name, new WeakSet())
  },
  setup(this: typeof _once, _, element, { cache }) {
    if (cache.has(element)) {
      return false
    }
  },
  cleanup(this: typeof _once, renderer, element, { cache }) {
    let target = element
    if ((renderer.isComment(element)) && (renderer.cache("*").has(element))) {
      target = renderer.cache("*").get(element)!
    }
    const attribute = renderer.getAttributes(target, this.name, { first: true })
    if (!attribute) {
      return
    }
    cache.add(element)
  },
}

/** Default exports. */
export default _once
