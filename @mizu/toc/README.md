# `*toc="selector"`

| Version                              | Phase          | Default  |
| ------------------------------------ | -------------- | -------- |
| ![](https://jsr.io/badges/@mizu/toc) | 41 — `CONTENT` | `'main'` |

Create a table of contents from [`<h1>...<h6>`](https://developer.mozilla.org/docs/Web/HTML/Element/Heading_Elements) elements found in selected target.

```html
<nav *toc="'main'">
  <!--<ul>...</ul>-->
</nav>
```

## Notes

> [!CAUTION]
> Heading elements must meet these criteria:
>
> - Include an [`id`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/id) attribute.
> - Contain an immediate [`<a>`](https://developer.mozilla.org/docs/Web/HTML/Element/a) child with an anchor link pointing to its parent `id`.
> - Follow a descending order without skipping levels.

> [!NOTE]
> When a heading is found, the next level headings are searched within its [`parentElement`](https://developer.mozilla.org/docs/Web/API/Node/parentElement). If the parent is an [`<hgroup>`](https://developer.mozilla.org/docs/Web/HTML/Element/hgroup) or has a `*toc[ignore]`
> attribute, the search moves to the grandparent element.

## Modifiers

### `[string]`

Define which heading levels to include:

- Specify a single level _(e.g., `*toc[h2]`)_.
  - Add a `+` to include higher levels _(e.g., `*toc[h2+]`)_.
- Use a range with a `-` to specify multiple levels _(e.g., `*toc[h2-h4]`)_.
- Use `ignore` to exclude an element from traversal _(e.g., `*toc[ignore]`). No other modifiers or attribute value should be used with this._
