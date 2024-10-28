# `*html="content"`

| Version                               | Phase          |
| ------------------------------------- | -------------- |
| ![](https://jsr.io/badges/@mizu/html) | 41 — `CONTENT` |

Set element's [`innerHTML`](https://developer.mozilla.org/docs/Web/API/Element/innerHTML).

```html
<template *html="'<p>...</p>'">
  <!--<p>...</p>-->
</template>
```

## Notes

> [!WARNING]
> Raw HTML can introduce [XSS vulnerabilities](https://developer.mozilla.org/docs/Glossary/Cross-site_scripting). Exercise caution when using expressions from untrusted sources.
