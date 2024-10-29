/**
 * Keyboard expression matcher.
 *
 * Multiple keys can be combined into a single combination using a plus sign (`+`).
 * Multiple combinations can be combined into a single expression using a comma (`,`).
 * Spaces are always trimmed.
 *
 * The following aliases are supported:
 * - `alt` when `Alt` is pressed
 * - `ctrl` when `Control` is pressed
 * - `shift` when `Shift` is pressed
 * - `meta` when `Meta` is pressed
 * - `space` for `Space` key
 * - `key` for any key except `Alt`, `Control`, `Shift` and `Meta`
 *
 * If the event is not a {@link https://developer.mozilla.org/docs/Web/API/KeyboardEvent | KeyboardEvent}, the function will return `false`.
 *
 * {@link https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_key_values | Reference}
 *
 * ```ts
 * import { Window } from "@mizu/internal/vdom"
 * const { KeyboardEvent } = new Window()
 *
 * const check = keyboard("a,ctrl+b")
 * console.assert(check(new KeyboardEvent("keydown", {key: "a"})))
 * console.assert(check(new KeyboardEvent("keydown", {key: "b", ctrlKey: true})))
 * console.assert(!check(new KeyboardEvent("keydown", {key: "c"})))
 * ```
 *
 * @author Simon Lecoq (lowlighter)
 * @license MIT
 */
export function keyboard(keys: string) {
  const combinations = keys.split(",").map((combination) => combination.split("+").map((key) => key.trim().toLowerCase()))
  return function (event: KeyboardEvent) {
    if (!/^key(?:down|press|up)$/.test(event.type)) {
      return false
    }
    return combinations.some((combination) => {
      for (const key of combination) {
        switch (key) {
          case "alt":
          case "ctrl":
          case "shift":
          case "meta":
            if (!event[`${key}Key`]) {
              return false
            }
            break
          case "space":
            if (event.key !== " ") {
              return false
            }
            break
          case "key":
            if (/^(?:alt|ctrl|shift|meta)$/i.test(event.key)) {
              return false
            }
            break
          default:
            if (event.key.toLowerCase() !== key) {
              return false
            }
        }
      }
      return true
    })
  }
}
