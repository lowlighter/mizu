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
  async cleanup(renderer, element, { cache, context, state }) {
    let target = element
    if ((renderer.isComment(element)) && (renderer.cache("*").has(element))) {
      target = renderer.cache("*").get(element)!
    }
    const attribute = renderer.getAttributes(target, this.name, { first: true })
    if (!attribute) {
      return
    }
    if ((renderer.isHtmlElement(element)) && (renderer.parseAttribute(attribute, this.typings, { modifiers: true }).modifiers.flat)) {
      // Child nodes are moved (not cloned) so that already rendered content keeps its identity (event listeners, caches, etc.)
      // Since the content of <template> elements is not traversed by the renderer, it is rendered here before being cached
      const template = element.tagName === "TEMPLATE"
      for (const child of renderer.replaceElementWithChildNodes(element, element)) {
        if (template && (renderer.isHtmlElement(child))) {
          await renderer.render(child, { context, state: { ...state } })
        }
        cache.add(child)
      }
    }
    cache.add(element)
  },
} as const satisfies Directive<{
  Cache: WeakSet<HTMLElement | Comment>
  Typings: typeof typings
}>

/** Default exports. */
export default _once
