// Imports
import { type Arg, type Cache, type Directive, type Nullable, Phase } from "@mizu/render/engine"
import { Expression } from "./parse.ts"
export type * from "@mizu/render/engine"

/** `*for` directive. */
export const _for = {
  name: "*for",
  phase: Phase.EXPAND,
  init(renderer) {
    renderer.cache<Cache<typeof _for>>(this.name, new WeakMap())
  },
  setup(renderer, element, { cache, state }) {
    if ((cache.get(element) === null) && (!state[renderer.internal("iterating")])) {
      return false
    }
  },
  async execute(renderer, element, { cache, context, state, attributes: [attribute] }) {
    // Compute iterations using the expression parser
    const iterations = [] as Record<PropertyKey, unknown>[]
    try {
      const loop = `()=>{for(${attribute.value}){${renderer.internal("iterations")}.push({${Expression.parse(attribute.value).join(",")}})}}`
      await renderer.evaluate(null, loop, { context, state: { ...state, [renderer.internal("iterations")]: iterations }, args: [] })
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        renderer.warn(`[${this.name}] error while evaluating expression: ${error}`, element)
        return { final: true }
      }
      // Fallback to iterable values
      try {
        const value = await renderer.evaluate(null, attribute.value, { context, state })
        if (typeof value === "number") {
          iterations.push(...Array.from({ length: value }, () => ({})))
        } else {
          iterations.push(...Object.entries(value as Arg<typeof Object.entries>).map(([$key, $value]) => ({ $key, $value })))
        }
      } catch {
        renderer.warn(`[${this.name}] syntax error in expression: ${attribute.value}`, element)
        return { final: true }
      }
    }

    // Comment out templated element
    let comment = element as unknown as Comment
    if (!renderer.isComment(element)) {
      comment = renderer.comment(element, { directive: this.name as string, expression: attribute.value })
      cache.set(comment, { element, items: new Map() })
    }
    const cached = cache.get(comment)!
    element = cached.element
    const identifiable = renderer.getAttributes(element, _id.name, { first: true })?.value

    // Generate items
    let position = comment as Comment | HTMLElement
    const generated = new Set<string>()
    const pending = []
    for (let i = 0; i < iterations.length; i++) {
      const iteration = context.with(iterations[i])
      const meta = { $i: i, $I: i + 1, $iterations: iterations.length, $first: i === 0, $last: i === iterations.length - 1 }
      const id = identifiable ? `${await renderer.evaluate(null, identifiable, { context: iteration, state: { ...state, ...meta } })}` : `${i}`
      generated.add(id)
      // Create item if non-existent
      if (!cached.items.has(id)) {
        const item = element.cloneNode(true) as HTMLElement
        item.removeAttributeNode(renderer.getAttributes(item, this.name, { first: true })!)
        cached.items.set(id, item)
        cache.set(item, null)
        if (identifiable) {
          renderer.setAttribute(item, _id.name, id)
        }
      }
      const item = cached.items.get(id)!
      // Handle commented out items
      if (renderer.getComment(item)) {
        renderer.uncomment(renderer.getComment(item)!)
      }
      // Insert item
      comment.parentNode?.insertBefore(item, position.nextSibling)
      position = item
      pending.push(await renderer.render(item, { context: iteration, state: { ...state, [renderer.internal("iterating")]: true, ...meta, $id: id } }))
    }
    await Promise.allSettled(pending)

    // Remove outdated items
    for (const [id, item] of cached.items) {
      if (!generated.has(id)) {
        cached.items.delete(id)
        item.remove()
      }
    }
    return { final: true }
  },
} as Directive<WeakMap<HTMLElement | Comment, Nullable<{ element: HTMLElement; items: Map<string, HTMLElement> }>>>

/** `*id` directive. */
export const _id = {
  name: "*id",
  phase: Phase.META,
} as Directive & { name: string }

/** Default exports. */
export default [_for, _id]
