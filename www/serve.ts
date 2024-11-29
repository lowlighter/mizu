// Imports
import type { callback } from "@libs/typing"
import { dirname, fromFileUrl, join } from "@std/path"
import { route } from "@std/http/unstable-route"
import { accepts, serveDir } from "@std/http"
import { toSnakeCase } from "@std/text"
import { Phase } from "@mizu/internal/engine"
import { Mizu as RenderClient } from "@mizu/render/client"
import { Mizu as RenderServer } from "@mizu/render/server"
import { docs, html, js } from "./tools.ts"

/** Serve files */
export default {
  fetch: route([
    {
      pattern: new URLPattern({ pathname: "/{index.html}?" }),
      handler: async () => new Response(await html("index"), { headers: { "Content-Type": "text/html" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/:page(index|build|playground|community)" }),
      handler: async (_, __, params) => new Response(await html(params?.pathname.groups.page!), { headers: { "Content-Type": "text/html" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/matcha.css" }),
      handler: () => fetch("https://matcha.mizu.sh/matcha.css"),
    },
    {
      pattern: new URLPattern({ pathname: "/highlight.js" }),
      handler: () => fetch("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"),
    },
    {
      pattern: new URLPattern({ pathname: "/coverage*" }),
      handler: (request) => serveDir(request, { quiet: true, urlRoot: "coverage", fsRoot: fromFileUrl(import.meta.resolve("../.pages/coverage")) }),
    },
    {
      pattern: new URLPattern({ pathname: "/client.js" }),
      handler: async () => new Response(await js("@mizu/render/client", { format: "iife" }), { headers: { "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/client.mjs" }),
      handler: async () => new Response(await js("@mizu/render/client", { format: "esm" }), { headers: { "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/about/api/render/:export" }),
      handler: async (_, __, params) => {
        const exported = params?.pathname.groups.export!
        return new Response(JSON.stringify(await docs(`@mizu/render/${exported}`, { kind: "class", name: `${exported.charAt(0).toLocaleUpperCase()}${exported.substring(1)}` })), { headers: { "content-type": "application/json; charset=utf-8" } })
      },
    },
    {
      pattern: new URLPattern({ pathname: "/about/api/internal/engine/directives" }),
      handler: async () => new Response(JSON.stringify(await docs(`@mizu/internal/engine`, { kind: "interface", name: "Directive" })), { headers: { "content-type": "application/json; charset=utf-8" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/about/api/internal/engine/renderer" }),
      handler: async () => new Response(JSON.stringify(await docs(`@mizu/internal/engine`, { kind: "class", name: "Renderer" })), { headers: { "content-type": "application/json; charset=utf-8" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/about/phases" }),
      handler: () => new Response(JSON.stringify(Object.fromEntries(Object.entries(Phase).filter(([_, value]) => Number.isFinite(value)))), { headers: { "content-type": "application/json; charset=utf-8" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/about/directives/:name*" }),
      handler: async (request, _, params) => {
        const url = new URL(request.url)
        const name = params?.pathname.groups.name!
        const path = dirname(fromFileUrl(import.meta.resolve(`@mizu/${name}`)))
        const headers = new Headers()
        const requested = accepts(request, "text/html", "application/json")
        if (requested === "application/json") {
          headers.set("content-type", "application/json; charset=utf-8")
          try {
            const { [`_${toSnakeCase(url.searchParams.get("name") ?? name)}`]: directive } = await import(join(path, "mod.ts"))
            const json = JSON.parse(JSON.stringify(directive))
            if (directive.name instanceof RegExp) {
              json.name = `/${directive.name.source}/`
            }
            if (directive.typings) {
              for (const [name, value] of Object.entries(directive.typings.modifiers ?? {})) {
                json.typings.modifiers[name].type = ((value as { type: callback }).type ?? String).name.toLowerCase()
                if (json.typings.modifiers[name].type === "date") {
                  json.typings.modifiers[name].type = "duration"
                }
              }
            }
            json.phase = { name: Phase[directive.phase], value: directive.phase }
            json.preset = []
            if (RenderClient.defaults.directives.includes(directive)) {
              json.preset.push("client")
            }
            if (RenderServer.defaults.directives.includes(directive)) {
              json.preset.push("server")
            }
            return new Response(JSON.stringify(json), { headers })
          } catch (error) {
            return new Response(JSON.stringify({ error: `${error}` }), { headers })
          }
        }
        headers.set("content-type", "text/html; charset=utf-8")
        try {
          return new Response(await Deno.readTextFile(join(path, "mod.html")), { headers })
        } catch (error) {
          return new Response(`${error}`, { headers })
        }
      },
    },
    {
      pattern: new URLPattern({ pathname: "/html/*" }),
      handler: (request) => serveDir(request, { quiet: true, urlRoot: "html", fsRoot: fromFileUrl(import.meta.resolve("./html")) }),
    },
  ], (request) => serveDir(request, { quiet: true, fsRoot: fromFileUrl(import.meta.resolve("./static")) })),
}
