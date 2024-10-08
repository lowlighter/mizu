// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*ref` typings. */
export const typings = {
  modifiers: {
    raw: { type: Boolean, enforce: true },
  },
} as const

/** `*ref` directive. */
export const _ref = {
  name: "*ref",
  phase: Phase.REFERENCE,
  typings,
  setup(_, __, { state }) {
    if (!state.$refs) {
      return { state: { $refs: {} } }
    }
  },
  async execute(renderer, element, { attributes: [attribute], state, ...options }) {
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    const name = parsed.modifiers.raw ? attribute.value : await renderer.evaluate(element, attribute.value, { state, ...options })
    return { state: { $refs: { ...state.$refs as Record<PropertyKey, unknown>, [`${name}`]: element } } }
  },
} as Directive<null, typeof typings>

/** Default exports. */
export default _ref
