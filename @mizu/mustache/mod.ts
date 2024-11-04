// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
import { capture } from "./capture.ts"
export type * from "@mizu/internal/engine"

/** `*mustache` directive. */
export const _mustache = {
  name: "*mustache",
  phase: Phase.CONTENT,
  multiple: true,
  init(renderer) {
    renderer.cache<Cache<typeof _mustache>>(this.name, new WeakMap())
  },
  setup(renderer, _, { state }) {
    if (state[renderer.internal("mustaching")]) {
      return { execute: true }
    }
  },
  async execute(renderer, element, { cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    await Promise.allSettled(
      Array.from(element.childNodes).map(async (node) => {
        if (node.nodeType !== renderer.window.Node.TEXT_NODE) {
          return
        }
        const text = node as Text
        if (!cache.has(text)) {
          cache.set(text, text.textContent!)
        }
        try {
          const template = cache.get(text)!
          let templated = template
          let offset = 0
          let captured = null as ReturnType<typeof capture>
          // deno-lint-ignore no-cond-assign
          while (captured = capture(template, offset)) {
            const { b, match, captured: expression } = captured
            templated = templated.replace(match, `${await renderer.evaluate(element, expression, options).catch((error) => (renderer.warn(error, element), null)) ?? ""}`)
            offset = b
          }
          text.textContent = templated
        } catch (error) {
          renderer.warn(`${error}`.split("\n")[0], element)
        }
      }),
    )
    return { state: { [renderer.internal("mustaching")]: true } }
  },
} as Directive<WeakMap<Text, string>> & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _mustache
