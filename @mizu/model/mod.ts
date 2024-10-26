// Imports
import { type Cache, type callback, type Directive, type Modifiers, type Nullable, Phase } from "@mizu/mizu/core/engine"
import { equal } from "@std/assert"
import { _event } from "@mizu/event"
export type * from "@mizu/mizu/core/engine"

/** `::value` typings. */
export const typings = {
  modifiers: {
    event: { type: String, default: "input", enforce: true },
    name: { type: Boolean },
    value: { type: Boolean },
    throttle: { type: Date, default: 250 },
    debounce: { type: Date, default: 250 },
    keys: { type: String },
  },
} as const

/** `::value` directive. */
export const _model_value = {
  name: /^::(?<value>)$/,
  prefix: "::",
  phase: Phase.ATTRIBUTE_MODEL_VALUE,
  typings,
  init(renderer) {
    if (!renderer.cache(this.name)) {
      renderer.cache<Cache<typeof _model_value>>(this.name, new WeakMap())
    }
  },
  async execute(renderer, element, { attributes: [attribute], cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, this.typings, { prefix: this.prefix, modifiers: true })
    const cached = cache.get(element)?.get(element) || cache.set(element, new WeakMap([[element, { model: { read: null, sync: null }, event: null, init: false }]])).get(element)!.get(element)!
    const input = element as HTMLInputElement
    const type = input.tagName === "INPUT" ? input.getAttribute("type") : input.tagName === "SELECT" ? input.tagName : null

    // Setup model sync callback (model > value)
    if (!cached.model.sync) {
      cached.model.sync = async function () {
        const model = await renderer.evaluate(input, attribute.value, options)
        const value = parse(read(input), parsed.modifiers)
        switch (type) {
          // Radio: checked if model is equal to value
          case "radio":
            input.checked = equal(model, value)
            break
          // Checkbox: checked if model includes value
          case "checkbox":
            input.checked = Array.isArray(model) ? model.includes(value) : false
            break
          // Select: special handling for multiple select
          case "SELECT": {
            const select = element as HTMLSelectElement
            if (select.multiple) {
              Array.from(select.options).forEach((option) => {
                option.selected = Array.isArray(model) ? model.includes(parse(option.value, parsed.modifiers)) : false
              })
              break
            }
          }
          // falls through
          // Default: sync value with model if different (defaults to "")
          default:
            if (!equal(model, value)) {
              input.value = `${model ?? ""}`
            }
            break
        }
      }
    }

    // Setup model read callback (value > model)
    if (!cached.model.read) {
      cached.model.read = async function () {
        const model = await renderer.evaluate(input, attribute.value, options)
        let value = parse(read(input), parsed.modifiers)
        switch (type) {
          // Checkbox: toggle value in model
          case "checkbox": {
            const array = Array.isArray(model) ? model : []
            if (!input.checked) {
              for (let i = array.length - 1; i >= 0; i--) {
                if (array[i] === value) {
                  array.splice(i, 1)
                }
              }
            } else if (!array.includes(value)) {
              array.push(value)
            }
            if (array === model) {
              return
            }
            value = array
            break
          }
          // Radio: clean value if last value unchecked
          case "radio":
            if ((equal(model, value)) && (!input.checked)) {
              value = undefined
            }
            break
          // Number: convert value to number
          case "number":
            value = Number(value)
        }
        await renderer.evaluate(input, `${attribute.value}=${renderer.internal("value")}`, { ...options, state: { ...options.state, [renderer.internal("value")]: value } })
      }
    }

    // Prevent initialization from running multiple times
    if (!cached.init) {
      cached.init = true
      // Auto-assign name attribute if missing
      if (parsed.modifiers.name && (!input.hasAttribute("name"))) {
        input.setAttribute("name", attribute.value)
      }
      // Auto-initialize value if missing
      if (parsed.modifiers.value && (input.getAttribute("value"))) {
        await renderer.evaluate(input, `${attribute.value}??=${renderer.internal("value")}`, { ...options, state: { ...options.state, [renderer.internal("value")]: parse(read(input), parsed.modifiers) } })
      }
      // Setup event listener
      await _event.execute.call(this, renderer, element, { ...arguments[2], attributes: [attribute], _event: parsed.modifiers.event, _callback: cached.model.read })
    }

    await cached.model.sync()
  },
} as Directive<WeakMap<HTMLElement, WeakMap<HTMLElement, { model: Record<"read" | "sync", Nullable<callback>>; event: Nullable<string>; init: boolean }>>, typeof typings>

/** Default exports. */
export default [_model_value]

/** Read input value. */
function read(input: HTMLElement) {
  let value = null as unknown
  switch (input.tagName) {
    case "SELECT": {
      const select = input as HTMLSelectElement
      value = Array.from(select.selectedOptions).map((option) => option.value)
      if (!select.multiple) {
        value = (value as string[])[0]
      }
      break
    }
    default:
      value = (input as HTMLInputElement).value
      break
  }
  return value
}

/** Parse input value. */
function parse(value: unknown, _modifiers: Modifiers<typeof _model_value>) {
  return value
}
