# `*code="content"`

| Version                               | Phase          | Default            |
| ------------------------------------- | -------------- | ------------------ |
| ![](https://jsr.io/badges/@mizu/code) | 41 — `CONTENT` | `this.textContent` |

Set element's [`innerHTML`](https://developer.mozilla.org/docs/Web/API/Element/innerHTML) after performing syntax highlighting.

```html
<code *code[ts]="'...'">
  <!--<span class="hljs-*">...</span>-->
</code>
```

## Notes

> [!IMPORTANT]
> This directive dynamically imports [`highlight.js`](https://highlightjs.org).

> [!NOTE]
> Unsupported languages default to `plaintext`.

## Modifiers

### `[string]`

Any supported [language identifier or alias](https://highlightjs.readthedocs.io/latest/supported-languages.html).

### `.trim[boolean=true]`

Remove leading/trailing whitespaces and shared indentation.
