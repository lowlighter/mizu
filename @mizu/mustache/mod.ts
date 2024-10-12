// Imports
import { type Cache, type Directive, Phase } from "@mizu/mizu/core/engine"
import { capture } from "./capture.ts"
export type * from "@mizu/mizu/core/engine"

/** `*mustache` directive. */
export const _mustache = {
  name: "*mustache",
  phase: Phase.CONTENT,
  init(renderer) {
    renderer.cache<Cache<typeof _mustache>>(this.name, new WeakMap())
  },
  async execute(renderer, element, { cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const filter = renderer.window.NodeFilter.SHOW_TEXT
    const walker = renderer.document.createTreeWalker(element, filter, { acceptNode: () => renderer.window.NodeFilter.FILTER_ACCEPT })
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (!cache.has(node)) {
        cache.set(node, node.textContent!)
      }
      try {
        const template = cache.get(node)!
        let templated = template
        let offset = 0
        let captured = null as ReturnType<typeof capture>
        // deno-lint-ignore no-cond-assign
        while (captured = capture(template, offset)) {
          const { b, match, captured: expression } = captured
          templated = templated.replace(match, `${await renderer.evaluate(element, expression, options).catch((error) => (renderer.warn(error, element), null)) ?? ""}`)
          offset = b
        }
        node.textContent = templated
      } catch (error) {
        renderer.warn(`${error}`.split("\n")[0], element)
      }
    }
  },
} as Directive<WeakMap<Text, string>> & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _mustache
