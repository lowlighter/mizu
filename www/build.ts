// Imports
import Mizu from "@mizu/render/server"
import { html, js } from "./tools.ts"
import serve from "./serve.ts"
import { fromFileUrl, join } from "@std/path"

await using _ = Deno.serve({ port: Number(new URL(globalThis.location.href).port) }, serve.fetch)

await Mizu.generate([
  [() => html("index"), "index.html", { render: {} }],
  [() => html("build"), "build.html", { render: {} }],
  [() => html("playground"), "playground.html", { render: {} }],
  [() => html("community"), "community.html", { render: {} }],
  [() => js("@mizu/render/client", { format: "iife" }), "client.js"],
  [() => js("@mizu/render/client", { format: "esm" }), "client.mjs"],
  [new URL("/matcha.css", globalThis.location.href), "matcha.css"],
  [new URL("/highlight.js", globalThis.location.href), "highlight.js"],
  ["*.{svg,css,png,js}", ".", { directory: fromFileUrl(import.meta.resolve("./static")) }],
], { output: join(Deno.cwd(), "www/.pages") })
