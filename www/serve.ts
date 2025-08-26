// Imports
import type { callback } from "@libs/typing"
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path"
import { route } from "@std/http/unstable-route"
import { accepts } from "@std/http"
import { serveDir } from "@std/http/unstable-file-server"
import { toSnakeCase } from "@std/text"
import { Phase } from "@mizu/internal/engine"
import { Mizu as RenderClient } from "@mizu/render/client"
import { Mizu as RenderServer } from "@mizu/render/server"
import { docs, html, js } from "@www/tools.ts"
import apiBuild from "@www/api/build.ts"

/** Is in production ? */
const production = Boolean(Deno.env.get("DENO_DEPLOYMENT_ID"))

/** Serve files */
const handler = {
  fetch: production
    ? route([
      {
        pattern: new URLPattern({ pathname: "/api/build" }),
        handler: apiBuild,
        method: "POST",
      },
    ], (request) => serveDir(new Request(request.url.replace(/\.html$/, ""), request), { quiet: true, fsRoot: fromFileUrl(import.meta.resolve("./.pages")), cleanUrls: true }))
    : route([
      {
        pattern: new URLPattern({ pathname: "/{index.html}?" }),
        handler: async () => new Response(await html("index"), { headers: { "Content-Type": "text/html" } }),
      },
      {
        pattern: new URLPattern({ pathname: "/:page(index|build|playground|community)" }),
        handler: async (_, params) => new Response(await html(params?.pathname.groups.page!), { headers: { "Content-Type": "text/html" } }),
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
        pattern: new URLPattern({ pathname: "/api/build" }),
        handler: apiBuild,
        method: "POST",
      },
      {
        pattern: new URLPattern({ pathname: "/about/api/render/:export" }),
        handler: async (_, params) => {
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
        handler: async (request, params) => {
          const url = new URL(request.url)
          const name = params?.pathname.groups.name!
          const path = dirname(fromFileUrl(import.meta.resolve(`@mizu/${name}`)))
          const headers = new Headers()
          const requested = accepts(request, "text/html", "application/json")
          if (requested === "application/json") {
            headers.set("content-type", "application/json; charset=utf-8")
            try {
              const {
                // Match: _name_directive
                [`_${toSnakeCase(url.searchParams.get("name") ?? name)}`]: _a,
                // Match: _directive
                [`_${toSnakeCase(url.searchParams.get("name") ?? name)}`.replace(`_${name.split("/")[0]}_`, "_")]: _b,
                // Fallback to first export
                ..._c
              } = await import(Deno.build.os === "windows" ? toFileUrl(join(path, "mod.ts")).href : join(path, "mod.ts"))
              const directive = _a ?? _b ?? [_c].flat()[0]
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
export default handler
