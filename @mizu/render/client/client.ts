// Imports
import type { Arg, Directive, RendererOptions, RendererRenderOptions } from "@mizu/internal/engine"
import { Context, Renderer } from "@mizu/internal/engine"
import defaults from "./defaults.ts"
export type * from "@mizu/internal/engine"

/**
 * Client side renderer.
 * @module
 */
export class Client {
  /**
   * Default options for {@linkcode Client}.
   *
   * These default options are merged with the provided options when creating a new {@linkcode Client} instance.
   */
  static defaults = {
    window: globalThis.window,
    directives: defaults,
    context: globalThis.MIZU_CUSTOM_DEFAULTS_CONTEXT ?? {},
    // deno-lint-ignore no-console
    warn: globalThis.MIZU_CUSTOM_DEFAULTS_WARN ?? console.warn,
    debug: globalThis.MIZU_CUSTOM_DEFAULTS_DEBUG ?? false,
  } as unknown as Required<ClientOptions>

  /** {@linkcode Client} constructor. */
  constructor(options?: ClientOptions) {
    const { directives, window, warn, debug, context } = { ...Client.defaults, ...options }
    this.#renderer = new Renderer(window, { directives, warn, debug })
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
   * All properties assigned to this object are available during rendering.
   *
   * Changes to this object are reactive and will trigger a re-render of related elements.
   * This is achieved using {@linkcode Context}, which leverages {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy | Proxy} handlers.
   *
   * > [!NOTE]
   * > You cannot reassign this property directly to ensure reactivity is maintained.
   * > To achieve a similar effect, use {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign | Object.assign()}.
   */
  // deno-lint-ignore no-explicit-any
  get context(): Record<PropertyKey, any> {
    return this.#context.target
  }

  /**
   * Start rendering all subtrees marked with the {@linkcode https://mizu.sh/#mizu | *mizu} attribute.
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
export type ClientOptions = Pick<RendererOptions, "warn" | "debug"> & {
  /** Default directives. */
  directives?: Array<Partial<Directive> | string>
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
