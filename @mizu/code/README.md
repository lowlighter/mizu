# `*code="content"`

| Version                               | Phase          | Default            |
| ------------------------------------- | -------------- | ------------------ |
| ![](https://jsr.io/badges/@mizu/code) | 41 — `CONTENT` | `this.textContent` |

Set element's content after performing syntax highlighting.

```html
<code *code[ts]="'...'">
  <!--<span class="hljs-*">...</span>-->
</code>
```

## Notes

> [!IMPORTANT]
> Using this will dynamically import [`highlight.js`](https://highlightjs.org).

> [!NOTE]
> Unsupported languages defaults to `plaintext`

## Modifiers

### `[string]`

Any supported [language identifier or alias](https://highlightjs.readthedocs.io/latest/supported-languages.html).

### `.trim[boolean=true]`

Trim whitespaces and shared indentation.
