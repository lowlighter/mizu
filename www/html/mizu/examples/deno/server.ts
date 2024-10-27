#!/usr/bin/env -S deno serve --allow-read --allow-env
// deno-lint-ignore no-external-import
import Mizu from "jsr:@mizu/render/server"

const template = `<div *text="foo"></div>`
const context = { foo: "🌊 Yaa, mizu!" }

export default {
  async fetch() {
    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" })
    return new Response(await Mizu.render(template, { context }), { headers })
  },
}