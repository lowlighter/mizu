# `%@event="listener"`

| Version                                     | Phase                     | Default | Multiple |
| ------------------------------------------- | ------------------------- | ------- | -------- |
| ![](https://jsr.io/badges/@mizu/http/event) | 35 — `HTTP_INTERACTIVITY` | `null`  | Yes      |

Listen for a dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event) and re-evaluates [`%http`](#http) directive before reacting to its [`Response`](https://developer.mozilla.org/docs/Web/API/Response).

```html
<button %http="https://example.com" %@click.html>
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
