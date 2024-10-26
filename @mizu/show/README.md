# `*show="expression"`

| Version                               | Phase          |
| ------------------------------------- | -------------- |
| ![](https://jsr.io/badges/@mizu/show) | 71 — `DISPLAY` |

Conditionally display an element.

```html
<div *show="true">
  <!--...-->
</div>
```

## Notes

> [!NOTE]
> The [CSS `display` property](https://developer.mozilla.org/docs/Web/CSS/display) is set to `none !important` when hidden.

> [!NOTE]
> Unlike [`*if`](#if) and [`*else`](#else) directives, element is not removed from the DOM when hidden.
