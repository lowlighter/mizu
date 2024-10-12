/**
 * Mizu server-side renderer.
 * @module
 */
import { Server } from "./server.ts"
export { Server as Mizu } from "./server.ts"
export type * from "./server.ts"

/** Default Mizu {@linkcode Server} instance. */
export default Server.default as Server
