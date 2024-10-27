// Imports
import { type Arg, type Cache, type Directive, type Nullable, type Optional, Phase } from "@mizu/mizu/core/engine"
import { escape } from "@std/html"
export type * from "@mizu/mizu/core/engine"

/** `%header` directive. */
export const _header = {
  name: "%header",
  phase: Phase.HTTP_HEADER,
  multiple: true,
  init(renderer) {
    renderer.cache<Cache<typeof _header>>(this.name, new WeakMap())
  },
  async execute(renderer, element, { attributes, cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const headers = cache.get(element) ?? cache.set(element, new Headers()).get(element)!
    const parsed = attributes.map((attribute) => renderer.parseAttribute(attribute))

    // Set headers
    for (const { tag: name, value: expression } of parsed) {
      const value = await renderer.evaluate(element, expression, options)
      switch (true) {
        // Unset header
        case (value === undefined) || (value === null):
          headers.delete(name)
          break
        // Multiple values header
        case Array.isArray(value):
          value.forEach((v) => headers.append(name, v))
          break
        // Single value header
        default:
          headers.set(name, `${value}`)
      }
    }
    return { state: { $headers: headers } }
  },
} as Directive<WeakMap<HTMLElement, Headers>>

/** `%body` typings. */
export const _body_typings = {
  modifiers: {
    header: { type: Boolean, default: true, enforce: true },
    type: { type: String, allowed: ["text", "form", "json", "xml"] },
    text: { type: Boolean },
    form: { type: Boolean },
    json: { type: Boolean },
    xml: { type: Boolean },
  },
} as const

/** `%body` directive. */
export const _body = {
  name: "%body",
  prefix: "%",
  phase: Phase.HTTP_BODY,
  typings: _body_typings,
  init(renderer) {
    renderer.cache<Cache<typeof _body>>(this.name, new WeakMap())
  },
  async execute(renderer, element, { attributes: [attribute], ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const headers = renderer.cache<Cache<typeof _header>>(_header.name)!.get(element) ?? renderer.cache<Cache<typeof _header>>(_header.name)!.set(element, new Headers()).get(element)!
    const parsed = renderer.parseAttribute(attribute, this.typings, { prefix: this.prefix, modifiers: true })

    // Set body
    let body = await renderer.evaluate(element, parsed.value, options)
    switch (true) {
      // Text body
      case (parsed.modifiers.type === "text") || (parsed.modifiers.text): {
        if (parsed.modifiers.header) {
          headers.set("Content-Type", "text/plain")
        }
        body = `${body}`
        break
      }
      // Form body
      case (parsed.modifiers.type === "form") || (parsed.modifiers.form): {
        if (parsed.modifiers.header) {
          headers.set("Content-Type", "application/x-www-form-urlencoded")
        }
        body = new URLSearchParams(body as Record<PropertyKey, string>)
        break
      }
      // JSON body
      case (parsed.modifiers.type === "json") || (parsed.modifiers.json): {
        if (parsed.modifiers.header) {
          headers.set("Content-Type", "application/json")
        }
        body = JSON.stringify(body)
        break
      }
      // XML body
      case (parsed.modifiers.type === "xml") || (parsed.modifiers.xml): {
        if (parsed.modifiers.header) {
          headers.set("Content-Type", "application/xml")
        }
        const { stringify } = await import("./import/xml/stringify.ts")
        body = stringify(body as Arg<typeof stringify>, { format: { indent: "", breakline: Infinity } })
        break
      }
    }
    return { state: { $headers: headers, $body: body } }
  },
} as Directive<WeakMap<HTMLElement, BodyInit>, typeof _body_typings>

/** `%http` typings. */
export const _http_typings = {
  modifiers: {
    follow: { type: Boolean, enforce: true },
    history: { type: Boolean },
    method: { type: String },
    get: { type: Boolean },
    head: { type: Boolean },
    post: { type: Boolean },
    put: { type: Boolean },
    patch: { type: Boolean },
    delete: { type: Boolean },
  },
} as const

/**
 * `%http` directive.
 *
 * @internal `_return_callback` Force the directive to return the request callback instead of executing it.
 */
export const _http = {
  name: "%http",
  prefix: "%",
  phase: Phase.HTTP_REQUEST,
  typings: _http_typings,
  execute(renderer, element, { attributes: [attribute], state, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const parsed = renderer.parseAttribute(attribute, _http_typings, { prefix: this.prefix, modifiers: true })

    // Configure request
    const redirect = parsed.modifiers.follow ? "follow" : "manual"
    let method = parsed.modifiers.method?.toLocaleUpperCase()
    for (const key of ["get", "head", "post", "put", "patch", "delete"] as const) {
      if (parsed.modifiers[key]) {
        method = key.toUpperCase()
      }
    }

    // Create request callback
    const callback = async function ($event: Nullable<Event>) {
      const value = attribute.value
      const url = new URL(/^\.?\//.test(value) ? value : `${await renderer.evaluate(element, value, { state: { ...state, $event }, ...options })}`, globalThis.location?.href)
      if (parsed.modifiers.history) {
        renderer.window.history.pushState(null, "", url.href)
      }
      const $response = fetch(url, { redirect, method, headers: state.$headers as Headers, body: state.$body as BodyInit })
      if ($event) {
        await renderer.render(element, { ...options, state: { ...state, $event, $response: await $response } })
      }
      return $response
    }
    if (arguments[2]._return_callback) {
      return callback as ReturnType<NonNullable<Directive["execute"]>>
    }
    if (!renderer.getAttributes(element, _response.name, { first: true })) {
      return
    }
    return callback(null).then(($response) => ({ state: { $response } }))
  },
} as Directive & { execute: NonNullable<Directive["execute"]> }

/** `%response` typings. */
export const _response_typings = {
  modifiers: {
    consume: { type: String, allowed: ["void", "text", "html", "json", "xml"] },
    void: { type: Boolean },
    text: { type: Boolean },
    html: { type: Boolean },
    json: { type: Boolean },
    xml: { type: Boolean },
    swap: { type: Boolean },
  },
} as const

/**
 * `%response` directive.
 *
 * @internal `_expression.value` Force the directive to use specified value rather than the attribute value.
 * @internal `_expression.args` Force the directive to pass specified arguments during evaluation.
 */
export const _response = {
  name: "%response",
  prefix: "%",
  phase: Phase.HTTP_CONTENT,
  typings: _response_typings,
  multiple: true,
  default: "null",
  async execute(renderer, element, { attributes, state, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const $response = state.$response as Optional<Response>
    if (!$response) {
      return
    }

    // Process response callbacks
    for (const attribute of attributes) {
      const { tag, modifiers, value: expression } = renderer.parseAttribute(attribute, this.typings, { prefix: this.prefix, modifiers: true })

      // Verify status code if applicable
      if (tag) {
        const match = tag.replace(/\s/g, "").split(",").map((code) => {
          if (/^[2-5]xx$/i.test(code)) {
            return [Number(code.at(0)) * 100, Number(code.at(0)) * 100 + 99]
          }
          if (/^\d+-\d+$/.test(code)) {
            return code.split("-").map(Number)
          }
          return [Number(code), Number(code)]
        }).some(([min, max]) => ($response.status >= min) && ($response.status <= max))
        if (!match) {
          continue
        }
      }

      let $content = null
      let consume = true as Nullable<boolean>
      // Apply swap modifier
      if (modifiers.swap) {
        $content = await $response.text()
        if ((modifiers.consume === "text") || (modifiers.text)) {
          $content = escape($content)
        }
        element.outerHTML = $content
        consume = null
      }
      // Parse response
      switch (consume) {
        // Void response
        case (modifiers.consume === "void") || (modifiers.void): {
          await $response.body?.cancel()
          break
        }
        // Text response
        case (modifiers.consume === "text") || (modifiers.text): {
          $content = await $response.text()
          if (!expression) {
            element.textContent = $content
          }
          break
        }
        // HTML response
        case (modifiers.consume === "html") || (modifiers.html): {
          $content = await $response.text()
          if (!expression) {
            element.innerHTML = $content
          }
          break
        }
        // JSON response
        case (modifiers.consume === "json") || (modifiers.json): {
          $content = await $response.json()
          break
        }
        // XML response
        case (modifiers.consume === "xml") || (modifiers.xml): {
          const { parse } = await import("./import/xml/parse.ts")
          $content = parse(await $response.text())
          break
        }
      }

      await renderer.evaluate(element, arguments[2]._expression?.value ?? (expression || this.default), { state: { ...state, $response, $content }, ...options, args: arguments[2]._expression?.args })
    }
  },
} as Directive<null, typeof _response_typings> & { execute: NonNullable<Directive["execute"]> }

/** Default exports. */
export default [_header, _body, _http, _response]
