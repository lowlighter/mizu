// Imports
import type { DeepReadonly, Promisable } from "@libs/typing/types"
import type { AttrTypings, Context, InferAttrTypings, Renderer, State } from "./renderer.ts"
import { Phase } from "./phase.ts"
export { Phase }
export type { DeepReadonly, Promisable }

/**
 * A directive implements a custom behaviour for a matching {@link https://developer.mozilla.org/docs/Web/HTML/Attributes | HTML attribute}.
 *
 * For more information, see the {@link https://mizu.sh/#concept-directive | mizu.sh documentation}.
 */
export interface Directive<
  Definition extends {
    Name?: string | RegExp
    // deno-lint-ignore no-explicit-any
    Cache?: any
    Typings?: AttrTypings
    Default?: boolean
    Prefix?: boolean
  } = {
    Name: string | RegExp
    Cache: null
    Typings: unknown
    Default: false
    Prefix: false
  },
> {
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
   * ```ts
   * const foo: Directive = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   * }
   * ```
   */
  readonly name: Definition["Name"] extends RegExp ? RegExp : Definition["Name"] extends string ? string : (string | RegExp)
  /**
   * Directive prefix.
   *
   * It is used as a hint for {@linkcode Renderer.parseAttribute()} to strip prefix from {@linkcode https://developer.mozilla.org/docs/Web/API/Attr/name | Attr.name} when parsing the directive.
   *
   * If {@linkcode Directive.name} is a `RegExp`, this property should be specified.
   *
   * ```ts
   * const foo: Directive<{ Name: RegExp }> = {
   *   name: /^~(?<bar>)/,
   *   prefix: "~",
   *   phase: Phase.UNKNOWN,
   * }
   * ```
   */
  readonly prefix?: Definition["Name"] extends RegExp ? string : Definition["Prefix"] extends true ? string : never
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
   * For more information, see the {@link https://mizu.sh/#concept-renderering-phase | mizu.sh documentation}.
   *
   * ```ts
   * const foo: Directive = {
   *   name: "*foo",
   *   phase: Phase.CONTENT,
   * }
   * ```
   */
  readonly phase: Phase
  /**
   * Indicates whether the directive can be specified multiple times on the same node.
   *
   * If set to `false`, a warning will be issued to users attempting to apply it more than once.
   *
   * ```ts
   * const foo: Directive<{ Name: RegExp }> = {
   *   name: /^\/(?<value>)/,
   *   prefix: "/",
   *   phase: Phase.UNKNOWN,
   *   multiple: true
   * }
   * ```
   */
  readonly multiple?: boolean
  /**
   * Typings for directive parsing.
   *
   * For more information, see {@linkcode Renderer.parseAttribute()}.
   *
   * ```ts
   * const typings = {
   *   type: Boolean,
   *   modifiers: {
   *     foo: { type: Boolean, default: false },
   *   }
   * }
   *
   * const foo: Directive<{ Typings: typeof typings}> = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   typings,
   *   async execute(this: typeof foo, renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(renderer.parseAttribute(attribute, this.typings, { modifiers: true }))
   *   }
   * }
   * ```
   */
  readonly typings?: Definition["Typings"]
  /**
   * Default value.
   *
   * This value should be used by directive callbacks when the {@linkcode https://developer.mozilla.org/docs/Web/API/Attr/value | Attr.value} is empty.
   *
   * ```ts
   * const foo: Directive<{ Default: true }> = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   default: "bar",
   *   async execute(this: typeof foo, renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(attribute.value || this.default)
   *   }
   * }
   * ```
   */
  readonly default?: Definition["Default"] extends true ? string : never
  /**
   * Directive initialization callback.
   *
   * This callback is executed once during when {@linkcode Renderer.load()} loads the directive.
   * It should be used to set up dependencies, instantiate directive-specific caches (via {@linkcode Renderer.cache()}), and perform other initialization tasks.
   *
   * If a cache is instantiated, it is recommended to use the `Directive<Cache>` generic type to ensure type safety when accessing it in {@linkcode Directive.setup()}, {@linkcode Directive.execute()}, and {@linkcode Directive.cleanup()}.
   *
   * ```ts
   * const foo: Directive<{ Cache: WeakSet<HTMLElement | Comment> }> = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async init(renderer) {
   *     renderer.cache(this.name, new WeakSet())
   *   },
   * }
   * ```
   */
  readonly init?: (renderer: Renderer) => Promisable<void>
  /**
   * Directive setup callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} before any {@linkcode Directive.execute()} calls.
   *
   * A partial object can be returned to update the rendering {@linkcode State}, and the eligibility.
   *
   * If `false` is returned, the entire rendering process for this node is halted.
   *
   * > [!IMPORTANT]
   * > This method is executed regardless of the directive's presence on the node.
   *
   * ```ts
   * const foo: Directive = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async setup(this: typeof foo, renderer, element, { cache, context, state }) {
   *     if ((!renderer.isHtmlElement(element)) || (element.hasAttribute("no-render"))) {
   *       return false as const
   *     }
   *   },
   * }
   * ```
   */
  readonly setup?: (renderer: Renderer, element: HTMLElement | Comment, _: { cache: Definition["Cache"]; context: Context; state: DeepReadonly<State> }) => Promisable<void | Partial<{ state: State; execute: boolean } | false>>
  /**
   * Directive execution callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} if the rendered node has been marked as eligible.
   *
   * A node is considered eligible if at least one of the following conditions is met:
   * - {@linkcode Directive.setup()} returned `{ execute: true }`.
   * - {@linkcode Directive.setup()} did not return an `execute` value and the element has at least one attribute matching the directive name.
   *
   * A partial object can be returned to update the rendering {@linkcode Context}, {@linkcode State}, and the rendered {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} (or {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment}).
   *
   * If `final: true` is returned, the rendering process for this node is stopped (all {@linkcode Directive.cleanup()} will still be called).
   *
   * ```ts
   * const foo: Directive = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async execute(this: typeof foo, renderer, element, { attributes: [ attribute ], ...options }) {
   *     console.log(`${await renderer.evaluate(element, attribute.value || "''", options)}`)
   *     return { state: { $foo: true } }
   *   },
   * }
   * ```
   */
  readonly execute?: (
    renderer: Renderer,
    element: HTMLElement | Comment,
    _: { cache: Definition["Cache"]; context: Context; state: DeepReadonly<State>; attributes: Readonly<Attr[]> },
  ) => Promisable<void | Partial<{ element: HTMLElement | Comment; context: Context; state: State; final: boolean }>>
  /**
   * Directive cleanup callback.
   *
   * This callback is executed during {@linkcode Renderer.render()} after all {@linkcode Directive.execute()} have been applied and all {@linkcode https://developer.mozilla.org/docs/Web/API/Node/childNodes | Element.childNodes} have been processed.
   *
   * > [!IMPORTANT]
   * > This method is executed regardless of the directive's presence on the node, and regardless of whether a {@linkcode Directive.execute()} returned with `final: true`.
   *
   * ```ts
   * const foo: Directive = {
   *   name: "*foo",
   *   phase: Phase.UNKNOWN,
   *   async cleanup(this: typeof foo, renderer, element, { cache, context, state }) {
   *     console.log("Cleaning up")
   *   }
   * }
   * ```
   */
  readonly cleanup?: (renderer: Renderer, element: HTMLElement | Comment, _: { cache: Definition["Cache"]; context: Context; state: DeepReadonly<State> }) => Promisable<void>
}

/** Extracts the cache type from a {@linkcode Directive}. */
export type Cache<T> = T extends Directive<infer U> ? U["Cache"] : never

/** Extracts the typings definitions from a {@linkcode Directive}. */
export type Typings<T> = T extends Directive<infer U> ? U["Typings"] : never

/** Extracts the typings values from a {@linkcode Directive}. */
export type Modifiers<T> = T extends Directive<infer U> ? InferAttrTypings<U["Typings"]>["modifiers"] : never
