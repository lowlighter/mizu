// Imports
import type { Arg, Directive } from "@mizu/mizu/core/engine"
import { Context, Renderer } from "@mizu/mizu/core/engine"
import { Window } from "@mizu/mizu/core/vdom"
import { Mizu as Client } from "@mizu/mizu/core/render/client"
export type * from "@mizu/mizu/core/engine"

/**
 * Server side renderer.
 *
 * See {@link https://mizu.sh | mizu.sh documentation} for more details.
 * @module
 */
export class Server {
  /** Default directives. */
  static defaults = {
    directives: [
      ...Client.defaults.directives,
    ] as Array<Partial<Directive> | string>,
  }

  /** {@linkcode Server} constructor. */
  constructor({ directives = Server.defaults.directives, context = {} } = {} as { directives?: Arg<Renderer["load"]>; context?: ConstructorParameters<typeof Context>[0] }) {
    this.#options = { directives }
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
   * @example
   * ```ts
   * const mizu = new Server({ context: { foo: "bar" } })
   * await mizu.render(`<html><body><a ~test.text="foo"></a></body></html>`)
   * ```
   */
  async render(content: string | Arg<Renderer["render"]>, options?: Partial<Pick<Arg<Renderer["render"], 1, true>, "state" | "implicit" | "select"> & { context: Arg<Context["with"]> }>): Promise<string> {
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
