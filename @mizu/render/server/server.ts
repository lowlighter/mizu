// Imports
import type { Arg, Directive, RendererOptions, RendererRenderOptions } from "@mizu/internal/engine"
import { Context, Renderer } from "@mizu/internal/engine"
import { Window } from "@mizu/internal/vdom"
import defaults from "./defaults.ts"
export type * from "@mizu/internal/engine"

/**
 * Server side renderer.
 *
 * See {@link https://mizu.sh | mizu.sh documentation} for more details.
 * @module
 */
export class Server {
  /** Default directives. */
  static defaults = {
    directives: defaults as Array<Partial<Directive> | string>,
  }

  /** {@linkcode Server} constructor. */
  constructor({ directives = Server.defaults.directives, context = {}, ...options } = {} as ServerOptions) {
    this.#options = { directives, ...options }
    // deno-lint-ignore no-explicit-any
    this.#context = new Context<any>(context)
  }

  /** Options for {@linkcode Renderer} instantiation. */
  readonly #options

  /** Linked {@linkcode Context}. */
  #context

  /**
   * Default rendering context.
   *
   * All properties assigned to this object will be available during rendering.
   */
  // deno-lint-ignore no-explicit-any
  get context(): Record<PropertyKey, any> {
    return this.#context.target
  }
  set context(context: Record<PropertyKey, unknown>) {
    this.#context = new Context(context)
  }

  /**
   * Parse a HTML string and render all subtrees marked with a `*mizu` attribute.
   *
   * ```ts
   * const mizu = new Server({ context: { foo: "bar" } })
   * await mizu.render(`<html><body><a ~test.text="foo"></a></body></html>`)
   * ```
   */
  async render(content: string | Arg<Renderer["render"]>, options?: ServerRenderOptions): Promise<string> {
    await using window = new Window(typeof content === "string" ? content : `<body>${content.outerHTML}</body>`)
    const renderer = await new Renderer(window, this.#options).ready
    let context = this.#context
    if (options?.context) {
      context = context.with(options.context)
    }
    return await renderer.render(renderer.document.documentElement, { implicit: true, ...options, context, state: { $renderer: "server", ...options?.state }, stringify: true })
  }

  /** Default {@linkcode Server} instance. */
  static readonly default = new Server() as Server
}

/** {@linkcode Server} options. */
export type ServerOptions = Pick<RendererOptions, "directives" | "warn"> & {
  /**
   * Initial rendering {@linkcode Context}.
   *
   * It can be modified later using the {@linkcode Client.context} property.
   */
  context?: ConstructorParameters<typeof Context>[0]
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
