# `*set="context"`

| Version                              | Phase          |
| ------------------------------------ | -------------- |
| ![](https://jsr.io/badges/@mizu/set) | 11 — `CONTEXT` |

Set context values for an element and its children.

```html
<div *set="{ foo: 'bar' }">
  <!--<span *text="foo"></span>-->
</div>
```

## Notes

> [!CAUTION]
> The context must resolve to a [JavaScript `Object`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object).

> [!NOTE]
> The context is initialized once and persists across renderings, but it can still be updated by other directives.
