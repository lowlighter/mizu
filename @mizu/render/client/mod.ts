/**
 * Mizu client-side renderer.
 * @module
 */
import { Client } from "./client.ts"
export { Client as Mizu } from "./client.ts"
export type * from "./client.ts"

/** Default Mizu {@linkcode Client} instance. */
export default Client.default as Client

// Start the client-side renderer if this module is the main entry point
if (import.meta.main) {
  Client.default.render()
}
