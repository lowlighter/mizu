// Imports
import { type Context, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*mizu.compile` cache. */
export type Cache = Map<HTMLElement, { context: Context; entrypoint: string }>

/**
 * `*mizu.compile` directive.
 *
 * The element and its children are skipped during rendering.
 * When the `$compile` state is set (see `Server.compile()`), the element is registered along with its context and entrypoint selector so it can be compiled afterwards.
 */
export const _mizu_compile = {
  name: "*mizu.compile",
  phase: Phase.ELIGIBILITY,
  init(renderer) {
    renderer.cache<Cache>(this.name, new Map())
  },
  setup(renderer, element, { cache, context, state }) {
    const attribute = renderer.isHtmlElement(element) ? renderer.getAttributes(element, this.name, { first: true }) : null
    if (!attribute) {
      return
    }
    if (state.$compile) {
      cache.set(element as HTMLElement, { context, entrypoint: attribute.value })
    }
    return false
  },
} as const satisfies Directive<{
  Cache: Cache
}>

/** Default exports. */
export default _mizu_compile
