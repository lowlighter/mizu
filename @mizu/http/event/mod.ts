// Imports
import { type Cache, type callback, type Directive, Phase } from "@mizu/render/engine"
import { _event } from "@mizu/event"
import { _body, _header, _http, _response, _response_typings } from "@mizu/http"
export type * from "@mizu/render/engine"
export type { _event, typings as _event_typings } from "@mizu/event"

/** `%@event` directive. */
export const _http_event = {
  name: /^%@(?<event>)/,
  prefix: "%@",
  phase: Phase.HTTP_INTERACTIVITY,
  default: "null",
  multiple: true,
  typings: {
    modifiers: {
      ..._event.typings.modifiers,
      ..._response_typings.modifiers,
    },
  },
  init(renderer) {
    renderer.cache(this.name, new WeakMap())
    renderer.cache(`#${this.name}`, new WeakMap())
  },
  async execute(renderer, element) {
    if (renderer.isComment(element)) {
      return
    }
    const cached = renderer.cache<WeakMap<HTMLElement, callback>>(`#${this.name}`)!
    if (!cached.has(element)) {
      const callback = async ($event: Event, { attribute, expression }: { attribute: Attr; expression: callback }) => {
        const http = await _http.execute.call(this, renderer, element, { ...arguments[2], attributes: renderer.getAttributes(element, _http.name), _return_callback: true }) as Awaited<callback>
        const $response = await http($event)
        await _response.execute.call(this, renderer, element, { ...arguments[2], attributes: [attribute], state: { ...arguments[2].state, $event, $response }, _expression: { value: expression, args: [$event] } })
      }
      cached.set(element, callback)
    }
    await _event.execute.call(this, renderer, element, { ...arguments[2], _callback: cached.get(element)! })
  },
} as Directive<Cache<typeof _event>>

/** Default exports. */
export default [_header, _body, _http, _response, _http_event]
