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
> Heading elements in selected target must satisfy the following conditions:
>
> - Have an [`id`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/id) attribute.
> - Have an immediate [`<a>`](https://developer.mozilla.org/docs/Web/HTML/Element/a) child with an anchor link _(which should points towards its parent id)_.
> - No heading levels is skipped, and they are in descending order.

> [!NOTE]
> When a heading element is found, next level heading elements are searched in [`HTMLElement.parentElement`](https://developer.mozilla.org/docs/Web/API/Node/parentElement). If the parent element is a [`<hgroup>`](https://developer.mozilla.org/docs/Web/HTML/Element/hgroup) or has
> a `*toc[ignore]` attribute, the search is performed in its grand-parent element instead.

## Modifiers

### `[string]`

Specify which heading levels should be processed by this directive.

- The syntax for heading levels constraints is defined as follows:
  - Expression is case-insensitive.
  - A single heading level can be specified _(e.g. `*toc[h2]`)_.
    - A « plus sign `+` » may be added to also process heading elements with a higher heading level _(e.g. `*toc[h2+]`)_.
  - A range can be defined using a « hyphen `-` » between two heading levels _(e.g. `*toc[h2-h4]`)_.
- The special value `ignore` can be used to exclude an element from the node traversal _(e.g. `*toc[ignore]`)_. When used, no [`.modifiers`](#concept-directive-modifier) or attribute value should be specified.
