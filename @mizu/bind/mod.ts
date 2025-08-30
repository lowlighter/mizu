// Imports
import { type Cache, type Directive, Phase } from "@mizu/internal/engine"
import { toCamelCase } from "@std/text"
import { boolean } from "./boolean.ts"
export type * from "@mizu/internal/engine"

/** `:bind` directive. */
export const _bind = {
  name: /^:(?!:)(?<attribute>)/,
  prefix: ":",
  phase: Phase.ATTRIBUTE,
  multiple: true,
  default: "$<attribute>",
  init(renderer) {
    if (!renderer.cache(this.name)) {
      renderer.cache<Cache<typeof this>>(this.name, new WeakMap())
    }
  },
  async execute(renderer, element, { attributes, cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const cached = cache.get(element) ?? cache.set(element, {}).get(element)!
    const parsed = attributes.map((attribute) => renderer.parseAttribute(attribute, {}, { prefix: this.prefix }))

    // Handle shorthand attributes binding
    const shorthand = parsed.findIndex(({ name }) => !name.length)
    if (~shorthand) {
      const [attribute] = parsed.splice(shorthand, 1)
      const value = await renderer.evaluate(element, attribute.value, options)
      if (typeof value === "object") {
        parsed.unshift(...Object.entries(value ?? {}).map(([name, value]) => ({ ...attribute, name, value })))
      } else {
        renderer.warn(`[${this.name}] empty shorthand expects an object but got ${typeof value}, ignoring`, element)
      }
    }

    // Bind attributes
    for (const { name, value: expression, attribute } of parsed) {
      const value = attribute.name === ":" ? expression : await renderer.evaluate(element, expression || toCamelCase(name), options)
      switch (true) {
        // Class attributes
        case name === "class": {
          cached.class ??= element.getAttribute("class") ?? ""
          element.setAttribute("class", `${cached.class}`)
          ;[value].flat(Infinity).forEach((classlist) => {
            if ((typeof classlist === "object") && classlist) {
              Object.entries(classlist).forEach(([name, value]) => value && element.classList.add(name))
            } else if (typeof classlist === "string") {
              element.classList.add(...classlist.split(" ").map((name) => name.trim()).filter(Boolean))
            }
          })
          break
        }
        // Style attributes
        case name === "style": {
          cached.style ??= element.getAttribute("style") ?? ""
          element.setAttribute("style", `${cached.style}`)
          ;[value].flat(Infinity).forEach((style) => {
            if ((typeof style === "object") && style) {
              Object.entries(style).forEach(([name, value]) => {
                const property = name.startsWith("--") ? name : name.replace(/([a-z])([A-Z])/g, "$1-$2")
                const [match = "", priority = ""] = `${value}`.match(/\s!(important)[\s;]*$/) ?? []
                const style = `${value}`.replace(match, "")
                element.style.setProperty(property, style, priority)
                if ((typeof value === "number") && (!element.style.getPropertyValue(property))) {
                  element.style.setProperty(property, `${value}px`)
                }
              })
            } else if (typeof style === "string") {
              element.style.cssText += style
            }
          })
          if (!element.style.length) {
            element.removeAttribute("style")
          }
          break
        }
        // Boolean attributes
        case boolean(element.tagName, name):
          element.toggleAttribute(name, Boolean(value))
          break
        // Generic attributes
        default:
          if ((value === undefined) || (value === null)) {
            element.removeAttribute(name)
            break
          }
          element.setAttribute(name, `${value}`)
      }
    }
  },
} as const satisfies Directive<{
  Name: RegExp
  Cache: WeakMap<HTMLElement, { class?: string; style?: string }>
  Default: true
}>

/** `:class` directive. */
export const _bind_class = _bind as typeof _bind

/** `:style` directive. */
export const _bind_style = _bind as typeof _bind

/** Default exports. */
export default _bind
