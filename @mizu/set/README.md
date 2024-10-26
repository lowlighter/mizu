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
> Context must resolve to a [JavaScript `Object`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object).

> [!NOTE]
> Context is only initialized once and is not reset upon subsequent renderings, but it can be updated by other directives.
