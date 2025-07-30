// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/**
 * All spacing characters except non-breaking space.
 * {@link https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet | MDN reference}
 */
const spacing = "[\\fnrtvu0020u1680u2000-u200au2028u2029u202fu205fu3000ufeff]".replace(/([g-z])/g, "\\$1")

/** Spacing regular expressions. */
const regexp = {
  condense: new RegExp(`${spacing}+`, "g"),
  trim: new RegExp(`(?:^${spacing}*)|(?:${spacing}*$)`, "g"),
  clean: new RegExp(`${spacing}*(\\u00a0)${spacing}*`, "g"),
}

/** `*clean` typings. */
export const typings = {
  modifiers: {
    comments: { type: Boolean },
    spaces: { type: Boolean },
    directives: { type: Boolean },
    templates: { type: Boolean },
  },
} as const

/** `*clean` directive. */
export const _clean: Directive<{
  Cache: { directives: WeakSet<HTMLElement>; templates: WeakSet<HTMLElement>; comments: WeakSet<HTMLElement> }
  Typings: typeof typings
}> = {
  name: "*clean",
  phase: Phase.CONTENT_CLEANING,
  typings,
  init(this: typeof _clean, renderer) {
    renderer.cache<Cache<typeof this>>(this.name, { directives: new WeakSet(), templates: new WeakSet(), comments: new WeakSet() })
  },
  execute(this: typeof _clean, renderer, element, { attributes: [attribute], cache }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })

    // Register delayed cleanup
    if (parsed.modifiers.templates) {
      cache.templates.add(element)
    }
    if (parsed.modifiers.directives) {
      cache.directives.add(element)
      if (parsed.modifiers.comments) {
        cache.comments.add(element)
      }
    }

    // Prepare tree walker
    let filter = 0
    if (parsed.modifiers.spaces) {
      filter |= renderer.window.NodeFilter.SHOW_TEXT
    }
    if (parsed.modifiers.comments) {
      filter |= renderer.window.NodeFilter.SHOW_COMMENT
    }
    const walker = renderer.document.createTreeWalker(element, filter, { acceptNode: () => renderer.window.NodeFilter.FILTER_ACCEPT })
    const nodes = [] as Node[]
    while (walker.nextNode()) {
      nodes.push(walker.currentNode)
    }

    // Cleanup filtered nodes
    nodes.forEach((node) => {
      // Cleanup comments
      if (parsed.modifiers.comments && (node.nodeType === renderer.window.Node.COMMENT_NODE) && (!renderer.cache("*").has(node as Comment))) {
        ;(node as Comment).remove()
      } // Cleanup text nodes
      else if (parsed.modifiers.spaces && (node.nodeType === renderer.window.Node.TEXT_NODE)) {
        node.textContent = node.textContent!
          .replace(regexp.condense, " ")
          .replace(regexp.trim, "")
          .replace(regexp.clean, "$1")
        if (!node.textContent) {
          ;(node as Text).remove()
        }
      }
    })
  },
  cleanup(this: typeof _clean, renderer, _element, { cache }) {
    // Cleanup directives
    const element = _element as HTMLElement
    if (cache.directives.has(element)) {
      // Prepare tree walker
      let filter = renderer.window.NodeFilter.SHOW_ELEMENT
      if (cache.comments.has(element)) {
        filter |= renderer.window.NodeFilter.SHOW_COMMENT
      }
      const walker = renderer.document.createTreeWalker(element, filter, { acceptNode: () => renderer.window.NodeFilter.FILTER_ACCEPT })
      const nodes = [element] as Node[]
      while (walker.nextNode()) {
        nodes.push(walker.currentNode)
      }

      // Cleanup filtered nodes
      nodes.forEach((node) => {
        // Cleanup directives comments
        if ((node.nodeType === renderer.window.Node.COMMENT_NODE) && (renderer.cache("*").has(node as Comment))) {
          ;(node as Comment).remove()
          cache.comments.delete(element)
        } // Cleanup directives attributes
        else if (node.nodeType === renderer.window.Node.ELEMENT_NODE) {
          renderer.directives.forEach((directive) => {
            renderer.getAttributes(node as HTMLElement, directive.name).forEach((attribute) => (node as HTMLElement).removeAttributeNode(attribute))
          })
          cache.directives.delete(element)
        }
      })
    }
    // Cleanup templates
    if (cache.templates.has(element)) {
      Array.from(element.querySelectorAll("template")).forEach((template) => template.remove())
      cache.templates.delete(element)
    }
  },
}

/** Default exports. */
export default _clean
