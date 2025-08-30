// Imports
import { type Directive, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** `*_noop` directive. */
export const _noop = {
  name: "*noop",
  phase: Phase.TESTING,
  multiple: true,
} as const satisfies Directive

/** Default exports. */
export default _noop
