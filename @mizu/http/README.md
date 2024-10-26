# `%http="url"`

| Version                               | Phase               |
| ------------------------------------- | ------------------- |
| ![](https://jsr.io/badges/@mizu/http) | 33 — `HTTP_REQUEST` |

Perform a [`fetch()`](https://developer.mozilla.org/docs/Web/API/Fetch_API) call that can be handled by [`%response`](#response) directives.

```html
<div %http="https://example.com">
  <!--...-->
</div>
```

## Notes

> [!NOTE]
> If the element has no [`%response`](#response) directive attached, request is not automatically performed upon processing.

> [!NOTE]
> Valid [URLs](https://developer.mozilla.org/docs/Web/API/URL/canParse_static) may be specified « as is ».

## Variables

### `$event: Event | null`

_(in `url` expression only)_ The dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event) if triggered by a [`%@event`](#http_event) directive, or `null`.

## Modifiers

### `.follow[boolean=true]`

Control whether [`fetch()`](https://developer.mozilla.org/docs/Web/API/Fetch_API) should [follow redirections](https://developer.mozilla.org/docs/Web/API/RequestInit#redirect) or not.

### `.history[boolean]`

Whether to [`history.pushState()`](https://developer.mozilla.org/docs/Web/API/History/pushState) target URL [_(must be the same origin)_](https://developer.mozilla.org/docs/Web/API/History/pushState#url).

### `.method[string]`

Set [HTTP method](https://developer.mozilla.org/docs/Web/HTTP/Methods) _(uppercased)_. This modifier should not be used with one of its aliases.

### `.get[boolean]`

Alias for `.method[get]`.

### `.head[boolean]`

Alias for `.method[head]`

### `.post[boolean]`

Alias for `.method[post]`

### `.put[boolean]`

Alias for `.method[put]`

### `.patch[boolean]`

Alias for `.method[patch]`

### `.delete[boolean]`

Alias for `.method[delete]`

# `%header[name] ="value"`

| Version                               | Phase              | Multiple |
| ------------------------------------- | ------------------ | -------- |
| ![](https://jsr.io/badges/@mizu/http) | 31 — `HTTP_HEADER` | Yes      |

Set [HTTP headers](https://developer.mozilla.org/docs/Glossary/Request_header) for a [`%http`](#http) directive.

```html
<div %header[x-foo]="'bar'">
  <!--...-->
</div>
```

## Notes

> [!NOTE]
> Headers with `undefined` or `null` values are [deleted](https://developer.mozilla.org/docs/Web/API/Headers/delete).

> [!NOTE]
> Headers with `Array` values are [appended together](https://developer.mozilla.org/docs/Web/API/Headers/append).

## Modifiers

### `[string]`

Header name.

# `%body="content"`

| Version                               | Phase            |
| ------------------------------------- | ---------------- |
| ![](https://jsr.io/badges/@mizu/http) | 32 — `HTTP_BODY` |

Set [HTTP body](https://developer.mozilla.org/docs/Glossary/Payload_body) for a [`%http`](#http) directive.

```html
<div %body.json="{foo:'bar'}">
  <!--...-->
</div>
```

## Variables

### `$headers: Headers`

A [`Headers`](https://developer.mozilla.org/docs/Web/API/Headers) object that contains all registered headers from [`%header`](#header) directives attached to element.

## Modifiers

### `.type["text" | "form" | "json" | "xml"]`

Format body with specified type.

- `text`: format body with [`toString()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/toString).
- `form`: format body with [`URLSearchParams`](https://developer.mozilla.org/docs/Web/API/URLSearchParams).
- `json`: format body with [`JSON.stringify()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
- `xml`: format body with [`stringify()` from `@libs/xml`](https://jsr.io/@libs/xml). > [!IMPORTANT]

> Using this value will dynamically import [`@libs/xml`](https://jsr.io/@libs/xml). This modifier should not be used with one of its aliases.

### `.header[boolean=true]`

Automatically set [Content-Type header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Type) when using a `.type` modifier.

- `text`: set `Content-Type: text/plain`.
- `form`: set `Content-Type: application/json`.
- `json`: set `Content-Type: application/x-www-form-urlencoded`.
- `xml`: set `Content-Type: application/xml`. If the header was already set, it is overwritten.

### `.text[boolean]`

Alias for `.type[text]`.

### `.form[boolean]`

Alias for `.type[form]`.

### `.json[boolean]`

Alias for `.type[json]`.

### `.xml[boolean]`

Alias for `.type[xml]`.

# `%response="expression"`

| Version                               | Phase               | Default | Multiple |
| ------------------------------------- | ------------------- | ------- | -------- |
| ![](https://jsr.io/badges/@mizu/http) | 34 — `HTTP_CONTENT` | `null`  | Yes      |

Reacts to a [`%http`](#http) directive's [`Response`](https://developer.mozilla.org/docs/Web/API/Response).

```html
<div %http="'https://example.com'" %response.html="">
  <!--...-->
</div>
```

## Variables

### `$response: Response`

A [`Response`](https://developer.mozilla.org/docs/Web/API/Response) object that contains the fetched data.

### `$content: unknown`

A variable that contains the [`response.body`](https://developer.mozilla.org/docs/Web/API/Response/body) _(typing depends on which modifier is used)_.

## Modifiers

### `[string]`

Specify which [HTTP status code](https://developer.mozilla.org/docs/Web/HTTP/Status) trigger this directive.

- The syntax for status code constraints is defined as follows:
  - A range can be defined using a « minus sign `-` » between two numbers _(e.g. `%response[200-299]`)_.
  - Multiple ranges and status can be specified by separating them with a « comma `,` »_(e.g. `%response[200,201-204]`)_.
- The following aliases _(case-insensitive)_ are supported:
  - `2XX` for `200-299`.
  - `3XX` for `300-399`.
  - `4XX` for `400-499`.
  - `5XX` for `500-599`.

### `.consume["void" | "text" | "html" | "json" | "xml"]`

Consume [`response.body`](https://developer.mozilla.org/docs/Web/API/Response/body).

- `void`: discard body using [`response.body?.cancel()`](https://developer.mozilla.org/docs/Web/API/Response/body).
- `text`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and set element's `[textContent](https://developer.mozilla.org/docs/Web/API/Node/textContent)` if no expression is provided.
- `html`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and set element's `[innerHTML](https://developer.mozilla.org/docs/Web/API/Element/innerHTML)` if no expression is provided.
- `json`: consume body using [`response.json()`](https://developer.mozilla.org/docs/Web/API/Response/json).
- `xml`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and parse it with [`parse` from _@libs/xml_](https://jsr.io/@libs/xml). > [!IMPORTANT]

> Using this value will dynamically import [jsr.io/@libs/xml](https://jsr.io/@libs/xml). This modifier should not be used with one of its aliases.

### `.void[boolean]`

Alias for `.consume[void]`.

### `.text[boolean]`

Alias for `.consume[text]`.

### `.html[boolean]`

Alias for `.consume[html]`.

### `.json[boolean]`

Alias for `.consume[json]`.

### `.xml[boolean]`

Alias for `.consume[xml]`.

# `%@event="listener"`

| Version                               | Phase                     | Default | Multiple |
| ------------------------------------- | ------------------------- | ------- | -------- |
| ![](https://jsr.io/badges/@mizu/http) | 35 — `HTTP_INTERACTIVITY` | `null`  | Yes      |

Listen for a dispatched `[Event](https://developer.mozilla.org/docs/web/api/event)` and re-evaluates [`%http`](#http) directive before reacting to its [`Response`](https://developer.mozilla.org/docs/Web/API/Response).

```html
<button %http="https://example.com" %@click.html="">
  <!--...-->
</button>
```

## Notes

> [!CAUTION]
> Must be defined on an element that also possess a [`%http`](#http) directive.

> [!NOTE]
> This is essentially a combination of [`%response`](#response) and [`@event`](#event) directives.

> [!NOTE]
> Target URL is still set by [`%http`](#http) directive. As it is re-evaluated, you can however use the `$event` value to dynamically compute the target URL _(e.g. `%http="$event ? '/foo' : '/bar'"`)_. All modifiers from [`%http`](#http) directive are inherited, along with the
> [`RequestInit`](https://developer.mozilla.org/docs/Web/API/RequestInit) prepared by [`%header`](#header) and [`%body`](#body) directives.

## Variables

### `$event: Event`

_(in `listener` only)_ The dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event).

### `$response: Response`

A [`Response`](https://developer.mozilla.org/docs/Web/API/Response) object that contains the fetched data.

### `$content: unknown`

A variable that contains the [`response.body`](https://developer.mozilla.org/docs/Web/API/Response/body) _(typing depends on which modifier is used)_.

## Modifiers

### `...`

Inherited from [`@event`](#event) and [`%response`](#response) directives. See their respective documentation for more information.
