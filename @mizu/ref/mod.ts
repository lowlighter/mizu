// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*ref` typings. */
export const typings = {
  modifiers: {
    raw: { type: Boolean, enforce: true },
  },
} as const

/** `*ref` directive. */
export const _ref: Directive<{
  Typings: typeof typings
}> = {
  name: "*ref",
  phase: Phase.REFERENCE,
  typings,
  setup(this: typeof _ref, _, __, { state }) {
    if (!state.$refs) {
      return { state: { $refs: {} } }
    }
  },
  async execute(this: typeof _ref, renderer, element, { attributes: [attribute], state, ...options }) {
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    const name = parsed.modifiers.raw ? attribute.value : await renderer.evaluate(element, attribute.value, { state, ...options })
    return { state: { $refs: { ...state.$refs as Record<PropertyKey, unknown>, [`${name}`]: element } } }
  },
}

/** Default exports. */
export default _ref
