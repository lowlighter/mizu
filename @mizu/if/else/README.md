# `*else="expression"`

| Version                                  | Phase         | Default |
| ---------------------------------------- | ------------- | ------- |
| ![](https://jsr.io/badges/@mizu/if/else) | 23 — `TOGGLE` | `true`  |

Conditionally render an element placed after another [`*if`](#if) or [`*else`](#else) directive.

```html
<div *if="false"></div>
<div *else="false"></div>
<div *else><!--...--></div>
```

## Notes

> [!CAUTION]
> Must be placed immediately after an element with an [`*if`](#if) or [`*else`](#else) directive.

> [!NOTE]
> There is currently no special handling for [`<template>`](https://developer.mozilla.org/docs/Web/HTML/Element/template) elements, but future versions may introduce specific behavior for these elements.
