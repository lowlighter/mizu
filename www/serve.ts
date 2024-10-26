// Imports
import type { Arg, callback } from "@libs/typing"
import { dirname, fromFileUrl, join } from "@std/path"
import { pick } from "@std/collections"
import { route } from "@std/http/route"
import { accepts, serveDir } from "@std/http"
import { toSnakeCase } from "@std/text"
import * as JSONC from "@std/jsonc"
import { Logger } from "@libs/logger"
import { bundle } from "@libs/bundle/ts"
import { Phase } from "@mizu/mizu/core/engine"
import Mizu from "@mizu/render/server"
const log = new Logger()

/** Base project url. */
const base = import.meta.resolve("../")

/** Root project path. */
const root = fromFileUrl(base)

/** Project metadata. */
const meta = {
  ...pick(await config("@mizu/mizu"), ["name", "version"]),
  ...pick(await config("."), ["homepage", "license", "author"]),
}
log.with({ root, base }).debug()
log.with(meta).info()

/** License banner. */
const banner = [
  `${meta.name} — ${meta.version}`,
  `Copyright © ${new Date().getFullYear()} ${meta.author}`,
  `${meta.license} license — ${meta.homepage}`,
].join("\n")

/** Parse `deno.jsonc` of specified package. */
function config(name: string, options: { parse: false }): URL
function config(name: string, options?: { parse: true }): Promise<Record<PropertyKey, unknown>>
function config(name: string, { parse = true } = {} as { parse?: boolean }) {
  const url = new URL(`./${name}/deno.jsonc`, base)
  if (parse) {
    return fetch(url.href).then((response) => response.text()).then((text) => JSONC.parse(text) as Record<PropertyKey, unknown>)
  }
  return url
}

/** Generate JS. */
export function js(exported: string, options?: Pick<NonNullable<Arg<typeof bundle, 1>>, "format"> & { server?: boolean }) {
  const name = exported.match(/^(?<name>@[a-z0-9][-a-z0-9]*[a-z0-9]\/[a-z0-9][-a-z0-9]*[a-z0-9]).*$/)?.groups?.name ?? exported
  const url = import.meta.resolve(exported)
  log.with({ name, url }).debug("bundling javascript")
  if (options?.server) {
    Object.assign(options, { external: ["node:canvas"] })
  }
  if (options?.format === "iife") {
    Object.assign(options, { raw: { define: { "import.meta.main": "true" } } })
  }
  return bundle(new URL(url), { ...options, banner })
}

/** Render HTML. */
export async function html(page: string) {
  Mizu.context = { page }
  log.with({ context: Mizu.context }).debug("rendering html")
  return Mizu.render(await fetch(import.meta.resolve("./html/index.html")).then((response) => response.text()))
}

/** Serve files */
export default {
  fetch: route([
    {
      pattern: new URLPattern({ pathname: "/{index.html}?" }),
      handler: async () => new Response(await html("index"), { headers: { "Content-Type": "text/html" } }),
    },
    {
      pattern: new URLPattern({ pathname: "/:page(index|build|playground)" }),
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
      pattern: new URLPattern({ pathname: "/server.js" }),
      handler: async () => new Response(await js("@mizu/render/server", { server: true }), { headers: { "Content-Type": "application/javascript; charset=utf-8" } }),
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
