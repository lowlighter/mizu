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
> Must be defined on a [`<template>`](https://developer.mozilla.org/docs/Web/HTML/Element/template) element.

> [!CAUTION]
> The `tagname` must be a [valid custom element name](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements#name).

> [!NOTE]
> Valid [custom element names](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements#name) may be specified « as is ».

> [!NOTE]
> Custom elements registered this way do not use [Shadow DOM](https://developer.mozilla.org/docs/Web/API/Web_components/Using_shadow_DOM), their content is rendered directly.

## Variables

### `$slots: Record<PropertyKey, HTMLSlotElement>`

A record of [`# slot`](#slot) elements by [`<slot>`](https://developer.mozilla.org/docs/Web/HTML/Element/slot) name. The unnamed slot is accessible using `$slots[""]`.

### `$attrs: Record<PropertyKey, string>`

A record of [HTML attributes](https://developer.mozilla.org/docs/Web/HTML/Attributes) specified on the custom element.

## Modifiers

### `.flat[boolean]`

Replace occurrences of this custom element with its content. Note that `$slots` and `$attrs` variables are not accessible when using this modifier.

# `#slot`

| Version                                         | Phase      |
| ----------------------------------------------- | ---------- |
| ![](https://jsr.io/badges/@mizu/custom-element) | 0 — `META` |

Specify target [`<slot>`](https://developer.mozilla.org/docs/Web/HTML/Element/slot) in an element defined by a [`*custom-element`](#custom-element) directive.

```html
<my-element>
  <li #items><!--...---></li>
</my-element>
```

## Notes

> [!NOTE]
> Elements without a [`#slot`](#slot) directive are appended to the default (unnamed) slot.

> [!NOTE]
> Elements targeting the same slot are appended in the order they are defined.
