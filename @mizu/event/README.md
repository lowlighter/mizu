# `@event="listener"`

| Version                                | Phase                | Default | Multiple |
| -------------------------------------- | -------------------- | ------- | -------- |
| ![](https://jsr.io/badges/@mizu/event) | 61 — `INTERACTIVITY` | `null`  | Yes      |

Listen for a dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event).

```html
<button @click="this.value = 'Clicked!'">
  <!--Not clicked yet.-->
</button>
```

## Notes

> [!NOTE]
> Attach multiple listeners in a single directive using the shorthand `@ ="object"` _(e.g., `@ ="{ foo() {}, bar() {} }"`)_.
>
> - Modifiers apply to all listeners in the directive _(e.g., `@.prevent="{}"`)_.
> - Use tags to attach listeners with different modifiers _(e.g., `@[1]="{}" @[1].prevent="{}"`)_.
> - HTML attributes are case-insensitive, so this is the only way to listen for events with uppercase letters or illegal attribute characters _(e.g., `@="{ FooBar() {}, Foobar() {} }"`)_.

> [!NOTE]
> To listen for events with dots `.` in their names, use brackets `{`}`` _(e.g. `@ {my.event}`)_.

## Variables

### `$event: Event`

_(in `listener` only)_ The dispatched [`Event`](https://developer.mozilla.org/docs/web/api/event).

## Modifiers

### `[string]`

Optional tag to attach multiple listeners to the same event _(e.g., `@click [1]`, `@click [2]`, etc.)_.

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

Trigger listener only if [`event.target`](https://developer.mozilla.org/docs/Web/API/Event/target) is the element itself.

### `.attach["element" | "window" | "document"]`

Attach listener to a different target (e.g., [`window`](https://developer.mozilla.org/docs/Web/API/Window) or [`document`](https://developer.mozilla.org/docs/Web/API/Document)).

### `.throttle[duration≈250ms]`

Prevent listener from being called more than once during the specified time frame.

### `.debounce[duration≈250ms]`

Delay listener execution until the specified time frame has passed without any activity.

### `.keys[string]`

Specify which keys must be pressed for the listener to trigger on a [`KeyboardEvent`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent).

- The syntax for keys constraints is defined as follows:
  - Combine keys with a « plus sign `+` »_(e.g., `@keypress .keys[ctrl+space]`)_.
  - Separate multiple combinations with a « comma `,` »_(e.g., `@keypress .keys[ctrl+space,shift+space]`)_.
- Supported keys and aliases:
  - `alt` for `"Alt"`.
  - `ctrl` for `"Control"`.
  - `shift` for `"Shift"`.
  - `meta` for `"Meta"`.
  - `space` for `" "`.
  - `key` for any key except `"Alt"`, `"Control"`, `"Shift"`, and `"Meta"`.
  - Any value returned by [`event.key`](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_key_values).
