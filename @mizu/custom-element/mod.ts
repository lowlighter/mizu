// Imports
import { type Cache, type Directive, type Nullable, Phase } from "@mizu/mizu/core/engine"
import { isValidCustomElementName } from "@std/html/is-valid-custom-element-name"
export type * from "@mizu/mizu/core/engine"

/** `*custom-element` typings. */
export const typings = {
  modifiers: {
    flat: { type: Boolean },
  },
} as const

/** `*custom-element` directive. */
export const _custom_element = {
  name: "*custom-element",
  phase: Phase.CUSTOM_ELEMENT,
  typings,
  init(renderer) {
    renderer.cache<Cache<typeof _custom_element>>(this.name, new WeakMap())
  },
  setup(renderer, element, { cache }) {
    if ((renderer.isHtmlElement(element)) && (cache.get(element))) {
      return {
        state: {
          $slots: cache.get(element)!,
          $attrs: Object.fromEntries(Array.from(element.attributes).map(({ name, value }) => [name, value])),
        },
      }
    }
  },
  async execute(renderer, element, { cache, attributes: [attribute], ...options }) {
    // Validate element and custom element name
    if (renderer.isComment(element)) {
      return
    }
    if ((element.tagName !== "TEMPLATE")) {
      renderer.warn(`A [${this.name}] directive must be defined on a <template> element, ignoring`, element)
      return { final: true }
    }
    const tagname = isValidCustomElementName(attribute.value) ? attribute.value : `${await renderer.evaluate(element, attribute.value || "''", options)}`
    if (!tagname) {
      renderer.warn(`A [${this.name}] directive must have a valid custom element name, ignoring`, element)
      return { final: true }
    }

    // Skip already registered custom elements
    if (cache.has(element)) {
      return { final: true }
    }
    if (renderer.window.customElements.get(tagname)) {
      renderer.warn(`<${tagname}> is already registered as a custom element, ignoring`, element)
      return { final: true }
    }
    cache.set(element, null)

    // Register custom element
    const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
    renderer.window.customElements.define(
      tagname,
      class extends renderer.window.HTMLElement {
        connectedCallback(this: HTMLElement) {
          // Store provided content and replace it by the template
          const content = Array.from(renderer.createElement("div", { innerHTML: this.innerHTML.trim() }).childNodes) as HTMLElement[]
          this.innerHTML = element.innerHTML

          // Sort provided content into their designated <slot>
          const slots = cache.set(this, {}).get(this)!
          for (const child of content) {
            const names = []
            if (child.nodeType === renderer.window.Node.ELEMENT_NODE) {
              names.push(...renderer.getAttributes(child, _slot.name).map((attribute) => attribute.name.slice(_slot.prefix.length)))
            }
            if (!names.length) {
              names.push("")
            }
            for (const name of names) {
              slots[name] ??= renderer.createElement("slot")
              slots[name].appendChild(child.cloneNode(true))
            }
          }
          Object.entries(slots).forEach(([name, content]) => {
            this.querySelectorAll<HTMLSlotElement>(`slot${name ? `[name="${name}"]` : ":not([name])"}`).forEach((slot) => renderer.replaceElementWithChildNodes(slot, content))
          })
          this.querySelectorAll<HTMLSlotElement>("slot").forEach((slot) => renderer.replaceElementWithChildNodes(slot, slot))
          if (parsed.modifiers.flat) {
            renderer.replaceElementWithChildNodes(this, this)
          }
        }
      },
    )
    return { final: true }
  },
} as Directive<WeakMap<HTMLElement, Nullable<Record<PropertyKey, HTMLSlotElement>>>, typeof typings> & { name: string }

/** `#slot` directive. */
export const _slot = {
  name: /^#(?<slot>)/,
  prefix: "#",
  phase: Phase.META,
} as Directive & { prefix: string }

/** Default exports. */
export default [_custom_element, _slot]
