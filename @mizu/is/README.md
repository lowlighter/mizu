# `*is="tagname"`

| Version                             | Phase           |
| ----------------------------------- | --------------- |
| ![](https://jsr.io/badges/@mizu/is) | 22 — `MORPHING` |

Set an [element tagname](https://developer.mozilla.org/docs/Web/API/Element/tagName).

```html
<div *is="'section'">
  <!--...-->
</div>
```

## Notes

> [!WARNING]
> When tagname changes, reference will also change. Any equality test with elements using this directive might not work as expected. Some directives may not be compatible with this directive.
