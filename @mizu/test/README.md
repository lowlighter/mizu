# `~test="expression"`

| Version                               | Phase          | Multiple |
| ------------------------------------- | -------------- | -------- |
| ![](https://jsr.io/badges/@mizu/test) | 10 — `TESTING` | Yes      |

Special directive for testing purposes.

```html
<samp ~test[testing].text="'...'">
  <!--...-->
</samp>
```

## Notes

> [!WARNING]
> Intended for testing purposes only. This is provided for developers that want to test their custom directives in isolation, without having to rely on other directives.

## Modifiers

### `[string]`

Any existing [Phase](/#concept-phase) name (e.g. `~test[testing]`, defaults to `Phase.TESTING`). Directive will be executed during the specified phase before any other directive of said phase, which can be used to simulate specific scenarios.

### `.text[boolean]`

Set element's `[textContent](https://developer.mozilla.org/docs/Web/API/Node/textContent)` with expression result.

### `.eval[boolean]`

Evaluate a JavaScript expression in the context of the element.

### `.comment[boolean]`

Change the element to a `[Comment](https://developer.mozilla.org/docs/Web/API/Comment)` if expression is truthy (and revert it back otherwise).

### `.throw[boolean]`

Throw an `[EvalError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/EvalError)` if expression is truthy.
