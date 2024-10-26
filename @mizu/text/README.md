# `*text="content"`

| Version                               | Phase          | Default          |
| ------------------------------------- | -------------- | ---------------- |
| ![](https://jsr.io/badges/@mizu/text) | 41 — `CONTENT` | `this.innerHTML` |

Set element's `[textContent](https://developer.mozilla.org/docs/Web/API/Node/textContent)`.

```html
<p *text="'...'">
  <!--...-->
</p>
```

## Notes

> [!NOTE]
> HTML content is escaped.

> [!NOTE]
> Using this directive without any attribute value escapes the element's `[innerHTML](https://developer.mozilla.org/docs/Web/API/Element/innerHTML)` _(e.g. `<a *text><b></b></a>` will result into `<a *text>&lt;b&gt;&lt;/b&gt;</a>`)_.
