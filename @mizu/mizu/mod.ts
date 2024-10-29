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
} as Directive & { name: string }

/** Default exports. */
export default _mizu
