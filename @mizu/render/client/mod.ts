/**
 * Mizu client-side renderer.
 * @module
 */
import { Client } from "./client.ts"
export { Client as Mizu } from "./client.ts"
export type * from "./client.ts"

/** Default Mizu {@linkcode Client} instance. */
export default Client.default as Client
