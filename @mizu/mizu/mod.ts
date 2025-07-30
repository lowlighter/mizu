// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*mizu` directive. */
export const _mizu: Directive<{
  Name: string
}> = {
  name: "*mizu",
  phase: Phase.ELIGIBILITY,
  execute(this: typeof _mizu, _, element) {
    return { state: { $root: element } }
  },
}

/** Default exports. */
export default _mizu
