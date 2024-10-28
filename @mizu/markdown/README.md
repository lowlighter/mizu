# `*markdown="content"`

| Version                                   | Phase          | Default            |
| ----------------------------------------- | -------------- | ------------------ |
| ![](https://jsr.io/badges/@mizu/markdown) | 41 — `CONTENT` | `this.textContent` |

Set element's [`innerHTML`](https://developer.mozilla.org/docs/Web/API/Element/innerHTML) after performing [markdown](https://github.github.com/gfm/) rendering.

```html
<div *markdown="'*...*'">
  <!--<em>...</em>-->
</div>
```

## Notes

> [!IMPORTANT]
> This directive dynamically imports [`@libs/markdown`](https://jsr.io/@libs/markdown).

## Modifiers

### `[string]`

Load additional Markdown plugins by specifying a comma-separated list (e.g., `*markdown[emojis,highlighting,sanitize]`). See the full list of supported plugins at [`@libs/markdown/plugins`](https://jsr.io/@libs/markdown/doc/plugins/~#Variables). Unsupported plugins will be
silently ignored.
