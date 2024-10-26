// Imports
import Mizu from "@mizu/render/static"
import { default as serve, html, js } from "./serve.ts"
import { fromFileUrl, join } from "@std/path"

await using _ = Deno.serve({ port: Number(new URL(globalThis.location.href).port) }, serve.fetch)

await Mizu.generate([
  { source: () => html("index"), destination: "index.html", render: {} },
  { source: () => html("build"), destination: "build.html", render: {} },
  { source: () => html("playground"), destination: "playground.html", render: {} },
  { source: () => js("@mizu/render/client", { format: "iife" }), destination: "client.js" },
  { source: () => js("@mizu/render/client", { format: "esm" }), destination: "client.mjs" },
  // { source: () => js("@mizu/render/server", { server: true }), destination: "server.mjs" },
  // { source: () => js("@mizu/render/static", { server: true }), destination: "static.mjs" },
  { source: new URL("/matcha.css", globalThis.location.href), destination: "matcha.css" },
  { source: new URL("/highlight.js", globalThis.location.href), destination: "highlight.js" },
  { source: "*.{svg,css,png,js}", directory: fromFileUrl(import.meta.resolve("./static")), destination: "." },
], { output: join(Deno.cwd(), ".pages") })
