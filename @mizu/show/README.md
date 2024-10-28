# `*show="expression"`

| Version                               | Phase          | Default |
| ------------------------------------- | -------------- | ------- |
| ![](https://jsr.io/badges/@mizu/show) | 71 — `DISPLAY` | `true`  |

Conditionally display an element.

```html
<div *show="true">
  <!--...-->
</div>
```

## Notes

> [!NOTE]
> When hidden, the element's [CSS `display` property](https://developer.mozilla.org/docs/Web/CSS/display) is set to `none !important`.

> [!NOTE]
> When shown and if initially hidden by a CSS stylesheet ( `display: none`), the element's display property is reset to `initial !important`.

> [!NOTE]
> Unlike [`*if`](#if) and [`*else`](#else) directives, the element remains in the DOM when hidden.

> [!NOTE]
> You can take advantage of the default value being `true` to hide elements before _**mizu.js**_ loads (e.g. `<style>[\*show]{display:none}</style>`).
