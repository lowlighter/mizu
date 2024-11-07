// Imports
import type { Arg, Directive, Promisable, RendererOptions, RendererRenderOptions } from "@mizu/internal/engine"
import type { Buffer } from "@node/buffer"
import type { CallbackSource, GlobSource, StringSource, URLSource } from "./generate.ts"
import { Context, Renderer } from "@mizu/internal/engine"
import { Window } from "@mizu/internal/vdom"
import { mkdir, readFile as read, rmdir, stat, writeFile as write } from "@node/fs/promises"
import defaults from "./defaults.ts"
import { generate } from "./generate.ts"
export type * from "@mizu/internal/engine"
export type { CallbackSource, GlobSource, StringSource, URLSource } from "./generate.ts"

/**
 * Server side renderer.
 *
 * See {@link https://mizu.sh | mizu.sh documentation} for more details.
 * @module
 */
export class Server {
  /**
   * Default options for {@linkcode Server}.
   *
   * These default options are used when creating a new {@linkcode Server} instance if a property is not provided.
   */
  static defaults = {
    directives: defaults,
    context: {},
    generate: {
      output: "./output",
      clean: true,
      fs: { stat, mkdir, rmdir, read, write },
    },
    // deno-lint-ignore no-console
    warn: console.warn,
  } as unknown as Required<ServerOptions>

  /** {@linkcode Server} constructor. */
  constructor(options?: ServerOptions) {
    this.#options = { ...Server.defaults, ...options }
    this.#options.generate = { ...Server.defaults.generate, ...options?.generate }
    this.#options.generate.fs = { ...Server.defaults.generate.fs, ...options?.generate?.fs }
    // deno-lint-ignore no-explicit-any
    this.#context = new Context<any>(this.#options.context)
  }

  /** Options for {@linkcode Renderer} instantiation. */
  readonly #options

  /** Linked {@linkcode Context}. */
  #context

  /**
   * Default rendering context.
   *
   * All properties assigned to this object are accessible during rendering.
   */
  // deno-lint-ignore no-explicit-any
  get context(): Record<PropertyKey, any> {
    return this.#context.target
  }
  set context(context: Record<PropertyKey, unknown>) {
    this.#context = new Context(context)
  }

  /**
   * Parse an HTML string and render all subtrees marked with the `*mizu` attribute.
   *
   * ```ts
   * const mizu = new Server({ context: { foo: "bar" } })
   * await mizu.render(`<html><body><a ~test.text="foo"></a></body></html>`)
   * ```
   */
  async render(content: string | Arg<Renderer["render"]>, options?: ServerRenderOptions): Promise<string> {
    await using window = new Window(typeof content === "string" ? content : `<body>${content.outerHTML}</body>`)
    const { directives, warn, context: _context } = { ...this.#options, ...options }
    const renderer = await new Renderer(window, { directives, warn }).ready
    let context = this.#context
    if (_context) {
      context = context.with(_context)
    }
    return await renderer.render(renderer.document.documentElement, { implicit: true, ...options, context, state: { $renderer: "server", ...options?.state }, stringify: true })
  }

  /**
   * Generate static files from various sources.
   *
   * Options:
   * - `output`: Specify the path to the output directory.
   * - `clean`: Empty the `output` directory before generating files.
   *
   * Supported sources:
   * - {@linkcode StringSource}: Generate content from raw strings.
   * - {@linkcode GlobSource}: Generate content from local files matching the provided glob patterns.
   * - {@linkcode CallbackSource}: Generate content from callback returns.
   * - {@linkcode URLSource}: Generate content from fetched URLs.
   *
   * Each source can be templated using mizu rendering by passing a `render` option.
   *
   * ```ts
   * const mizu = new Server({ directives: ["@mizu/test"], generate: { output: "/fake/output" } })
   * await mizu.generate(
   *   [
   *     // Copy content from strings
   *     [ "<p>foo</p>", "string.html" ],
   *     [ "<p ~test.text='foo'></p>", "string_render.html", { render: { context: { foo: "bar" } } } ],
   *     // Copy content from local files
   *     [ "**\/*", "public", { directory: "/fake/static" } ],
   *     [ "*.html", "public", { directory: "/fake/partials", render: { context: { foo: "bar "} } } ],
   *     // Copy content from callback return
   *     [ () => JSON.stringify({ foo: "bar" }), "callback.json" ],
   *     [ () => `<p ~test.text="'foo'"></p>`, "callback.html", { render: { context: { foo: "bar" } } } ],
   *     // Copy content from URL
   *     [ new URL(`data:text/html,<p>foobar</p>`), "url.html" ],
   *     [ new URL(`data:text/html,<p ~test.text="foo"></p>`), "url_render.html", { render: { context: { foo: "bar" } } } ],
   *   ],
   *   // No-op: do not actually write files and directories
   *   { fs: { mkdir: () => null as any, write: () => null as any } },
   * )
   * ```
   */
  generate(sources: Array<StringSource | GlobSource | CallbackSource | URLSource>, options?: ServerGenerateOptions): Promise<void> {
    return generate(this, sources, { ...this.#options.generate, ...options, fs: { ...this.#options.generate.fs, ...options?.fs } } as Arg<typeof generate, 2>)
  }

  /** Default {@linkcode Server} instance. */
  static readonly default = new Server() as Server
}

/** {@linkcode Server} options. */
export type ServerOptions = Pick<RendererOptions, "warn"> & {
  /** Default directives. */
  directives?: Array<Partial<Directive> | string>
  /**
   * Initial rendering {@linkcode Context}.
   *
   * It can be modified later using the {@linkcode Client.context} property.
   */
  context?: ConstructorParameters<typeof Context>[0]
  /** Default {@linkcode Server.generate} options. */
  generate?: ServerGenerateOptions
}

/** {@linkcode Server.render} options. */
export type ServerRenderOptions = Pick<RendererRenderOptions, "implicit" | "select" | "throw"> & {
  /**
   * Rendering context.
   *
   * Values from {@linkcode Client.context} are inherited.
   */
  context?: Arg<Context["with"]>
  /**
   * Initial state.
   *
   * It is populated with `$renderer: "server"` by default.
   */
  state?: Arg<Renderer["render"], 1, true>["state"]
}

/** {@linkcode Server.generate} options. */
export type ServerGenerateOptions = {
  /** Output directory. */
  output?: string
  /** Clean output directory before generation. */
  clean?: boolean
  /** File system options. */
  fs?: Partial<ServerGenerateFileSystemOptions>
}

/** File system options. */
export type ServerGenerateFileSystemOptions = {
  /** Stat callback. */
  stat: (path: string) => Promise<unknown>
  /** Read callback. */
  read: (path: string) => Promise<Buffer>
  /** Write callback. */
  write: (path: string, data: Buffer) => Promisable<void>
  /** Make directory callback. */
  mkdir: (path: string, options?: { recursive?: boolean }) => Promisable<unknown>
  /** Remove directory callback. */
  rmdir: (path: string, options?: { recursive?: boolean }) => Promisable<unknown>
}
