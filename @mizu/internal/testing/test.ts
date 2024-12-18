// Imports
import type { testing } from "@libs/testing"
import type { Arg, Nullable, VirtualWindow } from "../engine/mod.ts"
import { delay, retry } from "@std/async"
import { unescape } from "@std/html"
import { bgMagenta } from "@std/fmt/colors"
import { expect as _expect, fn, Status, test as _test } from "@libs/testing"
import { AsyncFunction } from "@libs/typing/func"
import { Context } from "@libs/reactive"
import { fromFileUrl } from "@std/path"
import { Window } from "../vdom/mod.ts"
import { Renderer } from "../engine/mod.ts"
import { filter } from "./filter.ts"
// deno-lint-ignore no-external-import
import { readFileSync } from "node:fs"
// deno-lint-ignore no-external-import
import { createServer } from "node:http"

/**
 * Test a HTML file with the specified test cases.
 *
 * This runner is intended to test directives in a more convenient way.
 *
 * ```ts ignore
 * await test(import.meta.resolve("./operations_test.html"))
 * ```
 */
export function test(path: string | ImportMeta, runner = _test) {
  if (typeof path === "object") {
    path = readFileSync(fromFileUrl(path.resolve("./mod_test.html")), "utf-8")
  } else if (path.startsWith("file://")) {
    path = readFileSync(fromFileUrl(path), "utf-8")
  }
  const window = new Window(path)
  window.document.querySelectorAll("body > test").forEach((testcase: testing) => {
    const test = testcase.hasAttribute("skip") ? runner.skip : testcase.hasAttribute("only") ? runner.only : runner
    test(`${testcase.getAttribute("name") ?? ""}`.replace(/^\[(.*?)\]/, (_, name) => bgMagenta(` ${name} `)), async () => {
      const testing = {
        renderer: await new Renderer(new Window(), { directives: [] }).ready,
        rendered: null,
        renderable: "",
        error: null,
        directives: [],
        context: new Context({
          fetch() {
            let url = arguments[0]
            if (!URL.canParse(url)) {
              const { address: hostname, port } = testing.http.server?.address() as { address: string; port: number }
              url = `http://${hostname.replace("0.0.0.0", "127.0.0.1")}:${port}${arguments[0]}`
            }
            return fetch(url, ...Array.from(arguments).slice(1))
          },
        }),
        storage: {},
        http: { server: null, request: null, response: null },
      } as Testing
      try {
        if (window.document.querySelector("body > load")) {
          await load(window.document.querySelector("body > load") as HTMLElement, testing)
        }
        for (const operation of testcase.children) {
          switch (operation.tagName.toLowerCase()) {
            case "load":
              await load(operation, testing)
              break
            case "render":
              await render(operation, testing)
              break
            case "script":
              await script(operation, testing)
              break
            case "expect":
              await expect(operation, testing)
              break
            case "http-server":
              await http(operation, testing)
              break
          }
        }
      } finally {
        await testing.http.server?.close()
      }
    }, { permissions: { net: ["localhost", "0.0.0.0", "127.0.0.1"] } })
  })
}

/**
 * Load the specified directives.
 *
 * Multiple directives can be specified by separating them with a comma.
 *
 * ```xml
 * <load directives="@mizu/test"></load>
 * <render>
 *   <!-- ... -->
 * </render>
 * ```
 */
async function load(operation: HTMLElement, testing: Testing) {
  if (operation.hasAttribute("directives")) {
    testing.directives = operation.getAttribute("directives")!.split(",").map((directive) => directive.trim())
  }
  await testing.renderer.load(testing.directives)
}

/**
 * Render the specified content using {@linkcode Renderer.render()}.
 *
 * The same {@linkcode Renderer} instance is reused unless the operation tag is not empty.
 * If it is empty, a re-render is performed instead with the last {@linkcode Testing.renderable} content.
 *
 * Options:
 *   - `explicit?: boolean = false`: Whether {@linkcode Renderer.render()} should be called with the `implicit: false`.
 *   - `throw?: boolean = false`: Whether {@linkcode Renderer.render()} should be called with the `throw: true`.
 *
 * ```xml
 * <render>
 *  <div>...</div>
 * </render>
 * ```
 *
 * ```xml
 * <render></render>
 * ```
 */
async function render(operation: HTMLElement, testing: Testing) {
  if (operation.childNodes.length) {
    testing.renderable = operation.innerHTML
    testing.renderer = await new Renderer(new Window(`<body>${testing.renderable}</body>`), { directives: testing.directives }).ready
  }
  try {
    testing.error = null
    testing.rendered = await testing.renderer.render(testing.renderer.document.documentElement, { context: testing.context, select: "body", implicit: !operation.hasAttribute("explicit"), throw: operation.hasAttribute("throw") }) as HTMLElement
  } catch (error) {
    testing.error = error
  }
}

/**
 * Evaluate the specified script.
 *
 * See actual source code for a list of globally available variables.
 *
 * ```xml
 * <script>
 *   expect(document.querySelector("input").value).toBe("foo")
 * </script>
 * ```
 */
async function script(operation: HTMLElement, testing: Testing) {
  const args = {
    testing,
    rendered: testing.rendered,
    window: testing.renderer.window,
    document: testing.renderer.document,
    context: testing.context.target,
    storage: testing.storage,
    http: {
      get request() {
        return testing.http.request
      },
      get response() {
        return testing.http.response
      },
    },
    Node: testing.renderer.window.Node,
    HTMLElement: testing.renderer.window.HTMLElement,
    Event: testing.renderer.window.Event,
    NodeFilter: testing.renderer.window.NodeFilter,
    KeyboardEvent: testing.renderer.window.KeyboardEvent,
    MouseEvent: testing.renderer.window.MouseEvent,
    expect: _expect,
    fn,
    delay,
    retry,
    fetch: testing.context.target.fetch,
    Status,
    rerender: () => testing.renderer.render(testing.renderer.document.documentElement, { context: testing.context, select: "body", implicit: true, throw: true }),
  } as unknown as VirtualWindow
  const script = new AsyncFunction(...Object.keys(args), operation.innerHTML)
  await _expect(script(...Object.values(args))).resolves.not.toThrow()
}

/**
 * Compare current {@linkcode Testing.rendered} content against the specified content.
 *
 * Options:
 *  - `comments?: string`: Whether to preserve comments.
 *  - `format?: string`: Whether to preserve formatting.
 *  - `directive?: string`: A list of directives attributes to preserve.
 *  - `clean?: string`: A list of attributes to clean.
 *
 * See {@linkcode filter()} for more details about options.
 *
 * ```xml
 * <render>
 *  <!-- ... -->
 *  <div>...</div>
 * </render>
 * <expect comments="false">
 *   <div>...</div>
 * </expect>
 * ```
 */
async function expect(operation: HTMLElement, testing: Testing) {
  const options = {} as Arg<typeof filter, 2, true>
  if (operation.getAttribute("comments") === "false") {
    options.comments = false
  }
  if (operation.getAttribute("format") === "false") {
    options.format = false
  }
  if (operation.hasAttribute("directives")) {
    options.directives = operation.getAttribute("directives")!.split(",").map((directive) => directive.trim())
  }
  if (operation.hasAttribute("clean")) {
    options.clean = operation.getAttribute("clean")!
  }
  _expect(filter(testing.renderer, testing.rendered, options)).toBe(filter(testing.renderer, operation, options))
  return await Promise.resolve()
}

/**
 * Spawn a local HTTP server that can be used to test HTTP requests.
 *
 * The server is automatically shutdown after the test case is finished.
 *
 * Options:
 *   - `path?: string = "/"`: The {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname | URL.pathname} to match.
 *   - `status?: string = "200"`: The {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | HTTP status code} to return.
 *   - `redirect?: string`: The {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections | HTTP redirect} to perform (status code is always set to {@linkcode Status.TemporaryRedirect}).
 *   - `escaped?: boolean`: Whether specified content is escaped and should be unescaped.
 *
 * Exposes:
 *   - {@linkcode Testing.http.request}
 *   - {@linkcode Testing.http.response}
 *
 * ```xml
 * <http-server>
 *   <response path="/foo" status="200"></response>
 *   <response path="/bar" redirect="/foo"></response>
 *   <response path="/baz" status="OK" escaped>&lt;?xml version="1.0" encoding="UTF-8"?&gt;</response>
 * </http-server>
 * <!-- ... -->
 * <script>
 *   expect(http.request).toBeInstanceOf(Request)
 *   expect(http.response).toBeInstanceOf(Response)
 * </script>
 * ```
 */
async function http(operation: HTMLElement, testing: Testing) {
  const { promise, resolve } = Promise.withResolvers<void>()
  testing.http.server = createServer(async (incoming, outgoing) => {
    // Parse incoming message into web standards objects
    const headers = new Headers(incoming.headers as HeadersInit)
    const url = new URL(incoming.url!, `http://${headers.get("host")}`)
    const body = await new Promise<string>((resolve) => {
      let content = ""
      if (Number(headers.get("content-length"))) {
        incoming.on("data", (chunk) => content += chunk)
        incoming.on("end", () => resolve(content))
      } else {
        resolve(content)
      }
    })
    testing.http.request = Object.assign(new Request(url.href, { method: incoming.method, headers, body: !["GET", "HEAD"].includes(`${incoming.method}`) ? body : null }), { received: { body, headers } })
    testing.http.response = new Response(null, { status: Status.NotFound })
    // Route incoming message
    for (const route of Array.from(operation.querySelectorAll("response"))) {
      if ((route.getAttribute("path") ?? "/") === url.pathname) {
        const status = Status[route.getAttribute("status") as keyof typeof Status] || Number(route.getAttribute("status")) || Status.OK
        if (route.hasAttribute("redirect")) {
          testing.http.response = Response.redirect(new URL(route.getAttribute("redirect")!, url.origin).href, Status.TemporaryRedirect)
        } else {
          let content = route.innerHTML
          if (route.hasAttribute("escaped")) {
            content = unescape(content)
          }
          testing.http.response = new Response(content, { status })
        }
        break
      }
    }
    // Send outgoing message
    outgoing.writeHead(testing.http.response.status, Object.fromEntries(testing.http.response.headers.entries()))
    outgoing.end(await testing.http.response.text())
  })
  // Start server and update global location
  testing.http.server.listen(0, "0.0.0.0", () => {
    const { address: hostname, port } = testing.http.server?.address() as { address: string; port: number }
    globalThis.location = Object.assign(new URL(`http://${hostname.replace("0.0.0.0", "127.0.0.1")}:${port}`), {
      ancestorOrigins: testing.renderer.window.location.ancestorOrigins,
      assign: testing.renderer.window.location.assign,
      replace: testing.renderer.window.location.replace,
      reload: testing.renderer.window.location.reload,
    }) as unknown as typeof globalThis.location
    resolve()
  })
  return await promise
}

/** Testing context. */
export type Testing = {
  /** {@linkcode Renderer} instance. */
  renderer: Renderer
  /** Rendered content. */
  rendered: Nullable<HTMLElement>
  /** Renderable {@linkcode https://developer.mozilla.org/docs/Web/API/Element/innerHTML | Element.innerHTML}, set to the last value of {@linkcode render()}. */
  renderable: string
  /** `Error` thrown by the last execution of {@linkcode render()}. */
  error: Nullable<Error>
  /** List of loaded directives. */
  directives: Arg<Renderer["load"]>
  /** Current {@linkcode Context}. */
  context: Context
  /** Shared storage that can be used across different operations. */
  storage: Record<PropertyKey, unknown>
  /** HTTP testing. */
  http: {
    /** Local HTTP server. */
    server: Nullable<ReturnType<typeof createServer>>
    /** Last received `Request` with additional parsed properties for easier testing. */
    request: Nullable<Request & { received: { body: string; headers: Headers } }>
    /** Last returned `Response`. */
    response: Nullable<Response>
  }
}
