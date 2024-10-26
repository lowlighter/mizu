// Imports
import type { DeepReadonly, Promisable } from "@libs/typing/types"
import type { AttrTypings, Context, InferAttrTypings, InitialContextState, Renderer, State } from "./renderer.ts"
import { Phase } from "./phase.ts"
export { Phase }
export type { DeepReadonly, Promisable }

/**
 * A directive implements a custom behaviour for a matching {@link https://developer.mozilla.org/docs/Web/HTML/Attributes | HTML attribute}.
 *
 * For more information, see the {@link https://mizu.sh/#concept-directive | mizu.sh documentation}.
 */
// deno-lint-ignore no-explicit-any
export interface Directive<Cache = any, Typings extends AttrTypings = any> {
  /**
   * Directive name.
   *
   * The {@linkcode Renderer.render()} method uses this value to determine whether {@linkcode Directive.execute()} should be called for the processed node.
   *
   * The name should be prefixed to avoid conflicts with regular attribute names and must be unique among other {@linkcode Renderer.directives}.
   * {@linkcode Renderer.load()} will use this value to check whether the directive is already loaded.
   *
   * If the directive name is dynamic, a `RegExp` may be used instead of a `string`.
   * In this case, {@linkcode Directive.prefix} should be specified.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   * } as Directive & { name: string }
   * ```
   */
  readonly name: string | RegExp
  /**
   * Directive prefix.
   *
   * It is used as a hint for {@linkcode Renderer.parseAttribute()} to strip prefix from {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Attr/name | Attr.name} when parsing the directive.
   *
   * If {@linkcode Directive.name} is a `RegExp`, this property shoud be specified.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: /^~(?<bar>)/,
   *   prefix: "~",
   *   phase: Phase.UNKNOWN,
   * } as Directive & { name: RegExp, prefix: string }
   * ```
   */
  readonly prefix?: string
  /**
   * Directive import list.
   *
   * This list contains a record of all libraries that the directive may dynamically {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import | import()}.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   import: {
   *     testing: import.meta.resolve("@libs/testing")
   *   }
   * } as Directive & { name: string, import: Record<PropertyKey, string> }
   * ```
   */
  readonly import?: Record<PropertyKey, string>
  /**
   * Directive phase.
   *
   * Directives are executed in ascending order based on their {@linkcode Phase}.
   *
   * > [!IMPORTANT]
   * > Directives with {@linkcode Phase.UNKNOWN} and {@linkcode Phase.META} are ignored by {@linkcode Renderer.load()}.
   * >
   * > {@linkcode Phase.TESTING} is intended for testing purposes only.
   *
   * For more information, see the {@link https://mizu.sh/#concept-phase | mizu.sh documentation}.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.CONTENT,
   * } as Directive & { name: string }
   * ```
   */
  readonly phase: Phase
  /**
   * Indicates whether the directive can be specified multiple times on the same node.
   *
   * If set to `false`, a warning will be issued to users attempting to apply it more than once.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: /^\/(?<value>)/,
   *   prefix: "/",
   *   phase: Phase.UNKNOWN,
   *   multiple: true
   * } as Directive & { name: RegExp; prefix: string }
   * ```
   */
  readonly multiple?: boolean
  /**
   * Typings for directive parsing.
   *
   * For more information, see {@linkcode Renderer.parseAttribute()}.
   *
   * @example
   * ```ts
   * const typings = {
   *   type: Boolean,
   *   modifiers: {
   *     foo: { type: Boolean, default: false },
   *   }
   * }
   *
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   typings,
   *   async execute(renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(renderer.parseAttribute(attribute, this.typings, { modifiers: true }))
   *   }
   * } as Directive<null, typeof typings> & { name: string }
   * ```
   */
  readonly typings?: Typings
  /**
   * Default value.
   *
   * This value should be used by directive callbacks when the {@linkcode https://developer.mozilla.org/docs/Web/API/Attr/value | Attr.value} is empty.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   default: "bar",
   *   async execute(renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(attribute.value || this.default)
   *   }
   * } as Directive & { name: string; default: string }
   * ```
   */
  readonly default?: string
  /**
   * Directive initialization callback.
   *
   * This callback is executed once during when {@linkcode Renderer.load()} loads the directive.
   * It should be used to set up dependencies, instantiate directive-specific caches (via {@linkcode Renderer.cache()}), and perform other initialization tasks.
   *
   * If a cache is instantiated, it is recommended to use the `Directive<Cache>` generic type to ensure type safety when accessing it in {@linkcode Directive.setup()}, {@linkcode Directive.execute()}, and {@linkcode Directive.cleanup()}.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async init(renderer) {
   *     renderer.cache(this.name, new WeakSet())
   *   },
   * } as Directive<WeakSet<HTMLElement | Comment>> & { name: string }
   * ```
   */
  readonly init?: (renderer: Renderer) => Promisable<void>
  /**
   * Directive setup callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} before any {@linkcode Directive.execute()} calls.
   *
   * If `false` is returned, the entire rendering process for this node is halted.
   *
   * A partial object can be returned to update the rendering {@linkcode State}.
   *
   * > [!IMPORTANT]
   * > This method is executed regardless of the directive's presence on the node.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async setup(renderer, element, { cache, context, state }) {
   *     if ((!renderer.isHtmlElement(element)) || (element.hasAttribute("no-render"))) {
   *       return false
   *     }
   *   },
   * } as Directive & { name: string }
   * ```
   */
  readonly setup?: (renderer: Renderer, element: HTMLElement | Comment, _: { cache: Cache; context: Context; state: DeepReadonly<State>; root: InitialContextState }) => Promisable<void | false | Partial<{ state: State }>>
  /**
   * Directive execution callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} if the rendered node has been marked as eligible.
   *
   * If `final: true` is returned, the rendering process for this node is stopped (all {@linkcode Directive.cleanup()} will still be called).
   *
   * A partial object can be returned to update the rendering {@linkcode Context}, {@linkcode State}, and the rendered {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} (or {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment}).
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async execute(renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(`${await renderer.evaluate(element, attribute.value || "''", options)}`)
   *     return { state: { $foo: true } }
   *   },
   * } as Directive & { name: string }
   * ```
   */
  readonly execute?: (
    renderer: Renderer,
    element: HTMLElement | Comment,
    _: { cache: Cache; context: Context; state: DeepReadonly<State>; attributes: Readonly<Attr[]>; root: InitialContextState },
  ) => Promisable<void | Partial<{ element: HTMLElement | Comment; context: Context; state: State; final: boolean }>>
  /**
   * Directive cleanup callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} after all {@linkcode Directive.execute()} have been applied and all {@linkcode https://developer.mozilla.org/docs/Web/API/Node/childNodes | Element.childNodes} have been processed.
   *
   * > [!IMPORTANT]
   * > This method is executed regardless of the directive's presence on the node, and regardless of whether a {@linkcode Directive.execute()} returned with `final: true`.
   *
   * @example
   * ```ts
   * const foo = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async cleanup(renderer, element, { cache, context, state }) {
   *     console.log("Cleaning up")
   *   }
   * } as Directive & { name: string }
   * ```
   */
  readonly cleanup?: (renderer: Renderer, element: HTMLElement | Comment, _: { cache: Cache; context: Context; state: DeepReadonly<State>; root: InitialContextState }) => Promisable<void>
}

/** Extracts the cache type from a {@linkcode Directive}. */
export type Cache<T> = T extends Directive<infer U> ? U : never

/** Extracts the typings values from a {@linkcode Directive}. */
// deno-lint-ignore no-explicit-any
export type Modifiers<T> = T extends Directive<any, infer U> ? InferAttrTypings<U>["modifiers"] : never
