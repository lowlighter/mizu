# `*custom-element="tagname"`

| Version                                         | Phase                 |
| ----------------------------------------------- | --------------------- |
| ![](https://jsr.io/badges/@mizu/custom-element) | 81 — `CUSTOM_ELEMENT` |

Register a new [custom element](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements).

```html
<template *custom-element="my-element">
  <ul><slot name="items"></slot></ul>
</template>
```

## Notes

> [!CAUTION]
> Must be defined on a `[<template>](https://developer.mozilla.org/docs/Web/HTML/Element/template)` element.

> [!CAUTION]
> Specified `tagname` must satisfy the [definition of a valid name](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements#name).

> [!NOTE]
> Valid [custom element names](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements#name) may be specified « as is ».

> [!NOTE]
> Custom elements registered this way do not use [Shadow DOMs](https://developer.mozilla.org/docs/Web/API/Web_components/Using_shadow_DOM) but rather have their content rendered directly.

## Variables

### `$slots: Record<PropertyKey, HTMLSlotElement>`

A record of specified [`# slot`](#slot) elements by `[<slot>](https://developer.mozilla.org/docs/Web/HTML/Element/slot)` name _(unamed slot is accessible using `$slots[""]`)_.

### `$attrs: Record<PropertyKey, string>`

A record of specified [attributes](https://developer.mozilla.org/docs/Web/HTML/Attributes) on the custom element.

## Modifiers

### `.flat[boolean]`

Replace occurences of this custom element by their content. Note that it not possible to access `$slots` and `$attrs` variables when using this modifier.

# `#slot`

| Version                                         | Phase      |
| ----------------------------------------------- | ---------- |
| ![](https://jsr.io/badges/@mizu/custom-element) | 0 — `META` |

Specify target `[<slot>](https://developer.mozilla.org/docs/Web/HTML/Element/slot)` in an element defined by a [`*custom-element`](#custom-element) directive.

```html
<my-element>
  <li #items=""><!--...---></li>
</my-element>
```

## Notes

> [!NOTE]
> Elements without a [`#slot`](#slot) directive are appended to the _(unamed)_ default slot.

> [!NOTE]
> Elements targetting a same slot are all appended to it in the same order they were defined.
