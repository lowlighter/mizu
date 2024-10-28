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
> If the tagname changes, the reference will also change. Equality checks with elements using this directive may not work as expected. Some directives may be incompatible with this directive.
