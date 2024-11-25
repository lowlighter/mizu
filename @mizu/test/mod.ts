// Imports
import { type Directive, type NonVoid, Phase } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** Delta for {@linkcode Phase} to prevent collisions when {@linkcode Directive.multiple} is not enabled. */
const PHASE_TESTING_DELTA = -0.5

/** `~test` typings. */
export const typings = {
  modifiers: {
    text: { type: Boolean },
    comment: { type: Boolean },
    eval: { type: Boolean },
    throw: { type: Boolean },
    event: { type: String },
  },
} as const

/** `~test` directive. */
export const _test = {
  name: /^~test/,
  phase: Phase.TESTING,
  typings,
  multiple: true,
  async execute(renderer, element, { attributes, ...options }) {
    const returned = {} as NonVoid<Awaited<ReturnType<NonNullable<Directive["execute"]>>>>
    for (const attribute of attributes) {
      const parsed = renderer.parseAttribute(attribute, this.typings, { modifiers: true })
      // Skip if tag does not match current phase
      parsed.tag ??= Phase[Phase.TESTING]
      if ((parsed.tag) && (this.phase !== (Phase[parsed.tag.toLocaleUpperCase() as keyof typeof Phase] + PHASE_TESTING_DELTA))) {
        continue
      }
      // Handle comment elements
      if (renderer.isComment(element)) {
        // Uncomment element on falsy `comment` modifier value
        if ((parsed.modifiers.comment) && (!await renderer.evaluate(element, attribute.value || "'true'", options))) {
          returned.element = renderer.uncomment(element)
          element = returned.element
        }
        // Set comment content on any `~test` directive
        renderer.setAttribute(element, attribute.name, attribute.value)
        continue
      } // Handle HTML elements
      else if (renderer.isHtmlElement(element)) {
        // Comment element on truthy `comment` modifier value
        if ((parsed.modifiers.comment) && (await renderer.evaluate(element, attribute.value || "'true'", options))) {
          returned.element = renderer.comment(element, { expression: attribute.value, directive: attribute.name })
          element = returned.element
          continue
        }
        // Set text content on `text` modifier value
        if (parsed.modifiers.text) {
          element.textContent = `${await renderer.evaluate(element, attribute.value, options)}`
          continue
        }
        // Evaluate attribute value on `eval` modifier value
        if (parsed.modifiers.eval) {
          await renderer.evaluate(element, attribute.value, options)
          continue
        }
        // Evaluate attribute value on `event` modifier value
        if (parsed.modifiers.event) {
          element.addEventListener(parsed.modifiers.event, (event) => renderer.evaluate(element, attribute.value, { context: options.context, state: { ...options.state, $event: event }, args: [event] }))
        }
        // Throw error on truthy `throw` modifier value
        if ((parsed.modifiers.throw) && (await renderer.evaluate(element, attribute.value || "'true'", options))) {
          throw new EvalError(`Expected error from: ${element.outerHTML.replace(element.innerHTML, "")}`)
        }
      }
    }
    return returned
  },
} as Directive<null, typeof typings> & { name: RegExp }

/** `~test` directives. */
const _tests = Object.entries(Phase)
  .filter(([, value]) => (Number.isFinite(value)) && (Number(value) > Phase.META))
  .map(([key, value]) => ({ ..._test, name: new RegExp(`${_test.name.source}(?<${key.toLocaleLowerCase()}>)`), phase: (value as number) + PHASE_TESTING_DELTA })) as Array<typeof _test>

/** Default exports. */
export default _tests
