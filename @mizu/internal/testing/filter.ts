// Imports
import type { Arg, Directive, Nullable, Renderer } from "../engine/mod.ts"
import { format } from "./format.ts"

/**
 * Recursively filters an {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Element | Element} and its subtree and returns the {@linkcode https://developer.mozilla.org/docs/Web/API/Element/innerHTML | Element.innerHTML}.
 *
 * This function can be used to compare two HTML documents.
 *
 * Elements with a `filter-remove` attribute are filtered out.
 *
 * ```ts
 * import { expect } from "@libs/testing"
 * import { Window } from "@mizu/internal/vdom"
 * import { Renderer } from "@mizu/internal/engine"
 * const renderer = await new Renderer(new Window()).ready
 *
 * await using a = new Window(`<a>foo</a>`)
 * await using b = new Window(`<a>foo</a>`)
 * expect(filter(renderer, a.document.documentElement)).toBe(filter(renderer, b.document.documentElement))
 * ```
 */
export function filter(renderer: Renderer, node: Nullable<Element>, { format: _format = true, comments = true, directives = ["*warn", "*id"], clean = "" } = {} as FilterOptions): string {
  if (!node) {
    return ""
  }
  let html = _filter(renderer, node.cloneNode(true) as Element, { comments, directives, clean }).innerHTML
  if (_format) {
    html = format(html)
  }
  return html.trim()
}

/** {@linkcode filter()} options. */
export type FilterOptions = {
  /** Whether to format the output. */
  format?: boolean
  /** Whether to include comments. */
  comments?: boolean
  /** Directives to keep. */
  directives?: Array<Directive["name"]>
  /** Pattern used to clean attributes. */
  clean?: string
}

/** Called by {@linkcode filter()}. */
function _filter(renderer: Renderer, node: Element, { comments, directives, clean } = {} as Arg<typeof filter, 2, true>): Element {
  // Remove comments if asked
  if ((node.nodeType === renderer.window.Node.COMMENT_NODE) && (!comments)) {
    node.remove()
    return node
  }
  // Clean attributes if asked
  if ((node.nodeType === renderer.window.Node.ELEMENT_NODE) && clean) {
    const pattern = new RegExp(clean)
    Array.from(node.attributes).forEach((attribute) => pattern.test(attribute.name) && node.removeAttribute(attribute.name))
  }
  // Patch `style` attribute to be consistent with `deno fmt`
  if ((node.nodeType === renderer.window.Node.ELEMENT_NODE) && (node.hasAttribute("style")) && (!node.getAttribute("style")!.endsWith(";"))) {
    node.setAttribute("style", `${node.getAttribute("style")};`)
  }
  // Remove directives if asked
  if ((node.nodeType === renderer.window.Node.ELEMENT_NODE) && (Array.isArray(directives)) && (!directives.includes("*"))) {
    renderer.directives.forEach((directive) => {
      if (directives.includes(`${directive.name}`)) {
        return
      }
      renderer.getAttributes(node as HTMLElement, directive.name).forEach((attribute) => {
        node.removeAttribute(attribute.name)
      })
    })
  }
  // Remove node if asked
  if ((node.nodeType === renderer.window.Node.ELEMENT_NODE) && (node.hasAttribute("filter-remove"))) {
    node.remove()
  }
  // Recurse
  Array.from(node.childNodes).forEach((child) => _filter(renderer, child as Element, arguments[2]))
  return node
}
