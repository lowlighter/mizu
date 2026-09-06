// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*mizu` directive. */
export const _mizu = {
  name: "*mizu",
  phase: Phase.ELIGIBILITY,
  execute(_, element) {
    return { state: { $root: element } }
  },
} as const satisfies Directive<{
  Name: string
}>

/** `!ephemeral` marker. */
export const _ephemeral = {
  name: "!ephemeral",
  phase: Phase.ELIGIBILITY,
} as const satisfies Directive<{
  Name: string
}>

/** Default exports. */
export default _mizu
