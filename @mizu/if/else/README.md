# `*else="expression"`

| Version                                  | Phase         | Default |
| ---------------------------------------- | ------------- | ------- |
| ![](https://jsr.io/badges/@mizu/if/else) | 23 — `TOGGLE` | `true`  |

Conditionally render an element after another [`*if`](#if) or [`*else`](#else) directive.

```html
<div *if="false"></div>
<div *else="false"></div>
<div *else=""><!--...--></div>
```

## Notes

> [!CAUTION]
> Must be defined on an element immediately preceded by another element with either a [`*if`](#if) or [`*else`](#else) directive.

> [!WARNING]
> There is currently no special handling for [`<template>`](https://developer.mozilla.org/docs/Web/HTML/Element/template) elements, but future versions may treat them differently.