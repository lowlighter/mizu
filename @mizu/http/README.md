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
> Without a [`%response`](#response) directive, the request won't be performed automatically. Use [`%response .void`](#response) if you want to trigger the request but ignore the response.

> [!NOTE]
> Valid [URLs](https://developer.mozilla.org/docs/Web/API/URL/canParse_static) may be specified « as is ».

> [!NOTE]
> A new request is triggered for the same element if:
>
> - Its reference changes.
> - The evaluated URL changes. Since predicting when a new request will be performed is challenging, use this directive only for read-only operations. For endpoints with side effects, consider the [`%@event`](#http_event) directive.

## Variables

### `$event: Event | null`

_(in `url` expression only)_ The dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event) if triggered by a [`%@event`](#http_event) directive, or `null`.

## Modifiers

### `.follow[boolean=true]`

Control whether [`fetch()`](https://developer.mozilla.org/docs/Web/API/Fetch_API) should [follow redirections](https://developer.mozilla.org/docs/Web/API/RequestInit#redirect).

### `.history[boolean]`

Whether to update the browser history with [`history.pushState()`](https://developer.mozilla.org/docs/Web/API/History/pushState) for the target URL (must be the same origin).

### `.method[string]`

Set the [HTTP method](https://developer.mozilla.org/docs/Web/HTTP/Methods) (the value is uppercased). This modifier should not be used with its aliases.

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

A [`Headers`](https://developer.mozilla.org/docs/Web/API/Headers) object containing all registered headers from [`%header`](#header) directives attached to the element.

## Modifiers

### `.type["text" | "form" | "json" | "xml"]`

Format the body with the specified type:

- `text`: format body with [`toString()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/toString).
- `form`: format body with [`URLSearchParams`](https://developer.mozilla.org/docs/Web/API/URLSearchParams).
- `json`: format body with [`JSON.stringify()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
- `xml`: format body with [`stringify()` from `@libs/xml/stringify`](https://jsr.io/@libs/xml). > [!IMPORTANT]

> Using this value will dynamically import [`@libs/xml/stringify`](https://jsr.io/@libs/xml). This modifier should not be used with one of its aliases.

### `.header[boolean=true]`

Automatically set the [Content-Type header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Type) when using a `.type` modifier:

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
<div %http="'https://example.com'" %response.html>
  <!--...-->
</div>
```

## Variables

### `$response: Response`

A [`Response`](https://developer.mozilla.org/docs/Web/API/Response) object containing the fetched data.

### `$content: unknown`

Contains the [`response.body`](https://developer.mozilla.org/docs/Web/API/Response/body) (type depends on the modifier used).

## Modifiers

### `[string]`

Specify which [HTTP status codes](https://developer.mozilla.org/docs/Web/HTTP/Status) trigger this directive:

- The syntax for status code constraints is defined as follows:
  - Define a range using a « minus sign `-` » between two numbers _(e.g., `%response [200-299]`)_.
  - Specify multiple ranges and statuses by separating them with a « comma `,` »_(e.g., `%response [200,201-204]`)_.
- Supported aliases:
  - `2XX` for `200-299`.
  - `3XX` for `300-399`.
  - `4XX` for `400-499`.
  - `5XX` for `500-599`.

### `.consume["void" | "text" | "html" | "json" | "xml"]`

Consume the [`response.body`](https://developer.mozilla.org/docs/Web/API/Response/body):

- `void`: discard body using [`response.body?.cancel()`](https://developer.mozilla.org/docs/Web/API/Response/body).
- `text`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and set element's [`textContent`](https://developer.mozilla.org/docs/Web/API/Node/textContent) if no expression is provided.
- `html`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text), parse it into a `<body>` element, and set element's [`innerHTML`](https://developer.mozilla.org/docs/Web/API/Element/innerHTML) if no expression is provided.
- `json`: consume body using [`response.json()`](https://developer.mozilla.org/docs/Web/API/Response/json).
- `xml`: consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and parse it with [`parse` from _@libs/xml/parse_](https://jsr.io/@libs/xml). > [!IMPORTANT]

> Using this value will dynamically import [@libs/xml/parse](https://jsr.io/@libs/xml). This modifier should not be used with one of its aliases.

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

### `.swap[boolean]`

Consume body using [`response.text()`](https://developer.mozilla.org/docs/Web/API/Response/text) and set target's [`outerHTML`](https://developer.mozilla.org/docs/Web/API/Element/outerHTML). This modifier takes precedence over the `.consume` modifier and makes it effectless,
although if `.consume[text]` is set, swapped content will be escaped.

Any non-directive HTML attributes on the target will be applied to the swapped content elements.

This modifier automatically triggers a re-render of the replaced element's parent.
