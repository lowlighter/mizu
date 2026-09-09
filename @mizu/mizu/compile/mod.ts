// Imports
import { type Context, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*mizu.compile` cache. */
export type Cache = Map<HTMLElement, { context: Context; mode: string }>

/** `*mizu.compile` directive. */
export const _mizu_compile = {
  name: "*mizu.compile",
  phase: Phase.ELIGIBILITY,
  init(renderer) {
    renderer.cache<Cache>(this.name, new Map())
  },
  setup(renderer, element, { cache, context, state }) {
    if ((!renderer.isHtmlElement(element)) || (!element.hasAttribute(this.name))) {
      return
    }
    let mode = element.getAttribute(this.name)!
    if (!["", "render"].includes(mode)) {
      renderer.warn(`[${this.name}] expects either "" or "render" but got "${mode}", ignoring`, element)
      mode = ""
    }
    if (state.$compile) {
      cache.set(element, { context, mode })
    }
    if (mode !== "render") {
      return false
    }
  },
} as const satisfies Directive<{
  Name: string
  Cache: Cache
}>

/** `*mizu.compile-entrypoint` directive. */
export const _mizu_compile_entrypoint = {
  name: "*mizu.compile-entrypoint",
  phase: Phase.ELIGIBILITY,
  setup(renderer, element) {
    if ((renderer.isHtmlElement(element)) && (element.hasAttribute(this.name))) {
      return false
    }
  },
} as const satisfies Directive<{
  Name: string
}>

/** Default exports. */
export default [_mizu_compile, _mizu_compile_entrypoint]
