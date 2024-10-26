# `@event="listener"`

| Version                                | Phase                | Default | Multiple |
| -------------------------------------- | -------------------- | ------- | -------- |
| ![](https://jsr.io/badges/@mizu/event) | 61 — `INTERACTIVITY` | `null`  | Yes      |

Listen for a dispatched `[Event](https://developer.mozilla.org/docs/web/api/event)`.

```html
<button @click="this.value = 'Clicked!'">
  <!--Not clicked yet.-->
</button>
```

## Notes

> [!NOTE]
> Multiple listeners can be attached in a single directive using the empty shorthand `@="object"` _(e.g. `@="{ foo() {}, bar() {} }"`)_.
>
> - Modifiers are applied to all specified listeners in the directive _(e.g. `@.prevent="{}"`)_.
> - Tags may be specified to use this syntax multiple times which can be useful to attach listeners with different modifiers _(e.g. `@[1]="{}" @[2].prevent="{}"`)_.
> - As HTML attributes are case-insensitive, it is currently the only way to listen for events with uppercase letters or illegal attribute characters _(e.g. `@="{ FooBar() {}, Foobar() {} }"`)_.

> [!NOTE]
> To listen for events with dots `.` in their names, surround them by brackets `{`}`` _(e.g. `@{my.event}`)_.

## Variables

### `$event: Event`

_(in `listener` only)_ The dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event).

## Modifiers

### `[string]`

Optional tag that can be used to attach multiple listeners to the same event _(e.g. `@click[1]`, `@click[2]`, etc.)_.

### `.prevent[boolean]`

Call [`event.preventDefault()`](https://developer.mozilla.org/docs/Web/API/Event/preventDefault) when triggered.

### `.stop[boolean]`

Call [`event.stopPropagation()`](https://developer.mozilla.org/docs/Web/API/Event/stopPropagation) when triggered.

### `.once[boolean]`

Register listener with [`{ once: true }`](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener#once).

### `.passive[boolean]`

Register listener with [`{ passive: true }`](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener#passive).

### `.capture[boolean]`

Register listener with [`{ capture: true }`](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener#capture).

### `.self[boolean]`

Listener is triggered only if [`event.target`](https://developer.mozilla.org/docs/Web/API/Event/target) is the element itself.

### `.attach["element" | "window" | "document"]`

Change where the listener is attached to (using [`window`](https://developer.mozilla.org/docs/Web/API/Window) or [`document`](https://developer.mozilla.org/docs/Web/API/Document) can be useful to create global listeners).

### `.throttle[duration≈250ms]`

Prevent listener from being called more than once during the specified time frame.

### `.debounce[duration≈250ms]`

Prevent listener from executing until the specified time frame has passed without any activity.

### `.keys[string]`

Specify which keys must be pressed for the listener to trigger when receiving a [`KeyboardEvent`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent).

- The syntax for keys constraints is defined as follows:
  - Expression is case-insensitive.
  - A combination can be defined using a « plus sign `+` » between each key _(e.g. `@keypress.keys[ctrl+space]`)_.
  - Multiple key combinations can be specified by separating them with a « comma `,` »_(e.g. `@keypress.keys[ctrl+space,shift+space]`)_.
- The following keys and aliases are supported:
  - `alt` for `"Alt"`.
  - `ctrl` for `"Control"`.
  - `shift` for `"Shift"`.
  - `meta` for `"Meta"`.
  - `space` for `" "`.
  - `key` for any key except `"Alt"`, `"Control"`, `"Shift"` and `"Meta"`.
  - Any value possibly returned by [`event.key`](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_key_values).
