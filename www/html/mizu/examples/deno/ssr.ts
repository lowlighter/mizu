#!/usr/bin/env -S deno serve --allow-read --allow-env
// Server-Side Rendering (SSR) with Mizu
// deno-lint-ignore no-external-import
import Mizu from "jsr:@mizu/render/server"

export default {
  async fetch() {
    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" })
    const body = await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } })
    return new Response(body, { headers })
  },
}
