// deno-lint-ignore-file no-console
// Server-Side Rendering (SSR) with Mizu
import Mizu from "@mizu/render/server"
// @ts-expect-error: bun
Bun.serve({
  port: 8000,
  async fetch() {
    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" })
    const body = await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } })
    return new Response(body, { headers })
  },
})

console.log("Server is listening")
