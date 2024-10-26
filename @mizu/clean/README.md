# `*clean`

| Version                                | Phase                   |
| -------------------------------------- | ----------------------- |
| ![](https://jsr.io/badges/@mizu/clean) | 49 — `CONTENT_CLEANING` |

Clean up the element and its children from specified content.

```html
<div *clean="">
  <!--...-->
</div>
```

## Modifiers

### `.comments[boolean]`

Clean up all [`Comment`](https://developer.mozilla.org/docs/Web/API/Comment) nodes from subtree.

### `.spaces[boolean]`

Clean up all spaces (except non-breaking spaces [`&nbsp;`](https://developer.mozilla.org/docs/Glossary/Character_reference)) from subtree.

### `.templates[boolean]`

Clean up all [`<template>`](https://developer.mozilla.org/docs/Web/HTML/Element/template) nodes from subtree **after processing the subtree entirely**.

### `.directives[boolean]`

Clean up all known directives from subtree **after processing the subtree entirely**. If `.comments` modifier is also enabled, then comments generated by directives will be cleaned up as well.