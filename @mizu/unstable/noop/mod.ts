// Imports
import { type Directive, Phase } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*_noop` directive. */
export const _noop = {
  name: "*noop",
  phase: Phase.TESTING,
  multiple: true,
} as Directive

/** Default exports. */
export default _noop
