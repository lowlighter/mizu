// Imports
import { type Directive, type Nullable, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*if` cache. */
export type IfCache = { templates: WeakMap<Comment, { nodes: Node[]; attached: boolean }>; generated: WeakMap<Node, Comment> }

/**
 * `*if` directive.
 *
 * @internal `_directive.value` Force the directive to use specified value rather than the attribute value.
 * @internal `_directive.expression` Set the original expression for the directive if element is commented out.
 * @internal `_directive.directive` Set the original directive name for the directive if element is commented out.
 */
export const _if = {
  name: "*if",
  phase: Phase.TOGGLE,
  init(renderer) {
    renderer.cache<IfCache>(this.name, { templates: new WeakMap(), generated: new WeakMap() })
  },
  async execute(renderer, element, { attributes: [attribute], context, state }) {
    const result = Boolean(await renderer.evaluate(element, arguments[2]._directive?.value ?? attribute.value, { context, state }))
    // Templates are kept commented out and their content is inserted after the comment when truthy
    const template = (renderer.isComment(element) ? renderer.cache("*").get(element) : element) as Nullable<HTMLElement>
    if (template?.tagName === "TEMPLATE") {
      const cache = renderer.cache<IfCache>("*if") ?? renderer.cache<IfCache>("*if", { templates: new WeakMap(), generated: new WeakMap() })
      let comment = element as Comment
      if (!renderer.isComment(element)) {
        comment = renderer.comment(element, { expression: attribute.value, directive: _if.name, ...arguments[2]._directive })
      }
      if (!cache.templates.has(comment)) {
        const nodes = Array.from((template as HTMLTemplateElement).content.cloneNode(true).childNodes)
        nodes.forEach((node) => cache.generated.set(node, comment))
        cache.templates.set(comment, { nodes, attached: false })
      }
      const cached = cache.templates.get(comment)!
      if (result) {
        let position = comment as Node
        for (const node of cached.nodes) {
          const current = renderer.getComment(node as HTMLElement) ?? node
          if (!cached.attached) {
            comment.parentNode?.insertBefore(current, position.nextSibling)
          }
          position = current
          if (current.nodeType !== renderer.window.Node.TEXT_NODE) {
            await renderer.render(current as HTMLElement, { context, state })
          }
        }
        cached.attached = true
      } else if (cached.attached) {
        cached.nodes.forEach((node) => ((renderer.getComment(node as HTMLElement) ?? node) as ChildNode).remove())
        cached.attached = false
      }
      return (comment !== element) ? { element: comment, final: true } : { final: true }
    }
    switch (true) {
      // Switch comment to element if truthy
      case result && (renderer.isComment(element)) && (renderer.cache("*").has(element)): {
        const original = renderer.uncomment(element)
        return { element: original }
      }
      // Switch element to comment if falsy
      case (!result) && (renderer.isHtmlElement(element)): {
        const comment = renderer.comment(element, { expression: attribute.value, directive: _if.name, ...arguments[2]._directive })
        return { element: comment, final: true }
      }
    }
  },
} as const satisfies Directive<{
  Cache: IfCache
}>

/** Default exports. */
export default _if
