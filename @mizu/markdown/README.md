# `*markdown="content"`

| Version                                   | Phase          | Default            |
| ----------------------------------------- | -------------- | ------------------ |
| ![](https://jsr.io/badges/@mizu/markdown) | 41 — `CONTENT` | `this.textContent` |

Set element's content after performing [markdown](https://github.github.com/gfm/) rendering.

```html
<div *markdown="'*...*'">
  <!--<em>...</em>-->
</div>
```

## Notes

> [!IMPORTANT]
> Using this will dynamically import [`@libs/markdown`](https://jsr.io/@libs/markdown).

## Modifiers

### `[string]`

Load additional comma-separated markdown plugins (e.g. `*markdown[emojis,highlighting,sanitize]`). Supported list of plugins is available at [`@libs/markdown/plugins`](https://jsr.io/@libs/markdown/doc/plugins/~#Variables) _(unsupported plugins will be silently ignored)_.
