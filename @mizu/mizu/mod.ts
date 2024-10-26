// Imports
import { type Directive, Phase } from "./core/engine/mod.ts"
export type * from "./core/engine/mod.ts"

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
