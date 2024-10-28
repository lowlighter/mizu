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
> For testing only. Use this directive to isolate and test custom directives without relying on others.

## Modifiers

### `[string]`

Specify any existing [Phase](#concept-phase) name (e.g., `~test [testing]`, defaults to `Phase.TESTING`). The directive will execute during the specified phase before any other directive in that phase, allowing you to simulate specific scenarios.

### `.text[boolean]`

Set the element's [`textContent`](https://developer.mozilla.org/docs/Web/API/Node/textContent) with the expression result.

### `.eval[boolean]`

Evaluate a JavaScript expression within the element's context.

### `.comment[boolean]`

Convert the element to a [`Comment`](https://developer.mozilla.org/docs/Web/API/Comment) if the expression is truthy, and revert it otherwise.

### `.throw[boolean]`

Throw an [`EvalError`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/EvalError) if the expression is truthy.
