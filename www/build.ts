// Imports
import Mizu from "@mizu/render/static"
import { default as serve, html } from "./serve.ts"
import { fromFileUrl, join } from "@std/path"

await using _ = Deno.serve({ port: Number(new URL(globalThis.location.href).port) }, serve.fetch)

await Mizu.generate([
  { source: () => html("index"), destination: "index.html", render: {} },
  { source: () => html("build"), destination: "build.html", render: {} },
  { source: () => html("playground"), destination: "playground.html", render: {} },
  { source: new URL("/matcha.css", globalThis.location.href), destination: "matcha.css" },
  { source: new URL("/highlight.js", globalThis.location.href), destination: "highlight.js" },
  { source: "*.{svg,css,png,js}", directory: fromFileUrl(import.meta.resolve("./static")), destination: "." },
], { output: join(Deno.cwd(), ".pages") })
