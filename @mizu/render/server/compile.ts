// Imports
import type { Arrayable, Callback, Nullable, Optional } from "@libs/typing/types"
import type { Context, Directive, Renderer } from "@mizu/internal/engine"
import _mizu from "@mizu/mizu"
import _bind from "@mizu/bind"
import _clean from "@mizu/clean"
import _code from "@mizu/code"
import _custom_element from "@mizu/custom-element"
import _eval from "@mizu/eval"
import _event from "@mizu/event"
import _for from "@mizu/for/empty"
import _html from "@mizu/html"
import _http from "@mizu/http/event"
import _if from "@mizu/if/else"
import _is from "@mizu/is"
import _markdown from "@mizu/markdown"
import _model from "@mizu/model"
import _mustache from "@mizu/mustache"
import _once from "@mizu/once"
import _ref from "@mizu/ref"
import _refresh from "@mizu/refresh"
import _set from "@mizu/set"
import _show from "@mizu/show"
import _skip from "@mizu/skip"
import _text from "@mizu/text"
import _toc from "@mizu/toc"

/**
 * Directives that can be bundled by `Server.compile()`, indexed by module specifier.
 *
 * A directive found in a compiled subtree is looked up here to know which module the generated entrypoint must import.
 * Additional entries may be passed through the `modules` option for custom directives.
 */
export const modules = {
  [import.meta.resolve("@mizu/mizu")]: _mizu,
  [import.meta.resolve("@mizu/bind")]: _bind,
  [import.meta.resolve("@mizu/clean")]: _clean,
  [import.meta.resolve("@mizu/code")]: _code,
  [import.meta.resolve("@mizu/custom-element")]: _custom_element,
  [import.meta.resolve("@mizu/eval")]: _eval,
  [import.meta.resolve("@mizu/event")]: _event,
  [import.meta.resolve("@mizu/for/empty")]: _for,
  [import.meta.resolve("@mizu/html")]: _html,
  [import.meta.resolve("@mizu/http/event")]: _http,
  [import.meta.resolve("@mizu/if/else")]: _if,
  [import.meta.resolve("@mizu/is")]: _is,
  [import.meta.resolve("@mizu/markdown")]: _markdown,
  [import.meta.resolve("@mizu/model")]: _model,
  [import.meta.resolve("@mizu/mustache")]: _mustache,
  [import.meta.resolve("@mizu/once")]: _once,
  [import.meta.resolve("@mizu/ref")]: _ref,
  [import.meta.resolve("@mizu/refresh")]: _refresh,
  [import.meta.resolve("@mizu/set")]: _set,
  [import.meta.resolve("@mizu/show")]: _show,
  [import.meta.resolve("@mizu/skip")]: _skip,
  [import.meta.resolve("@mizu/text")]: _text,
  [import.meta.resolve("@mizu/toc")]: _toc,
} as Record<string, Arrayable<Directive>>

/** Compilation options. */
export type CompileOptions = {
  /** Context shipped with the element. */
  context: Context
  /** Directives that can be bundled, indexed by module specifier. */
  modules: Record<string, Arrayable<Directive>>
  /** Entrypoint script, given by its depth relative to the compiled element and its content. */
  script: { depth: number; content: string }
  /** Warning callback. */
  warn: (message: string) => void
}

/** Generate the entrypoint of a compiled element, importing the engine along with the directives used in its subtree, and shipping its context. */
export function entrypoint(renderer: Renderer, element: HTMLElement, { context, modules, script, warn }: CompileOptions): string {
  const elements = Array.from(walk(element))
  const imports = Object.entries(modules)
    .filter(([_, directives]) => ([directives].flat(Infinity) as Directive[]).some((directive) => elements.some((element) => renderer.getAttributes(element, directive.name, { first: true }))))
    .map(([specifier]) => specifier)
  return [
    `import { Context, Renderer } from ${quote(import.meta.resolve("@mizu/internal/engine"))}`,
    ...imports.map((specifier, i) => `import $${i} from ${quote(specifier)}`),
    `const $element = document.currentScript${".parentElement".repeat(script.depth)}`,
    `const $context = ${literal(context, warn)}`,
    "const Mizu = {",
    "  async hydrate({ context = {}, ...options } = {}) {",
    `    const renderer = await new Renderer(globalThis, { directives: [${imports.map((_, i) => `$${i}`).join(", ")}], warn: console.warn }).ready`,
    `    return renderer.render($element, { reactive: true, ...options, context: new Context({ ...$context, ...context }), state: { $renderer: "client", ...options.state } })`,
    "  },",
    "}",
    script.content,
  ].join("\n")
}

/** `Deno.bundle()` typings (unstable). */
type Bundler = (options: { entrypoints: string[]; write: false; minify: boolean; platform: "browser"; format: "iife" }) => Promise<{ success: boolean; errors: Array<{ text: string }>; outputFiles?: Array<{ text(): string }> }>

/**
 * Bundle an entrypoint into a minified classic script with `Deno.bundle()`.
 *
 * `</script` is already escaped by the bundler within literals, but `<!--` is not and would switch the HTML parser to its escaped state,
 * preventing the closing tag from being recognized. It is escaped here, which the bundler never emits outside of a literal.
 */
export async function bundle(source: string): Promise<string> {
  const entrypoints = [`data:text/javascript,${encodeURIComponent(source)}`]
  const result = await (Deno as unknown as { bundle: Bundler }).bundle({ entrypoints, write: false, minify: true, platform: "browser", format: "iife" })
  if ((!result.success) || (!result.outputFiles?.length)) {
    throw new Error(`Failed to bundle compiled element:\n${result.errors.map((error) => error.text).join("\n")}`)
  }
  return result.outputFiles[0].text().replace(/<!--/g, "<\\x21--")
}

/** Iterate over an element, its descendants and their template contents. */
export function* walk(node: HTMLElement | DocumentFragment): Generator<HTMLElement> {
  if ("tagName" in node) {
    yield node
  }
  for (const child of Array.from(node.children)) {
    yield* walk(child as HTMLElement)
  }
  if (("content" in node) && (node.content)) {
    yield* walk(node.content as DocumentFragment)
  }
}

/** Serialize the (unproxied) variables of a context into an object literal, skipping the ones that cannot be serialized. */
function literal(context: Context, warn: CompileOptions["warn"]) {
  const entries = []
  for (const key of Object.keys(context.target)) {
    try {
      entries.push(`${quote(key)}: ${serialize(Object.getOwnPropertyDescriptor(context.target, key)?.value)}`)
    } catch (error) {
      warn(`unable to serialize "${key}" (${error.message}), skipping`)
    }
  }
  return `{ ${entries.join(", ")} }`
}

/**
 * Serialize a value into JavaScript code.
 *
 * Supported values are primitives, arrays, plain objects, dates, regular expressions, maps, sets and functions.
 * Functions are serialized from their source (losing their closure), and native functions are referenced from `globalThis` (e.g. `Math.random`).
 * A `TypeError` is thrown for other values and circular references.
 */
export function serialize(value: unknown, seen = new WeakSet<object>()): string {
  switch (typeof value) {
    case "undefined":
      return "undefined"
    case "boolean":
    case "number":
      return `${value}`
    case "bigint":
      return `${value}n`
    case "string":
      return quote(value)
    case "symbol":
      throw new TypeError("symbols are not supported")
    case "function":
      return callable(value as Callback)
  }
  if (value === null) {
    return "null"
  }
  if (seen.has(value as object)) {
    throw new TypeError("circular references are not supported")
  }
  seen.add(value as object)
  if (Array.isArray(value)) {
    return `[${value.map((item) => serialize(item, seen)).join(", ")}]`
  }
  if (value instanceof Date) {
    return `new Date(${value.getTime()})`
  }
  if (value instanceof RegExp) {
    return `${value}`
  }
  if (value instanceof Map) {
    return `new Map([${Array.from(value, ([key, item]) => `[${serialize(key, seen)}, ${serialize(item, seen)}]`).join(", ")}])`
  }
  if (value instanceof Set) {
    return `new Set([${Array.from(value, (item) => serialize(item, seen)).join(", ")}])`
  }
  const prototype = Object.getPrototypeOf(value)
  if ((prototype !== Object.prototype) && (prototype !== null)) {
    throw new TypeError(`${prototype.constructor?.name ?? "object"} instances are not supported`)
  }
  return `{ ${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${quote(key)}: ${serialize(item, seen)}`).join(", ")} }`
}

/** Serialize a function into JavaScript code (method shorthands are converted into function expressions, and native functions are referenced from `globalThis`). */
function callable(value: Callback): string {
  const source = Function.prototype.toString.call(value)
  if (/\{\s*\[native code\]\s*\}$/.test(source)) {
    const path = native(value)
    if (!path) {
      throw new TypeError("native function is not reachable from globalThis")
    }
    return path
  }
  if (/^(?:get|set)\s+[\w$]+\s*\(/.test(source)) {
    throw new TypeError("accessors are not supported")
  }
  if (/^(?:async\s+)?function\b|^class\b/.test(source)) {
    return `(${source})`
  }
  return `(${source.replace(/^(async\s+)?(\*\s*)?([\w$]+\s*\()/, (_, async = "", generator = "", rest) => `${async}function${generator ? "*" : ""} ${rest}`)})`
}

/** Native functions reachable from `globalThis`, indexed by identity. */
let natives = null as Nullable<Map<unknown, string>>

/** Resolve the path of a native function from `globalThis` (e.g. `Math.random`). */
function native(value: Callback): Optional<string> {
  if (!natives) {
    natives = new Map()
    const register = (value: unknown, path: string, depth: number) => {
      if ((typeof value !== "function") && ((typeof value !== "object") || (value === null))) {
        return
      }
      if ((typeof value === "function") && (!natives!.has(value))) {
        natives!.set(value, path)
      }
      if (depth >= 2) {
        return
      }
      for (const key of Object.getOwnPropertyNames(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)
        if (descriptor && ("value" in descriptor) && (/^[\w$]+$/.test(key))) {
          register(descriptor.value, `${path}.${key}`, depth + 1)
        }
      }
    }
    for (const key of Object.getOwnPropertyNames(globalThis)) {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
      if (descriptor && ("value" in descriptor) && (/^[A-Za-z_$][\w$]*$/.test(key)) && (!["Deno", "process", "globalThis", "global", "window", "self"].includes(key))) {
        register(descriptor.value, key, 0)
      }
    }
  }
  return natives.get(value)
}

/** Serialize a string into a JavaScript literal safe for inline scripts. */
function quote(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}
