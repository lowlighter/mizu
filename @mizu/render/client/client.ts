// Imports
import type { Arg, Directive, RendererOptions, RendererRenderOptions } from "@mizu/mizu/core/engine"
import { Context, Renderer } from "@mizu/mizu/core/engine"
import defaults from "./defaults.ts"
export type * from "@mizu/mizu/core/engine"

/**
 * Client side renderer.
 * @module
 */
export class Client {
  /** Default directives. */
  static defaults = {
    directives: defaults as Array<Partial<Directive> | string>,
  }

  /** {@linkcode Client} constructor. */
  // deno-lint-ignore no-console
  constructor({ directives = Client.defaults.directives, context = {}, window = globalThis.window, warn = console.warn } = {} as ClientOptions) {
    this.#renderer = new Renderer(window, { directives, warn })
    // deno-lint-ignore no-explicit-any
    this.#context = new Context<any>(context)
  }

  /** Linked {@linkcode Renderer}. */
  readonly #renderer

  /** Linked {@linkcode Context}. */
  readonly #context

  /**
   * Rendering context.
   *
   * All properties assigned to this object will be available during rendering.
   *
   * Changes on this object are reactive and will trigger a re-render on related elements.
   * This is done by using {@linkcode Context} which use {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy | Proxy} handlers under the hood.
   *
   * > [!NOTE]
   * > You cannot reassign this property directly to prevent accidental loss of reactivity.
   * > It is possible to obtain a similar effect by using {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign | Object.assign()} instead.
   */
  // deno-lint-ignore no-explicit-any
  get context(): Record<PropertyKey, any> {
    return this.#context.target
  }

  /**
   * Start rendering all subtrees marked with a {@link _mizu | `*mizu` attribute}.
   *
   * ```ts ignore
   * const mizu = new Client({ context: { foo: "bar" } })
   * await mizu.render()
   * ```
   */
  render<T extends Arg<Renderer["render"]>>(element = this.#renderer.document.documentElement as T, options?: ClientRenderOptions): Promise<T> {
    let context = this.#context
    if (options?.context) {
      context = context.with(options.context)
    }
    return this.#renderer.render(element, { implicit: false, reactive: true, ...options, context, state: { $renderer: "client", ...options?.state } })
  }

  /** Flush the reactive render queue of {@linkcode Renderer}.  */
  flush(): Promise<void> {
    return this.#renderer.flushReactiveRenderQueue()
  }

  /** Default {@linkcode Client} instance. */
  static readonly default = new Client() as Client
}

/** {@linkcode Client} options. */
export type ClientOptions = Pick<RendererOptions, "directives" | "warn"> & {
  /**
   * Initial rendering {@linkcode Context}.
   *
   * It can be modified later using the {@linkcode Client.context} property.
   */
  context?: ConstructorParameters<typeof Context>[0]
  /** Window object. */
  window?: Renderer["window"]
}

/** {@linkcode Client.render} options. */
export type ClientRenderOptions = Pick<RendererRenderOptions, "implicit" | "reactive" | "throw"> & {
  /**
   * Rendering context.
   *
   * Values from {@linkcode Client.context} are inherited.
   */
  context?: Arg<Context["with"]>
  /**
   * Initial state.
   *
   * It is populated with `$renderer: "client"` by default.
   */
  state?: Arg<Renderer["render"], 1, true>["state"]
}
