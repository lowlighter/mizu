// Imports
import type { Callback } from "@mizu/internal/engine"

/**
 * Serialize a value into JavaScript source.
 *
 * Supported values are primitives, arrays, plain objects, functions (which lose their closure), dates, regular expressions, maps and sets.
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
      return JSON.stringify(value)
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
  return `{ ${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${JSON.stringify(key)}: ${serialize(item, seen)}`).join(", ")} }`
}

/** Serialize a function into a JavaScript expression (method shorthands are converted into function expressions). */
function callable(value: Callback) {
  const source = Function.prototype.toString.call(value)
  if (/\{\s*\[native code\]\s*\}$/.test(source)) {
    throw new TypeError("native functions are not supported")
  }
  if (/^(?:get|set)\s+[\w$]+\s*\(/.test(source)) {
    throw new TypeError("accessors are not supported")
  }
  if (/^(?:async\s+)?function\b|^class\b/.test(source)) {
    return `(${source})`
  }
  return `(${source.replace(/^(async\s+)?(\*\s*)?([\w$]+\s*\()/, (_, async = "", generator = "", rest) => `${async}function${generator ? "*" : ""} ${rest}`)})`
}
