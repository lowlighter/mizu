# `*mustache`

| Version                                   | Phase          |
| ----------------------------------------- | -------------- |
| ![](https://jsr.io/badges/@mizu/mustache) | 41 — `CONTENT` |

Enable content interpolation between « mustaches » ( `{{` and `}}`) from `[Text](https://developer.mozilla.org/docs/Web/API/Text)` child nodes.

```html
<p *mustache="">
  <!--{{ ... }}-->
</p>
```

## Notes

> [!NOTE]
> HTML content is escaped.

> [!WARNING]
> There is currently no distinction between double mustaches ( `{{` and `}}`) and triple mustaches ( `{{{` and `}}}`), but future versions may treat them differently.
