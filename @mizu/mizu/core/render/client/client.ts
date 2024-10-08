// Imports
import type { Arg, Directive } from "@mizu/mizu/core/engine"
import { Context, Renderer } from "@mizu/mizu/core/engine"
import _mizu from "@mizu/mizu"
// import _bind from "@mizu/bind"
// import _clean from "@mizu/clean"
// import _code from "@mizu/code"
// import _custom_element from "@mizu/custom-element"
// import _eval from "@mizu/eval"
// import _event from "@mizu/event"
// import _for from "@mizu/for/empty"
// import _html from "@mizu/html"
// import _http from "@mizu/http"
// import _if from "@mizu/if/else"
// import _is from "@mizu/is"
// import _markdown from "@mizu/markdown"
// import _model from "@mizu/model"
// import _once from "@mizu/once"
// import _ref from "@mizu/ref"
// import _refresh from "@mizu/refresh"
// import _set from "@mizu/set"
// import _show from "@mizu/show"
// import _skip from "@mizu/skip"
// import _text from "@mizu/text"
// import _toc from "@mizu/toc"
export type * from "@mizu/mizu/core/engine"

/**
 * Client side renderer.
 *
 * See {@link https://mizu.sh | mizu.sh documentation} for more details.
 * @module
 */
export class Client {
  /** Default directives. */
  static defaults = {
    directives: [
      _mizu,
      // _bind,
      // _clean,
      // _code,
      // _custom_element,
      // _eval,
      // _event,
      // _for,
      // _html,
      // _http,
      // _if,
      // _is,
      // _markdown,
      // _model,
      // _once,
      // _ref,
      // _refresh,
      // _set,
      // _show,
      // _skip,
      // _text,
      // _toc,
    ] as Array<Partial<Directive> | string>,
  }

  /** {@linkcode Client} constructor. */
  constructor({ directives = Client.defaults.directives, context = {}, window = globalThis.window } = {} as { directives?: Arg<Renderer["load"]>; context?: ConstructorParameters<typeof Context>[0]; window?: Renderer["window"] }) {
    this.#renderer = new Renderer(window, { directives })
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
   * @example
   * ```ts ignore
   * const mizu = new Client({ context: { foo: "bar" } })
   * await mizu.render()
   * ```
   */
  render<T extends Arg<Renderer["render"]>>(element = this.#renderer.document.documentElement as T, options?: Partial<Pick<Arg<Renderer["render"], 1, true>, "state"> & { context: Arg<Context["with"]> }>): Promise<T> {
    let context = this.#context
    if (options?.context) {
      context = context.with(options.context)
    }
    return this.#renderer.render(element, { ...options, context, state: { $renderer: "client", ...options?.state }, implicit: false })
  }

  /** Default {@linkcode Client} instance. */
  static readonly default = new Client() as Client
}
