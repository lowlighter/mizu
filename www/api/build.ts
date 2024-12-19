// Imports
import { STATUS_CODE as Status, STATUS_TEXT as StatusText } from "@std/http"
import { banner as _banner, js, meta } from "@www/tools.ts"

/** API: Minify css */
export default async function (request: Request) {
  const headers = new Headers()
  const allowed = (Deno.env.get("ALLOWED_HOSTS") || "localhost").split(",").map((host) => new URL(`https://${host}`).hostname)
  if (Deno.env.has("DENO_DEPLOYMENT_ID")) {
    headers.set("x-deno-deployment-id", Deno.env.get("DENO_DEPLOYMENT_ID")!)
    allowed.push(new URL(`https://mizu-${Deno.env.get("DENO_DEPLOYMENT_ID")}.deno.dev`).hostname)
  }
  if (request.method !== "POST") {
    return new Response(StatusText[Status.MethodNotAllowed], { status: Status.MethodNotAllowed, headers })
  }
  if ((request.headers.has("Origin")) && (allowed.includes(new URL(request.headers.get("Origin")!).hostname))) {
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST")
    headers.set("Access-Control-Allow-Headers", "Content-Type")
  } else {
    return new Response(`Visit "${request.headers.get("Origin") ?? "https://mizu.sh"}/build" to download a custom build`, { status: Status.Forbidden, headers })
  }
  try {
    const options = await request.json()
    const bundled = await js("@mizu/render/client", {
      builder: Deno.build.os === "windows" ? "binary" : "wasm",
      lockfile: new URL(import.meta.resolve("../../deno.lock")),
      banner: _banner.replace(`${meta.name} — ${meta.version}\n`, `${meta.name} — ${meta.version} — Custom build (${new Date().toDateString()})\n`),
      minify: options.minify === true ? "terser" : false,
      standalone: options.standalone,
      format: ["iife", "esm"].includes(options.format) ? options.format : throws("format: must be 'iife' or 'esm'"),
      raw: {
        define: {
          "globalThis.MIZU_CUSTOM_DEFAULTS_CONTEXT": options.context ? options.context : "null",
          "globalThis.MIZU_CUSTOM_DEFAULTS_WARN": options.console?.includes("warn") ? "console.warn" : "false",
          "globalThis.MIZU_CUSTOM_DEFAULTS_DEBUG": options.console?.includes("debug") ? "console.debug" : "false",
        },
      },
      overrides: {
        imports: {
          "./defaults.ts": Array.isArray(options.directives) && options.directives.every((name) => typeof name === "string")
            ? `data:text/javascript;base64,${
              btoa(
                `
            import _mizu from "@mizu/mizu"
            ${options.directives.map((name: string, i: number) => `import _${i} from "@mizu/${name}"`).join("\n")}
            export default [${options.directives.map((_: string, i: number) => `_${i}`).join(", ")}].flat(Infinity)
          `.split("\n").map((line) => line.trim()).filter(Boolean).join("\n"),
              )
            }`
            : throws("directives: must be an array of string"),
        },
      },
    })
    headers.set("content-type", "application/javascript; charset=utf-8")
    return new Response(bundled, { headers })
  } catch (error) {
    if (error instanceof TypeError) {
      return new Response(error.message, { status: Status.BadRequest, headers })
    }
    return new Response(error.message, { status: Status.InternalServerError, headers })
  }
}

/** Throws a `TypeError` with the provided message. */
function throws(message: string): never {
  throw new TypeError(message)
}
