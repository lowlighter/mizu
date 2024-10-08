// Imports
import { type Cache, type callback, type Directive, Phase } from "@mizu/mizu/core/engine"
import { keyboard } from "./keyboard.ts"
export type * from "@mizu/mizu/core/engine"

/** `@event` typings. */
export const typings = {
  modifiers: {
    throttle: { type: Date, default: 250 },
    debounce: { type: Date, default: 250 },
    keys: { type: String },
    prevent: { type: Boolean },
    stop: { type: Boolean },
    self: { type: Boolean },
    attach: { type: String, allowed: ["element", "window", "document"] },
    passive: { type: Boolean },
    once: { type: Boolean },
    capture: { type: Boolean },
  },
} as const

/**
 * `@event` directive.
 *
 * @internal `_event` Force the directive to use specified event name rather than the attribute name, provided that a single attribute was passed.
 * @internal `_callback` Force the directive to use specified callback rather than the attribute value.
 */
export const _event = {
  name: /^@(?<event>)/,
  prefix: "@",
  phase: Phase.INTERACTIVITY,
  default: "null",
  typings,
  multiple: true,
  init(renderer) {
    if (!renderer.cache(this.name)) {
      renderer.cache<Cache<typeof _event>>(this.name, new WeakMap())
    }
  },
  async execute(renderer, element, { cache, attributes, context, state }) {
    if (renderer.isComment(element)) {
      return
    }
    const parsed = attributes.map((attribute) => renderer.parseAttribute(attribute, this.typings, { prefix: this.prefix, modifiers: true }))
    if ((arguments[2]._event) && (arguments[2].attributes.length === 1)) {
      parsed[0].name = arguments[2]._event
    }

    // Handle shorthand listeners attachment
    const shorthands = parsed.filter(({ name }) => !name.length)
    if (shorthands.length) {
      for (const shorthand of shorthands) {
        const [attribute] = parsed.splice(parsed.indexOf(shorthand), 1)
        const value = await renderer.evaluate(element, attribute.value, { context, state })
        if (typeof value === "object") {
          parsed.unshift(...Object.entries(value ?? {}).map(([name, value]) => ({ ...attribute, name, value })))
        } else {
          renderer.warn(`[${this.name}] empty shorthand expects an object but got ${typeof value}, ignoring`, element)
        }
      }
    }

    // Attach listeners
    for (const { name: event, value: expression, modifiers, attribute } of parsed) {
      // Ensure listener is not duplicated
      if (!cache.has(element)) {
        cache.set(element, new WeakMap())
      }
      if (!cache.get(element)!.has(attribute)) {
        cache.get(element)!.set(attribute, new Map())
      }
      if (cache.get(element)!.get(attribute)!.has(event)) {
        continue
      }

      // Create callback
      const _callback = arguments[2]._callback
      let callback = function (event: Event) {
        // Ignore and remove expired listeners
        if (!element.hasAttribute(attribute.name)) {
          const registered = cache.get(element)?.get(attribute)?.get(event.type)
          if (registered) {
            registered.target.removeEventListener(event.type, registered.listener)
          }
          cache.get(element)?.get(attribute)?.delete(event.type)
          if (!cache.get(element)?.get(attribute)?.size) {
            cache.get(element)?.delete(attribute)
          }
          return
        }
        // Execute callback
        if (_callback) {
          _callback(event, { attribute, expression })
          return
        }
        if (typeof (expression as string | callback) === "function") {
          ;(expression as unknown as callback)(event)
          return
        }
        renderer.evaluate(element, `${expression || _event.default}`, { context, state: { ...state, $event: event }, args: [event] })
      } as callback
      // Apply keyboard modifiers to callback
      if (modifiers.keys) {
        const check = keyboard(modifiers.keys)
        callback = ((callback) =>
          function (event: KeyboardEvent) {
            return check(event) ? callback(...arguments) : false
          })(callback)
      }
      // Apply throttle modifier to callback
      if (modifiers.throttle) {
        let throttled = false
        callback = ((callback) =>
          function () {
            if (throttled) {
              return false
            }
            throttled = true
            try {
              return callback(...arguments)
            } finally {
              setTimeout(() => throttled = false, modifiers.throttle)
            }
          })(callback)
      }
      // Apply debounce modifier to callback
      if (modifiers.debounce) {
        let timeout = NaN
        callback = ((callback) =>
          function () {
            const args = arguments
            clearTimeout(timeout)
            timeout = setTimeout(() => callback(...args), modifiers.debounce)
            return false
          })(callback)
      }

      // Create listener
      const listener = function (event: Event) {
        if (modifiers.prevent) {
          event.preventDefault()
        }
        if (modifiers.stop) {
          event.stopPropagation()
        }
        if (modifiers.self && event.target !== element) {
          return
        }
        return callback(event)
      }

      // Attach listener
      const target = { window: renderer.window, document: renderer.document }[modifiers.attach as string] ?? element
      target.addEventListener(event, listener, { passive: modifiers.passive, once: modifiers.once, capture: modifiers.capture })
      cache.get(element)?.get(attribute)?.set(event, { target, listener })
    }
  },
} as Directive<WeakMap<HTMLElement, WeakMap<Attr, Map<string, { target: EventTarget; listener: EventListener }>>>, typeof typings> & { typings: typeof typings; execute: NonNullable<Directive["execute"]> }

/** Default exports. */
export default _event
