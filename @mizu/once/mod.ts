// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*once` typings. */
export const typings = {
  modifiers: {
    flat: { type: Boolean },
  },
} as const

/** `*once` directive. */
export const _once = {
  name: "*once",
  phase: Phase.POSTPROCESSING,
  typings,
  init(renderer) {
    renderer.cache<Cache<typeof _once>>(this.name, new WeakSet())
  },
  setup(_, element, { cache }) {
    if (cache.has(element)) {
      return false
    }
  },
  cleanup(renderer, element, { cache }) {
    let target = element
    if ((renderer.isComment(element)) && (renderer.cache("*").has(element))) {
      target = renderer.cache("*").get(element)!
    }
    const attribute = renderer.getAttributes(target, this.name, { first: true })
    if (!attribute) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    if ((renderer.isHtmlElement(element)) && (parsed.modifiers.flat)) {
      renderer.replaceElementWithChildNodes(element, element).forEach((element) => cache.add(element))
    }
    cache.add(element)
  },
} as const satisfies Directive<{
  Cache: WeakSet<HTMLElement | Comment>
  Typings: typeof typings
}>

/** Default exports. */
export default _once
