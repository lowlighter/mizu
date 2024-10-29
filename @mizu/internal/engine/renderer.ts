// Imports
import type { Arg, Arrayable, callback, DeepReadonly, NonVoid, Nullable, Optional } from "@libs/typing/types"
import type { Cache, Directive } from "./directive.ts"
import { escape } from "@std/regexp"
import { AsyncFunction } from "@libs/typing/func"
import { Context } from "@libs/reactive"
import { Phase } from "./phase.ts"
import { delay } from "@std/async"
export { Context, Phase }
export type { Arg, Arrayable, Cache, callback, Directive, NonVoid, Nullable, Optional }
export type * from "./directive.ts"

/**
 * Mizu directive renderer.
 */
export class Renderer {
  /** {@linkcode Renderer} constructor. */
  constructor(window: Window, { warn, directives = [] } = {} as RendererOptions) {
    this.window = window as Renderer["window"]
    this.cache("*", new WeakMap())
    this.#warn = warn
    this.#directives = [] as Directive[]
    this.#flush = { request: Promise.withResolvers<true>(), response: Promise.withResolvers<void>() }
    this.ready = this.load(directives)
  }

  /**
   * Whether the {@linkcode Renderer} is ready to be used.
   *
   * This promise resolves once the initial {@linkcode Renderer.load()} call is completed.
   */
  readonly ready: Promise<this>

  /** Linked {@linkcode https://developer.mozilla.org/docs/Web/API/Window | Window}. */
  readonly window: VirtualWindow

  /** Linked {@linkcode https://developer.mozilla.org/docs/Web/API/Document | Document}. */
  get document(): Document {
    return this.window.document
  }

  /** Internal cache registries. */
  readonly #cache = new Map<Directive["name"], unknown>()

  /**
   * Retrieve {@linkcode Directive}-specific cache registry.
   *
   * Directive-specific caches can be used to store related data.
   * These are automatically exposed by {@linkcode Renderer.render()} during {@linkcode Directive.setup()}, {@linkcode Directive.execute()} and {@linkcode Directive.cleanup()} executions.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   *
   * const directive = {
   *   name: "*foo",
   *   phase: Phase.TESTING,
   *   init(renderer) {
   *     if (!renderer.cache(this.name)) {
   *       renderer.cache<Cache<typeof directive>>(this.name, new WeakSet())
   *     }
   *   },
   *   setup(renderer, element, { cache }) {
   *      console.assert(cache instanceof WeakSet)
   *      console.assert(renderer.cache(directive.name) instanceof WeakSet)
   *      cache.add(element)
   *   }
   * } as Directive<WeakSet<HTMLElement | Comment>> & { name: string }
   *
   * const renderer = await new Renderer(new Window(), { directives: [directive] }).ready
   * const element = renderer.createElement("div", { attributes: { "*foo": "" } })
   * await renderer.render(element)
   * console.assert(renderer.cache<Cache<typeof directive>>(directive.name).has(element))
   * ```
   */
  cache<T>(directive: Directive["name"]): T
  /**
   * Set {@linkcode Directive}-specific cache registry.
   *
   * These are expected to be initialized by {@linkcode Renderer.load()} during {@linkcode Directive.init()} execution if a cache is needed.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   *
   * const directive = {
   *   name: "*foo",
   *   phase: Phase.TESTING,
   *   init(renderer) {
   *     renderer.cache(this.name, new WeakSet())
   *   },
   * } as Directive<WeakSet<HTMLElement | Comment>> & { name: string }
   *
   * const renderer = await new Renderer(new Window(), { directives: [directive] }).ready
   * console.assert(renderer.cache(directive.name) instanceof WeakSet)
   * ```
   */
  cache<T>(directive: Directive["name"], cache: T): T
  /**
   * Retrieve generic cache registry.
   *
   * This cache is automatically created upon {@linkcode Renderer} instantiation.
   * It is shared between all {@linkcode Renderer.directives} and is mostly used to check whether a node was already processed,
   * and to map back {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment} nodes to their original {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} if they were replaced by {@linkcode Renderer.comment()}.
   *
   * This cache should not be used to store {@linkcode Directive}-specific data.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * console.assert(renderer.cache("*") instanceof WeakMap)
   * ```
   */
  cache<T>(directive: "*"): WeakMap<HTMLElement | Comment, HTMLElement>
  cache<T>(directive: Directive["name"], cache?: T): Nullable<T> {
    if (cache && (!this.#cache.has(directive))) {
      this.#cache.set(directive, cache)
    }
    return this.#cache.get(directive) as Optional<T> ?? null
  }

  /**
   * {@linkcode Directive} list.
   *
   * It contains any `Directive` that was registered during {@linkcode Renderer} instantiation.
   */
  #directives

  /** {@linkcode Directive} list. */
  get directives(): Readonly<Directive[]> {
    return [...this.#directives]
  }

  /**
   * Load additional {@linkcode Directive}s.
   *
   * A `Directive` needs to have both a valid {@linkcode Directive.phase} and {@linkcode Directive.name} to be valid.
   * If a `Directive` with the same name already exists, it is ignored.
   *
   * It is possible to dynamically {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import | import()} a `Directive` by passing a `string` instead.
   * Note that in this case the resolved module must have an {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#using_the_default_export | export default} statement.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const directive = {
   *   name: "*foo",
   *   phase: Phase.TESTING
   * } as Directive & { name: string }
   *
   * await renderer.load([directive, import.meta.resolve("@mizu/test")])
   * console.assert(renderer.directives.includes(directive))
   * ```
   */
  async load(directives: Arrayable<Arrayable<Partial<Directive> | string>>): Promise<this> {
    const loaded = (await Promise.all<Arrayable<Directive>>(([directives].flat(Infinity) as Array<Directive | string>)
      .map(async (directive) => typeof directive === "string" ? (await import(directive)).default : directive)))
      .flat(Infinity) as Array<Directive>
    for (const directive of loaded) {
      if ((!directive?.name) || (!Number.isFinite(directive?.phase)) || (Number(directive?.phase) < 0)) {
        const object = JSON.stringify(directive, (_, value) => (value instanceof Function) ? `[[Function]]` : value)
        throw new SyntaxError(`Failed to load directive: Malformed directive: ${object}`)
      }
      if (directive.phase === Phase.META) {
        continue
      }
      if (this.#directives.some((existing) => `${existing.name}` === `${directive.name}`)) {
        this.warn(`Directive [${directive.name}] is already loaded, skipping`)
        continue
      }
      await directive.init?.(this)
      this.#directives.push(directive as Directive)
    }
    this.#directives.sort((a, b) => a.phase - b.phase)
    return this
  }

  /**
   * Internal identifier prefix.
   *
   * This is used to avoid conflicts with user-defined variables in expressions.
   */
  static readonly internal = "__mizu_internal" as const

  /** Alias to {@linkcode Renderer.internal}. */
  get #internal() {
    return (this.constructor as typeof Renderer).internal
  }

  /**
   * Generate an internal identifier for specified name by prefixing it with {@linkcode Renderer.internal}.
   *
   * When creating internal variables or functions in expressions, this method should always be used to name them.
   * It ensures that they won't collide with end-user-defined variables or functions.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * console.assert(renderer.internal("foo").startsWith(`${Renderer.internal}_`))
   * ```
   */
  internal(name: string): `${typeof Renderer.internal}_${string}`
  /**
   * Retrieve {@linkcode Renderer.internal} prefix.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * console.assert(renderer.internal() === Renderer.internal)
   * ```
   */
  internal(): typeof Renderer.internal
  internal(name = "") {
    return `${this.#internal}${name ? `_${name}` : ""}`
  }

  /**
   * Internal expressions cache.
   *
   * This is used to store compiled expressions for faster evaluation.
   */
  readonly #expressions = new WeakMap<HTMLElement | Comment | Renderer, Record<PropertyKey, ReturnType<typeof AsyncFunction>>>()

  /**
   * Evaluate an expression with given {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} (or {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment}), {@linkcode Context}, {@linkcode State} and arguments.
   *
   * Passed `HTMLElement` or `Comment` can be accessed through the `this` keyword in the expression.
   *
   * Both `context` and `state` are exposed through {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/with | with} statements,
   * meaning that their properties can be accessed directly in the expression without prefixing them.
   * The difference between both is that the latter is not reactive and is intended to be used for specific stateful data added by a {@linkcode Directive}.
   *
   * > [!NOTE]
   * > The root {@linkcode Renderer.internal} prefix is used internally to manage evaluation state, and thus cannot be used as a variable name.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * console.assert(await renderer.evaluate(null, "1 + 1") === 2)
   * console.assert(await renderer.evaluate(null, "foo => foo", { args: ["bar"] }) === "bar")
   * console.assert(await renderer.evaluate(null, "$foo", { state: { $foo: "bar" } }) === "bar")
   * ```
   */
  async evaluate(that: Nullable<HTMLElement | Comment>, expression: string, { context = new Context(), state = {}, args } = {} as RendererEvaluateOptions): Promise<unknown> {
    if (this.#internal in context.target) {
      throw new TypeError(`"${this.#internal}" is a reserved variable name`)
    }
    const these = that ?? this
    if (!this.#expressions.get(these)?.[expression]) {
      const cache = (!this.#expressions.has(these) ? this.#expressions.set(these, {}) : this.#expressions).get(these)!
      cache[expression] = new AsyncFunction(
        this.#internal,
        `with(${this.#internal}.state){with(${this.#internal}.context){${this.#internal}.result=${expression};if(${this.#internal}.args)${this.#internal}.result=${this.#internal}.result?.call?.(this,...${this.#internal}.args)}}return ${this.#internal}.result`,
      )
    }
    const compiled = this.#expressions.get(these)![expression]
    const internal = { this: that, context: context.target, state, args, result: undefined }
    return await compiled.call(that, internal)
  }

  /** Explicit rendering attribute name. */
  static readonly #explicit = "*mizu"

  /**
   * Render {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} and its subtree with specified {@linkcode Context} and {@linkcode State} against {@linkcode Renderer.directives}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * import _test from "@mizu/test"
   * const renderer = await new Renderer(new Window(), { directives: [ _test ] }).ready
   * const element = renderer.createElement("div", { attributes: { "~test.text": "foo" } })
   *
   * const result = await renderer.render(element, { context: new Context({ foo: "bar" }) })
   * console.assert(result.textContent === "bar")
   * ```
   */
  async render<T extends Element>(element: T, options?: Omit<RendererRenderOptions, "select" | "stringify"> & { stringify?: false }): Promise<T>
  /**
   * Render {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} and its subtree with specified {@linkcode Context} and {@linkcode State} against {@linkcode Renderer.directives} and {@link https://developer.mozilla.org/docs/Web/API/Document/querySelector | query select} the return using a {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors | CSS selector}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * import _test from "@mizu/test"
   * const renderer = await new Renderer(new Window(), { directives: [ _test ] }).ready
   * const element = renderer.createElement("div", { innerHTML: renderer.createElement("span", { attributes: { "~test.text": "foo" } }).outerHTML })
   *
   * const result = await renderer.render(element, { context: new Context({ foo: "bar" }), select: "span" })
   * console.assert(result?.tagName === "SPAN")
   * console.assert(result?.textContent === "bar")
   * ```
   */
  async render<T extends Element>(element: HTMLElement, options?: Omit<RendererRenderOptions, "select" | "stringify"> & Required<Pick<RendererRenderOptions, "select">> & { stringify?: false }): Promise<Nullable<T>>
  /**
   * Render {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} and its subtree with specified {@linkcode Context} and {@linkcode State} against {@linkcode Renderer.directives} and returns it as an HTML string.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * import _test from "@mizu/test"
   * const renderer = await new Renderer(new Window(), { directives: [ _test ] }).ready
   * const element = renderer.createElement("div", { attributes: { "~test.text": "foo" } })
   *
   * const result = await renderer.render(element, { context: new Context({ foo: "bar" }), stringify: true })
   * console.assert(result.startsWith("<!DOCTYPE html>"))
   * ```
   */
  async render(element: HTMLElement, options?: Omit<RendererRenderOptions, "reactive" | "stringify"> & { stringify: true }): Promise<string>
  async render<T extends Element>(element = this.document.documentElement, { context = new Context(), state = {}, implicit = true, reactive = false, select = "", stringify = false, throw: _throw = false } = {} as RendererRenderOptions) {
    await this.ready
    // Create a new sub-context when reactivity is enabled to avoid polluting the given root context
    if (reactive) {
      context = context.with({})
    }
    // Search for all elements with the mizu attribute, and filter out all elements that have an ancestor with the mizu attribute (since they will be rendered anyway)
    let subtrees = implicit || (element.hasAttribute(Renderer.#explicit)) ? [element] : Array.from(element.querySelectorAll<HTMLElement>(`[${escape(Renderer.#explicit)}]`))
    subtrees = subtrees.filter((element) => subtrees.every((ancestor) => (ancestor === element) || (!ancestor.contains(element))))
    // Render subtrees
    const rendered = await Promise.allSettled(subtrees.map((element) => this.#render(element, { context, state, reactive, root: { context, state } })))
    const rejected = rendered.filter((render) => render.status === "rejected")
    if (rejected.length) {
      const error = new AggregateError(rejected.map((render) => render.reason))
      this.warn(error.message)
      if (_throw) {
        throw error
      }
    }
    // Process result
    const result = select ? element.querySelector<T>(select) : element
    if (stringify) {
      const html = result?.outerHTML ?? ""
      return select ? html : `<!DOCTYPE html>${html}`
    }
    return result as T
  }

  /**
   * Used by {@linkcode Renderer.render()} to recursively render an {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} and its subtree.
   *
   * Rendering process is defined as follows:
   * - 1. Ensure `element` is an {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} node (or a {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment} node created by {@linkcode Renderer.comment()}).
   *   - 1.1 If not, end the process.
   * - R1. Start watching context if `reactive` is enabled.
   * - 2. For each {@linkcode Renderer.directives}:
   *   - 2.1 Call {@linkcode Directive.setup()}.
   *     - 2.1.1 If `false` is returned, end the process.
   *     - 2.1.2 If `state` is returned, update accordingly.
   *     - 2.1.3 If `execute` is returned, store directive eligibility.
   * - 3. Retrieve source {@linkcode https://developer.mozilla.org/docs/Web/API/Element | Element} node from {@linkcode Renderer.cache()} (if applicable).
   *   - 3.1 This occurs when `element` is a {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment} node.
   * - 4. For each {@linkcode Renderer.directives}:
   *   - 4.1 Check if source node is elligible and has at least one matching {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr}.
   *     - 4.1.1 If not, continue to the next directive.
   *   - 4.2 Notify any misuses:
   *     - 4.2.1 If current {@linkcode Directive.phase} has already been processed (conflicts).
   *     - 4.2.2 If current {@linkcode Directive.multiple} is not set but more than one matching {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} is found (duplicates).
   *   - 4.3 Call {@linkcode Directive.execute()} with `element`
   *     - 4.3.1 If `element` is returned, update accordingly.
   *     - 4.3.2 If `final: true` is returned, end the process (it occurs after `element` update to ensure that {@linkcode Directive.cleanup()} is called with correct target).
   *     - 4.3.3 If `context` or `state` is returned, update accordingly.
   * - 5. Recurse on {@linkcode https://developer.mozilla.org/docs/Web/API/Node/childNodes | Element.childNodes}.
   *   - R*. Disable reactivity during recursion if `reactive` is enabled so that watched contexts are created with correct elements.
   * - 6. For each {@linkcode Renderer.directives}:
   *   - 6.1 Call {@linkcode Directive.cleanup()}.
   * - R2. Stop watching context if `reactive` is enabled, and enable reactivity.
   */
  async #render(element: HTMLElement | Comment, { context, state, reactive, root }: { context: Context; state: State; reactive: boolean; root: InitialContextState }) {
    // 1. Ignore non-element nodes unless they were processed before and put into cache
    if ((element.nodeType !== this.window.Node.ELEMENT_NODE) && (!this.cache("*").has(element))) {
      return
    }
    try {
      // R1. Watch context
      if (reactive) {
        this.#watch(context, element)
      }
      // 2. Setup directives
      const forced = new WeakMap<Directive, boolean>()
      state = { ...state }
      for (const directive of this.#directives) {
        const changes = await directive.setup?.(this, element, { cache: this.cache(directive.name), context, state, root })
        if (changes === false) {
          return
        }
        if (changes?.state) {
          Object.assign(state, changes.state)
        }
        if ((changes?.execute === false) || (changes?.execute === true)) {
          forced.set(directive, changes.execute)
        }
      }

      // 3. Retrieve source element
      const source = this.cache("*").get(element) ?? element

      // 4. Execute directives
      const phases = new Map<Phase, Directive["name"]>()
      for (const directive of this.#directives) {
        // 4.1 Check eligibility
        const attributes = this.getAttributes(source, directive.name)
        if ((forced.get(directive) === false) || ((!forced.has(directive)) && (!attributes.length))) {
          continue
        }
        // 4.2 Notify misuses
        if (phases.has(directive.phase)) {
          this.warn(`Using [${directive.name}] and [${phases.get(directive.phase)}] directives together might result in unexpected behaviour`, element)
        }
        if ((attributes.length > 1) && (!directive.multiple)) {
          this.warn(`Using multiple [${directive.name}] directives might result in unexpected behaviour`, element)
        }
        // 4.3 Execute directive
        phases.set(directive.phase, directive.name)
        const changes = await directive.execute?.(this, element, { cache: this.cache(directive.name), context, state, attributes, root })
        if (changes?.element) {
          if (reactive && (this.#watched.get(context)?.has(element))) {
            this.#watched.get(context)!.set(changes.element, this.#watched.get(context)!.get(element)!)
            this.#watched.get(context)!.delete(element)
          }
          element = changes.element
        }
        if (changes?.final) {
          return
        }
        if (changes?.context) {
          if (reactive && (this.#watched.get(context)?.has(element))) {
            this.#unwatch(context, element)
            this.#watch(changes.context, element)
            this.#watched.get(context)!.get(element)!.properties.forEach((property) => this.#watched.get(changes.context!)!.get(element)!.properties.add(property))
          }
          context = changes.context
        }
        if (changes?.state) {
          Object.assign(state, changes.state)
        }
      }
      // 5. Recurse on child nodes
      if (reactive) {
        this.#unwatch(context, element)
      }
      for (const child of Array.from(element.childNodes) as Array<HTMLElement | Comment>) {
        await this.#render(child, { context, state, reactive, root })
      }
      if (reactive) {
        this.#watch(context, element)
      }
    } catch (error) {
      this.warn(error.message, element)
      throw error
    } finally {
      // 6. Cleanup directives
      for (const directive of this.#directives) {
        await directive.cleanup?.(this, element, { cache: this.cache(directive.name), context, state, root })
      }
      // R2. Unwatch context and start reacting
      if (reactive) {
        this.#unwatch(context, element)
        this.#react(element, { context, state, root })
      }
    }
  }

  /** Watched {@linkcode Context}s. */
  readonly #watched = new WeakMap<Context, WeakMap<HTMLElement | Comment, { properties: Set<string>; _get: Nullable<callback>; _set: Nullable<callback> }>>()

  /** Start watching a {@linkcode Context} for properties read operations. */
  #watch(context: Context, element: HTMLElement | Comment) {
    if (!this.#watched.has(context)) {
      this.#watched.set(context, new WeakMap())
    }
    if (!this.#watched.get(context)!.has(element)) {
      this.#watched.get(context)!.set(element, { properties: new Set(), _get: null, _set: null })
    }
    const watched = this.#watched.get(context)!.get(element)!
    if (!watched._get) {
      watched._get = ({ detail: { path, property } }: CustomEvent) => {
        watched.properties.add([...path, property].join("."))
      }
    }
    context.addEventListener("get", watched._get as EventListener)
  }

  /** Stop watching a {@linkcode Context} for properties read operations. */
  #unwatch(context: Context, element: HTMLElement | Comment) {
    if (this.#watched.get(context)?.has(element)) {
      const watched = this.#watched.get(context)!.get(element)!
      context.removeEventListener("get", watched._get as EventListener)
    }
  }

  /** Start reacting to any {@linkcode Context} properties changes. */
  #react(element: HTMLElement | Comment, { context, state, root }: { context: Context; state: State; root: InitialContextState }) {
    if (!this.#watched.get(context)?.get(element)?.properties.size) {
      return
    }
    this.#unwatch(context, element)
    const watched = this.#watched.get(context)!.get(element)!
    watched._get = null
    if (!watched._set) {
      watched._set = ({ detail: { path, property } }: CustomEvent) => {
        const key = [...path, property].join(".")
        if (watched.properties.has(key)) {
          this.#queueReactiveRender(element, { context, state, root })
        }
      }
    }
    context.addEventListener("set", watched._set as EventListener)
  }

  /**
   * Queue a {@linkcode Renderer.render()} request emitted by a reactive change.
   *
   * This method automatically discards render requests that would be already covered by a parent element,
   * and removes any queued render request that could be covered by the current element.
   *
   * The actual rendering call is throttled to prevent over-rendering.
   */
  #queueReactiveRender(element: HTMLElement | Comment, options: { context: Context; state: State; root: InitialContextState }) {
    if (this.#queued.some(([ancestor]) => (ancestor === element) || (ancestor.contains(element)))) {
      return
    }
    this.#queued = this.#queued.filter(([ancestor]) => !element.contains(ancestor))
    this.#queued.push([element, options])
    this.#reactiveRender()
  }

  /** Throttled {@linkcode Renderer.render()} call. */
  #reactiveRender = ((throttle = 50, grace = 25) => {
    const controller = new AbortController()
    let t = NaN
    let active = false
    let flushed = false
    return async () => {
      if (active || (!this.#queued.length) || (Date.now() - t <= throttle)) {
        return
      }
      try {
        active = true
        flushed = await Promise.race([delay(grace, { signal: controller.signal }), this.#flush.request.promise]) as boolean
        if (flushed) {
          controller.abort()
        }
        await Promise.all(this.#queued.map(([element, options]) => {
          return this.#render(element, { reactive: true, ...options })
        }))
      } finally {
        t = Date.now()
        this.#queued = []
        active = false
        if (flushed) {
          flushed = false
          this.#flush.response.resolve()
        }
      }
    }
  })()

  /** Track reactive render queue flush requests and responses. */
  #flush

  /** Flush the reactive render queue. */
  async flushReactiveRenderQueue(): Promise<void> {
    this.#flush.request.resolve(true)
    await this.#flush.response.promise
    this.#flush = { request: Promise.withResolvers<true>(), response: Promise.withResolvers<void>() }
  }

  /** Queued reactive render requests. */
  #queued = [] as Array<[HTMLElement | Comment, { context: Context; state: State; root: InitialContextState }]>

  /**
   * Create a new {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} within {@linkcode Renderer.document}.
   *
   * It is possible to specify additional properties that will be assigned to the element.
   * The `attributes` property is handled by {@linkcode Renderer.setAttribute()} which allows to set attributes with non-standard characters.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.createElement("div", { innerHTML: "foo", attributes: { "*foo": "bar" } })
   * console.assert(element.tagName === "DIV")
   * console.assert(element.innerHTML === "foo")
   * console.assert(element.getAttribute("*foo") === "bar")
   * ```
   */
  createElement<T extends HTMLElement>(tagname: string, properties = {} as Record<PropertyKey, unknown>): T {
    const { attributes = {}, ...rest } = properties
    const element = Object.assign(this.document.createElement(tagname), rest)
    Object.entries(attributes as Record<PropertyKey, unknown>).forEach(([name, value]) => this.setAttribute(element, name, `${value}`))
    return element as unknown as T
  }

  /**
   * Replace a {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} with another {@linkcode https://developer.mozilla.org/fr/docs/Web/API/Node/childNodes | HTMLElement.childNodes}.
   *
   * Note that the `HTMLElement` is entirely replaced, meaning that is is actually removed from the DOM.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const parent = renderer.createElement("div")
   * const slot = parent.appendChild(renderer.createElement("slot")) as HTMLSlotElement
   * const content = renderer.createElement("div", { innerHTML: "<span>foo</span><span>bar</span>" })
   *
   * renderer.replaceElementWithChildNodes(slot, content)
   * console.assert(parent.innerHTML === "<span>foo</span><span>bar</span>")
   * ```
   */
  replaceElementWithChildNodes(a: HTMLElement, b: HTMLElement) {
    let position = a as HTMLElement
    for (const child of Array.from(b.cloneNode(true).childNodes) as HTMLElement[]) {
      a.parentNode?.insertBefore(child, position.nextSibling)
      position = child
    }
    a.remove()
  }

  /**
   * Internal {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Comment | Comment} registry.
   *
   * It is used to map {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement | HTMLElement} to their `Comment` replacement.
   */
  readonly #comments = new WeakMap<HTMLElement, Comment>()

  /**
   * Replace a {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} by a {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Comment | Comment}.
   *
   * Specified `directive` and `expression` are used to set {@linkcode https://developer.mozilla.org/docs/Web/API/Node/nodeValue | Comment.nodeValue} and help identify which {@linkcode Directive} performed the replacement.
   *
   * Use {@linkcode Renderer.uncomment()} to restore the original `HTMLElement`.
   * Original `HTMLElement` can be retrieved through the generic {@linkcode Renderer.cache()}.
   * If you hold a reference to a replaced `HTMLElement`, use {@linkcode Renderer.getComment()} to retrieve the replacement `Comment`.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const parent = renderer.createElement("div")
   * const element = parent.appendChild(renderer.createElement("div"))
   *
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   * console.assert(!parent.contains(element))
   * console.assert(parent.contains(comment))
   * console.assert(renderer.cache("*").get(comment) === element)
   * ```
   */
  comment(element: HTMLElement, { directive, expression }: { directive: string; expression: string }): Comment {
    const attributes = this.createNamedNodeMap()
    attributes.setNamedItem(this.createAttribute(directive, expression))
    const comment = Object.assign(this.document.createComment(`[${directive}="${expression}"]`), { attributes })
    this.cache("*").set(comment, element)
    this.#comments.set(element, comment)
    element.parentNode?.replaceChild(comment, element)
    return comment
  }

  /**
   * Replace {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Comment | Comment} by restoring its original {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}.
   *
   * Calling this method on a `Comment`that was not created by {@linkcode Renderer.comment()} will throw a {@linkcode https://developer.mozilla.org/docs/Web/API/ReferenceError | ReferenceError}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const parent = renderer.createElement("div")
   * const element = parent.appendChild(renderer.createElement("div"))
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   *
   * renderer.uncomment(comment)
   * console.assert(!parent.contains(comment))
   * console.assert(parent.contains(element))
   * console.assert(!renderer.cache("*").has(comment))
   * ```
   */
  uncomment(comment: Comment): HTMLElement {
    if (!this.cache("*").has(comment)) {
      throw new ReferenceError(`Tried to uncomment an element that is not present in cache`)
    }
    const element = this.cache("*").get(comment)!
    comment.parentNode?.replaceChild(element, comment)
    this.cache("*").delete(comment)
    this.#comments.delete(element)
    return element
  }

  /**
   * Retrieve the {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment} associated with an {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} replaced by {@linkcode Renderer.comment()}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.document.documentElement.appendChild(renderer.createElement("div"))
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   * console.assert(renderer.getComment(element) === comment)
   * ```
   */
  getComment(element: HTMLElement): Nullable<Comment> {
    return this.#comments.get(element) ?? null
  }

  /**
   * Create a new {@linkcode https://developer.mozilla.org/docs/Web/API/NamedNodeMap | NamedNodeMap}.
   *
   * This bypasses the illegal constructor check.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const nodemap = renderer.createNamedNodeMap()
   * console.assert(nodemap.constructor.name.includes("NamedNodeMap"))
   * ```
   */
  createNamedNodeMap(): NamedNodeMap {
    const div = this.createElement("div")
    return div.attributes
  }

  /**
   * Internal {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} cache.
   *
   * It is used to store `Attr` instances so they can be duplicated with {@linkcode https://developer.mozilla.org/docs/Web/API/Node/cloneNode | Attr.cloneNode()} without having to create a new one each time.
   */
  readonly #attributes = {} as Record<PropertyKey, Attr>

  /**
   * Create a new {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr}.
   *
   * This bypasses the attribute name validation check.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const attribute = renderer.createAttribute("*foo", "bar")
   * console.assert(attribute.name === "*foo")
   * console.assert(attribute.value === "bar")
   * ```
   */
  createAttribute(name: string, value = ""): Attr {
    let attribute = this.#attributes[name]?.cloneNode() as Attr
    try {
      attribute ??= this.document.createAttribute(name)
    } catch {
      this.#attributes[name] ??= (this.createElement("div", { innerHTML: `<div ${name}=""></div>` }).firstChild! as HTMLElement).attributes[0]
      attribute = this.#attributes[name].cloneNode() as Attr
    }
    attribute.value = value
    return attribute
  }

  /**
   * Set an {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} on a {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}
   * or updates a {@linkcode https://developer.mozilla.org/docs/Web/API/Node/nodeValue | Comment.nodeValue}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.createElement("div")
   * renderer.setAttribute(element, "*foo", "bar")
   * console.assert(element.getAttribute("*foo") === "bar")
   *
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   * renderer.setAttribute(comment, "*foo", "bar")
   * console.assert(comment.nodeValue?.includes(`[*foo="bar"]`))
   * ```
   */
  setAttribute(element: HTMLElement | Comment, name: string, value = "") {
    switch (element.nodeType) {
      case this.window.Node.COMMENT_NODE: {
        element = element as Comment
        const tag = `[${name}="${value.replaceAll('"', "&quot;")}"]`
        if (!element.nodeValue!.includes(tag)) {
          element.nodeValue += ` ${tag}`
        }
        break
      }
      case this.window.Node.ELEMENT_NODE: {
        element = element as HTMLElement
        const attribute = Array.from(element.attributes).find((attribute) => attribute.name === name)
        if (!attribute) {
          element.attributes.setNamedItem(this.createAttribute(name, value))
          break
        }
        attribute.value = value
        break
      }
    }
  }

  /** A collection of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp | RegExp} used by {@linkcode Renderer.getAttributes()} and {@linkcode Renderer.parseAttribute()}. */
  readonly #extractor = {
    attribute: /^(?:(?:(?<a>\S*?)\{(?<b>\S+?)\})|(?<name>[^{}]\S*?))(?:\[(?<tag>\S+?)\])?(?:\.(?<modifiers>\S+))?$/,
    modifier: /^(?<key>\S*?)(?:\[(?<value>\S*)\])?$/,
    boolean: /^(?<truthy>yes|on|true)|(?<falsy>no|off|false)$/,
    duration: /^(?<delay>(?:\d+)|(?:\d*\.\d+))(?<unit>(?:ms|s|m)?)$/,
  } as const

  /**
   * Retrieve all matching {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} from an {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}.
   *
   * It is designed to handle attributes that follows the syntax described in {@linkcode Renderer.parseAttribute()}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.createElement("div", { attributes: { "*foo.modifier[value]": "bar" } })
   * console.assert(renderer.getAttributes(element, "*foo").length === 1)
   * ```
   */
  getAttributes(element: Optional<HTMLElement | Comment>, names: Arrayable<string> | RegExp, options?: { first: false }): Attr[]
  /**
   * Retrieve the first matching {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} from an {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}.
   *
   * It is designed to handle attributes that follows the syntax described in {@linkcode Renderer.parseAttribute()}.
   * If no matching `Attr` is found, `null` is returned.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.createElement("div", { attributes: { "*foo.modifier[value]": "bar" } })
   * console.assert(renderer.getAttributes(element, "*foo", { first: true })?.value === "bar")
   * console.assert(renderer.getAttributes(element, "*bar", { first: true }) === null)
   * ```
   */
  getAttributes(element: Optional<HTMLElement | Comment>, names: Arrayable<string> | RegExp, options: { first: true }): Nullable<Attr>
  getAttributes(element: Optional<HTMLElement | Comment>, names: Arrayable<string> | RegExp, { first = false } = {}): Attr[] | Nullable<Attr> {
    const attributes = []
    if (element && (this.isHtmlElement(element))) {
      if (!(names instanceof RegExp)) {
        names = [names].flat()
      }
      for (const attribute of Array.from(element.attributes)) {
        const { a: _a, b: _b, name: name = `${_a}${_b}` } = attribute.name.match(this.#extractor.attribute)!.groups!
        if (((names as string[]).includes?.(name)) || ((names as RegExp).test?.(name))) {
          attributes.push(attribute)
          if (first) {
            break
          }
        }
      }
    }
    return first ? attributes[0] ?? null : attributes
  }

  /**
   * Parse an {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} from an {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}.
   *
   * Prefixes can automatically be stripped from the attribute name by setting the `prefix` option.
   * It is especially useful when `Attr` were extracted with a `RegExp` matching.
   *
   * The `typings` descriptor is passed to enforce types and validate values on {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Attr/value | Attr.value} and modifiers.
   * The following {@linkcode AttrTypings} are supported:
   * - {@linkcode AttrBoolean}, matching `BOOLEAN` token described below.
   *   - {@linkcode AttrBoolean.default} is `true`
   * - {@linkcode AttrNumber}, matching `NUMBER` token described below.
   *   - {@linkcode AttrNumber.default} is `0`.
   *   - {@linkcode AttrNumber.integer} will round the value to the nearest integer.
   *   - {@linkcode AttrNumber.min} will clamp the value to a minimum value.
   *   - {@linkcode AttrNumber.max} will clamp the value to a maximum value.
   * - {@linkcode AttrDuration}, matching `DURATION` described below.
   *   - {@linkcode AttrDuration.default} is `0`.
   *   - Value is normalized to milliseconds.
   *   - Value is clamped to a minimum of 0, and is rounded to the nearest integer.
   * - {@linkcode AttrString} (the default), matching `STRING` token described below.
   *   - {@linkcode AttrString.default} is `""`, or first {@linkcode AttrString.allowed} value if set.
   *   - {@linkcode AttrString.allowed} will restrict the value to a specific set of strings, in a similar fashion to an enum.
   *
   * > [!IMPORTANT]
   * > A {@linkcode AttrAny.default} is only applied when a key has been explicitly defined but its value was not.
   * > Use {@linkcode AttrAny.enforce} to force the default value to be applied event if the key was not defined.
   * >
   * > ```ts ignore
   * > import { Window } from "@mizu/internal/vdom"
   * > const renderer = await new Renderer(new Window()).ready
   * > const modifier = (attribute: Attr, typing: AttrBoolean) => renderer.parseAttribute(attribute, { modifiers: { value: typing } }, { modifiers: true }).modifiers
   * > const [a, b] = Array.from(renderer.createElement("div", { attributes: { "*a.value": "", "*b": "" } }).attributes)
   * >
   * > // `a.value === true` because it was defined, and the default for `AttrBoolean` is `true`
   * > console.assert(modifier(a, { type: Boolean }).value === true)
   * > // `a.value === false` because it was defined, and the default was set to `false`
   * > console.assert(modifier(a, { type: Boolean, default: false }).value === false)
   * >
   * > // `b.value === undefined` because it was not explicitly defined, despite the default for `AttrBoolean` being `true`
   * > console.assert(modifier(b, { type: Boolean }).value === undefined)
   * > // `b.value === true` because it was not explicitly defined, but the default was enforced
   * > console.assert(modifier(b, { type: Boolean, enforce: true }).value === true)
   * > // `b.value === false` because it was not explicitly defined, and the default was set to `false` and was enforced
   * > console.assert(modifier(b, { type: Boolean, default: false, enforce: true }).value === false)
   * > ```
   * >
   *
   * > [!NOTE]
   * > Modifiers parsing must be explicitly enabled with `modifiers: true`.
   * > This is to prevent unnecessary parsing when modifiers are not needed.
   *
   * Supported syntax is described below.
   * Please note that this syntax is still ruled by {@link https://html.spec.whatwg.org/#attributes-2 | HTML standards} and might not be fully accurate or subject to limitations.
   * It is advised to refrain from using especially complex {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Attr/name | Attr.name} that contain specials characters or structures that may prove both confusing and challenging to parse.
   *
   * > ```
   * > ┌────────┬──────┬─────┬───────────┬─────┬───────┐
   * > │ PREFIX │ NAME │ TAG │ MODIFIERS │ '=' │ VALUE │
   * > └────────┴──────┴─────┴───────────┴─────┴───────┘
   * >
   * > PREFIX
   * >   └─[   PREFIX]── STRING
   * >
   * > NAME
   * >   ├─[  ESCAPED]── STRING '{' STRING '}'
   * >   └─[ UNDOTTED]── [^.]
   * >
   * > TAG
   * >   ├─[      TAG]── '[' STRING ']'
   * >   └─[     NONE]── ∅
   * >
   * > MODIFIERS
   * >   ├─[ MODIFIER]── '.' MODIFIER MODIFIERS
   * >   └─[     NONE]── ∅
   * >
   * > MODIFIER
   * >   ├─[      KEY]── STRING
   * >   └─[KEY+VALUE]── STRING '[' MODIFIER_VALUE ']'
   * >
   * > MODIFIER_VALUE
   * >   └─[    VALUE]── BOOLEAN | NUMBER | DURATION | STRING
   * >
   * > BOOLEAN
   * >  ├─[      TRUE]── 'yes' | 'on'  | 'true'
   * >  └─[     FALSE]── 'no'  | 'off' | 'false'
   * >
   * > NUMBER
   * >  ├─[EXPL_NEG_N]── '-' POSITIVE_NUMBER
   * >  ├─[EXPL_POS_N]── '+' POSITIVE_NUMBER
   * >  └─[IMPL_POS_N]── POSITIVE_NUMBER
   * >
   * > POSITIVE_NUMBER
   * >  ├─[   INTEGER]── [0-9]
   * >  ├─[EXPL_FLOAT]── [0-9] '.' [0-9]
   * >  └─[IMPL_FLOAT]── '.' [0-9]
   * >
   * > DURATION
   * >  └─[  DURATION]── POSITIVE_NUMBER DURATION_UNIT
   * >
   * > DURATION_UNIT
   * >  ├─[   MINUTES]── 'm'
   * >  ├─[   SECONDS]── 's'
   * >  ├─[EXPL_MILLI]── 'ms'
   * >  └─[IMPL_MILLI]── ∅
   * >
   * > STRING
   * >   └─[      ANY]── [*]
   * > ```
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const element = renderer.createElement("div", { attributes: { "*foo.bar[baz]": "true" } })
   * const [attribute] = Array.from(element.attributes)
   *
   * let parsed
   * const typings = { type: Boolean, modifiers: { bar: { type: String } } }
   *
   * parsed = renderer.parseAttribute(attribute, typings, { modifiers: true })
   * console.assert(parsed.name === "*foo")
   * console.assert(parsed.value === true)
   * console.assert(parsed.modifiers.bar === "baz")
   *
   * parsed = renderer.parseAttribute(attribute, typings, { modifiers: false, prefix: "*" })
   * console.assert(parsed.name === "foo")
   * console.assert(parsed.value === true)
   * console.assert(!("modifiers" in parsed))
   * ```
   *
   * ```ts
   * const typedef = {
   *   // "yes", "on", "true", "no", "off", "false"
   *   boolean: { type: Boolean, default: false },
   *   // "0", "3.1415", ".42", "69", etc.
   *   number: { type: Number, default: 0, min: -Infinity, max: Infinity, integer: false },
   *   // "10", "10ms", "10s", "10m", etc.
   *   duration: { type: Date, default: "0ms" },
   *   // "foo", "bar", "foobar", etc.
   *   string: { type: String, default: "" },
   *   // "foo", "bar"
   *   enum: { type: String, get default() { return this.allowed[0] } , allowed: ["foo", "bar"] },
   * }
   * ```
   */
  parseAttribute<T extends AttrTypings>(attribute: Attr, typings?: Nullable<T>, options?: Omit<RendererParseAttributeOptions, "modifiers"> & { modifiers: true }): InferAttrTypings<T>
  /**
   * Same as {@linkcode Renderer.parseAttribute()} but without modifiers.
   */
  parseAttribute<T extends AttrTypings>(attribute: Attr, typings?: Nullable<T>, options?: Omit<RendererParseAttributeOptions, "modifiers"> & { modifiers?: false }): Omit<InferAttrTypings<T>, "modifiers">
  parseAttribute<T extends AttrTypings>(attribute: Attr, typings?: Nullable<T>, { modifiers = false, prefix = "" } = {} as RendererParseAttributeOptions) {
    // Parse attribute name
    if (!this.#parsed.has(attribute)) {
      const { a: _a, b: _b, name = `${_a}${_b}`, tag = "", modifiers: _modifiers = "" } = attribute.name.match(this.#extractor.attribute)!.groups!
      const cached = { name, tag, modifiers: {} as Record<PropertyKey, unknown> }
      if (modifiers && (typings?.modifiers)) {
        const modifiers = Object.fromEntries(
          _modifiers.split(".").map((modifier) => {
            const { key, value } = modifier.match(this.#extractor.modifier)!.groups!
            if (key in typings.modifiers!) {
              return [key, value ?? ""]
            }
            return null
          }).filter((modifier): modifier is [string, string] => modifier !== null),
        )
        for (const key in typings.modifiers) {
          cached.modifiers[key] = this.#parseAttributeValue(attribute.parentElement, name, key, modifiers[key], typings.modifiers[key])
        }
      }
      this.#parsed.set(attribute, cached)
    }
    const parsed = structuredClone(this.#parsed.get(attribute)) as InferAttrTypings<T>
    // Update values that might have changed since the last parsing or options
    parsed.value = this.#parseAttributeValue(attribute.parentElement, parsed.name, "value", attribute.value, typings as AttrAny) as typeof parsed.value
    parsed.attribute = attribute
    if (prefix && (parsed.name.startsWith(prefix))) {
      parsed.name = parsed.name.slice(prefix.length)
    }
    if (!modifiers) {
      delete (parsed as Record<PropertyKey, unknown>).modifiers
    }
    return parsed
  }

  /** Internal cache used to store parsed already parsed {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Attr/name | Attr.name}. */
  // deno-lint-ignore ban-types
  readonly #parsed = new WeakMap<Attr, Pick<InferAttrTypings<{}>, "name" | "tag" | "modifiers">>()

  /** Used by {@linkcode Renderer.parseAttribute()} to parse a single {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Attr/value | Attr.value} according to specified {@linkcode AttrAny} typing. */
  #parseAttributeValue<T extends AttrAny>(element: Nullable<HTMLElement>, name: string, key: string, value: Optional<string>, typings: T): Optional<boolean | number | string> {
    if ((value === undefined) && (!typings?.enforce)) {
      return undefined
    }
    let fallback
    switch (typings?.type) {
      case Boolean: {
        const typing = typings as AttrBoolean
        fallback = typing?.default ?? true
        const { truthy, falsy } = `${value || fallback}`.match(this.#extractor.boolean)?.groups ?? {}
        if ((!truthy) && (!falsy)) {
          break
        }
        return Boolean(truthy)
      }
      case Number: {
        const typing = typings as AttrNumber
        fallback = typing?.default ?? 0
        let number = Number.parseFloat(`${value || fallback}`)
        if (typing?.integer) {
          number = Math.round(number)
        }
        if (typeof typing?.min === "number") {
          number = Math.max(typing.min, number)
        }
        if (typeof typing?.max === "number") {
          number = Math.min(typing.max, number)
        }
        if (!Number.isFinite(number)) {
          break
        }
        return number
      }
      case Date: {
        const typing = typings as AttrDuration
        fallback = typing?.default ?? 0
        const { delay, unit } = `${value || fallback}`.match(this.#extractor.duration)?.groups ?? {}
        const duration = Math.round(Number.parseFloat(delay) * ({ ms: 1, s: 1000, m: 60000 }[unit || "ms"] ?? NaN))
        if ((!Number.isFinite(duration)) || (duration < 0)) {
          break
        }
        return duration
      }
      default: {
        const typing = typings as AttrString
        fallback = typing?.default ?? ""
        const string = `${value || fallback}`
        if ((typing?.allowed?.length) && (!typing.allowed.includes(string))) {
          fallback = typing.allowed.includes(fallback) ? fallback : typing.allowed[0]
          break
        }
        return string
      }
    }
    this.warn(`Invalid value "${value}" for "${name}.${key}", fallbacking to to "${fallback}"`, element)
    return fallback
  }

  /**
   * Type guard for {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const element = renderer.createElement("div")
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   *
   * console.assert(renderer.isHtmlElement(element))
   * console.assert(!renderer.isHtmlElement(comment))
   * ```
   */
  isHtmlElement(element: HTMLElement | Comment): element is HTMLElement {
    return element.nodeType === this.window.Node.ELEMENT_NODE
  }

  /**
   * Type guard for {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment}.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   * const element = renderer.createElement("div")
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   *
   * console.assert(!renderer.isComment(element))
   * console.assert(renderer.isComment(comment))
   * ```
   */
  isComment(element: HTMLElement | Comment): element is Comment {
    return element.nodeType === this.window.Node.COMMENT_NODE
  }

  /** Warnings callback. */
  readonly #warn

  /**
   * Generate a warning message.
   *
   * If no warnings callback was provided, the warning message is applied with {@linkcode Renderer.setAttribute()} with the name `*warn`
   * to the `target` {@linkcode https://developer.mozilla.org/docs/Web/API/HTMLElement | HTMLElement} or {@linkcode https://developer.mozilla.org/docs/Web/API/Comment | Comment} if there is one.
   *
   * ```ts
   * import { Window } from "@mizu/internal/vdom"
   * const renderer = await new Renderer(new Window()).ready
   *
   * const element = renderer.createElement("div")
   * renderer.warn("foo", element)
   * console.assert(element.getAttribute("*warn") === "foo")
   *
   * const comment = renderer.comment(element, { directive: "foo", expression: "bar" })
   * renderer.warn("foo", comment)
   * console.assert(comment.nodeValue?.includes(`[*warn="foo"]`))
   * ```
   */
  warn(message: string, target?: Nullable<HTMLElement | Comment>): void {
    if (this.#warn) {
      return this.#warn(message, target)
    }
    if (target && ((this.isHtmlElement(target)) || (this.isComment(target)))) {
      return this.setAttribute(target, "*warn", message)
    }
  }
}

/** {@linkcode Renderer} options. */
export type RendererOptions = {
  /** Initial {@linkcode Directive}s. */
  directives?: Arg<Renderer["load"]>
  /** Warnings callback. */
  warn?: (message: string, target?: Nullable<HTMLElement | Comment>) => void
}

/** {@linkcode Renderer.evaluate()} options. */
export type RendererEvaluateOptions = {
  /** {@linkcode Context} to use. */
  context?: Context
  /** {@linkcode State} to use. */
  state?: State
  /** It the evaluated expression is {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/call | callable}, it will be called with these arguments and its result is returned instead. */
  args?: unknown[]
}

/** {@linkcode Renderer.render()} options. */
export type RendererRenderOptions = {
  /** {@linkcode Context} to use. */
  context?: Context
  /** {@linkcode State} to use. */
  state?: State
  /** Whether to render subtrees that do not possess the explicit rendering attribute. */
  implicit?: boolean
  /** Whether to enable reactivity. */
  reactive?: boolean
  /** {@link https://developer.mozilla.org/docs/Web/API/Document/querySelector | CSS selector} to query select the return. */
  select?: string
  /** Whether to return the result as an HTML string. */
  stringify?: boolean
  /** Whether to throw on errors. */
  throw?: boolean
}

/** {@linkcode Renderer.parseAttribute()} options. */
export type RendererParseAttributeOptions = {
  /** Whether to parse modifiers. */
  modifiers?: boolean
  /** Attribute name prefix to strip. */
  prefix?: string
}

/** {@linkcode Renderer.render()} initial {@linkcode Context} and {@linkcode State}. */
export type InitialContextState = Readonly<{
  /** Initial {@linkcode Context}. */
  context: Context
  /** Initial {@linkcode State}. */
  state: DeepReadonly<State>
}>

/** Current {@linkcode Renderer.render()} state. */
export type State = Record<`$${string}` | `${typeof Renderer.internal}_${string}`, unknown>

/** Boolean type definition. */
export type AttrBoolean = {
  /** Type. */
  type: typeof Boolean
  /** Default value. */
  default?: boolean
  /** Enforce value. */
  enforce?: true
}

/** Duration type definition. */
export type AttrDuration = {
  /** Type. */
  type: typeof Date
  /** Default value. */
  default?: number | string
  /** Enforce value. */
  enforce?: true
}

/** Number type definition. */
export type AttrNumber = {
  /** Type. */
  type: typeof Number
  /** Default value. */
  default?: number
  /** Round to nearest integer. */
  integer?: boolean
  /** Minimum value. */
  min?: number
  /** Maximum value. */
  max?: number
  /** Enforce value. */
  enforce?: true
}

/** String type definition. */
export type AttrString = {
  /** Type. */
  type?: typeof String
  /** Default value. */
  default?: string
  /** Allowed values. */
  allowed?: string[]
  /** Enforce value. */
  enforce?: true
}

/** Generic type definition. */
export type AttrAny = {
  /** Type. */
  type?: typeof Boolean | typeof Number | typeof Date | typeof String
  /** Default value. */
  default?: unknown
  /** Enforce value. */
  enforce?: true
}

/** Infer value from {@linkcode AttrAny} type definition. */
export type InferAttrAny<T> = T extends AttrBoolean ? boolean : T extends (AttrDuration | AttrNumber) ? number : string

/** Type definition for {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} compatible with {@linkcode Renderer.parseAttribute()}. */
export type AttrTypings = Omit<AttrAny & { modifiers?: Record<PropertyKey, AttrAny> }, "enforce">

/** Infer value from {@linkcode AttrTypings} type definition. */
export type InferAttrTypings<T extends AttrTypings> = {
  /** Parsed {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} reference. */
  attribute: Attr
  /** Parsed {@linkcode https://developer.mozilla.org/docs/Web/API/Attr/name | Attr.name}. */
  name: string
  /** Parsed {@linkcode https://developer.mozilla.org/docs/Web/API/Attr/value | Attr.value}. */
  value: InferAttrAny<T>
  /** Parsed {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} tag. */
  tag: string
  /** Parsed {@linkcode https://developer.mozilla.org/docs/Web/API/Attr | Attr} modifiers. */
  modifiers: { [P in keyof T["modifiers"]]: T["modifiers"][P] extends { enforce: true } ? InferAttrAny<T["modifiers"][P]> : Optional<InferAttrAny<T["modifiers"][P]>> }
}

/** Additional typings for {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Window | Window} when using a {@link https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model | virtual DOM implementation}. */
export type VirtualWindow = Window & {
  Node: typeof Node
  HTMLElement: typeof HTMLElement
  Event: typeof Event
  NodeFilter: typeof NodeFilter
  KeyboardEvent: typeof KeyboardEvent
  MouseEvent: typeof MouseEvent
  [Symbol.asyncDispose]: () => Promise<void>
}
