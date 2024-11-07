# `*mustache`

| Version                                   | Phase                        | Multiple |
| ----------------------------------------- | ---------------------------- | -------- |
| ![](https://jsr.io/badges/@mizu/mustache) | 42 — `CONTENT_INTERPOLATION` | Yes      |

Enable content interpolation within « mustaches » ( `{{` and `}}`) from [`Text`](https://developer.mozilla.org/docs/Web/API/Text) child nodes.

```html
<p *mustache>
  <!--{{ ... }}-->
</p>
```

## Notes

> [!NOTE]
> Interpolation occurs only within [`Text`](https://developer.mozilla.org/docs/Web/API/Text) nodes, not the entire element.

> [!NOTE]
> HTML content is automatically escaped.

> [!NOTE]
> There is currently no distinction between double mustaches ( `{{` and `}}`) and triple mustaches ( `{{{` and `}}}`), but future versions may introduce specific behavior for these.
