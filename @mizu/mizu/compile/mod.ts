// Imports
import { type Compilation, type Context, type Directive, Phase } from "@mizu/internal/engine"
import { serialize } from "./serialize.ts"
export type * from "@mizu/internal/engine"

/** `*mizu.compile` cache. */
export type Cache = { id: number; compilations: WeakMap<HTMLElement | Comment, Compilation> }

/**
 * `*mizu.compile` directive.
 *
 * Directives implementing {@linkcode Directive.compile()} are compiled into a single script appended to the element, and their attributes are removed.
 * The context is shipped along with the script.
 */
export const _mizu_compile = {
  name: "*mizu.compile",
  phase: Phase.ELIGIBILITY,
  init(renderer) {
    renderer.cache<Cache>(this.name, { id: 0, compilations: new WeakMap() })
  },
  execute(renderer, element, { cache }) {
    const compilation = [] as Compilation
    cache.compilations.set(element, compilation)
    return { state: { [renderer.internal("compile")]: compilation } }
  },
  cleanup(renderer, element, { cache, context }) {
    const compilation = cache.compilations.get(element)
    if (!compilation) {
      return
    }
    cache.compilations.delete(element)
    if (!renderer.isHtmlElement(element)) {
      return
    }
    renderer.getAttributes(element, this.name).forEach((attribute) => element.removeAttributeNode(attribute))
    if (!compilation.length) {
      return
    }

    // Identify compiled elements, resolve their local scopes (state variables and context variables differing from the root context) and remove their attributes
    const warn = (message: string) => renderer.warn(`[${this.name}] ${message}`, element)
    const root = variables(context)
    const scopes = new Map<Context, string>()
    const fragments = []
    for (const compiled of compilation) {
      if (!renderer.isHtmlElement(compiled.element)) {
        continue
      }
      if (!compiled.element.hasAttribute("data-mizu")) {
        renderer.setAttribute(compiled.element, "data-mizu", `${++cache.id}`)
      }
      if (!scopes.has(compiled.context)) {
        const local = Object.entries(compiled.state).filter(([key]) => key.startsWith("$")).map(([key, value]) => [key, value, true] as Entry)
        if (compiled.context !== context) {
          local.push(...Array.from(variables(compiled.context)).filter(([key, value]) => (!root.has(key)) || (root.get(key) !== value)).map(([key, value]) => [key, value] as Entry))
        }
        scopes.set(compiled.context, literal(local, warn))
      }
      fragments.push(`;(function ($element, $scope) {\n${compiled.script}\n})(document.querySelector('[data-mizu="${compiled.element.getAttribute("data-mizu")}"]'), $scopes[${Array.from(scopes.keys()).indexOf(compiled.context)}])`)
      compiled.attributes.forEach((attribute) => attribute.ownerElement?.removeAttributeNode(attribute))
    }

    // Ship context and scopes (functions are defined within the context scope so they can resolve shipped variables)
    const script = renderer.document.createElement("script")
    renderer.setAttribute(script, "data-mizu", "")
    script.textContent = [
      "(function () {",
      "const $context = {}, $scopes = []",
      "with ($context) {",
      `Object.assign($context, ${literal(Array.from(root).map(([key, value]) => [key, value] as Entry), warn)})`,
      `$scopes.push(${Array.from(scopes.values()).join(", ")})`,
      "}",
      ...fragments,
      "})()",
    ].filter(Boolean).join("\n").replace(/<\/script/gi, "<\\/script")
    element.appendChild(script)
  },
} as const satisfies Directive<{
  Cache: Cache
}>

/** Resolve the (unproxied) variables of a {@linkcode Context}. */
function variables(context: Context) {
  return new Map(Object.keys(context.target).map((key) => [key, Object.getOwnPropertyDescriptor(context.target, key)?.value]))
}

/** Variable entry (name, value, and whether it can be skipped silently when it cannot be serialized). */
type Entry = [string, unknown, boolean?]

/** Serialize variables into an object literal, skipping the ones that cannot be serialized. */
function literal(entries: Entry[], warn: (message: string) => void) {
  const serialized = []
  for (const [key, value, silent] of entries) {
    try {
      serialized.push(`${JSON.stringify(key)}: ${serialize(value)}`)
    } catch (error) {
      if (!silent) {
        warn(`unable to serialize "${key}" (${error.message}), skipping`)
      }
    }
  }
  return `{ ${serialized.join(", ")} }`
}

/** Default exports. */
export default _mizu_compile
