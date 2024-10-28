# `*for="expression"`

| Version                              | Phase         |
| ------------------------------------ | ------------- |
| ![](https://jsr.io/badges/@mizu/for) | 21 — `EXPAND` |

Render an element for each iteration performed.

```html
<!--<ul>-->
<li *for="let item of items"></li>
<!--</ul>-->
```

## Notes

> [!CAUTION]
> The expression can be:
>
> - Any syntax supported inside [`for`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for), [`for...in`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for...in) and
>   [`for...of`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for...of) loops.
> - Any iterable object that implements [`Symbol.iterator`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator).
>   - The iterated key is exposed as `$key`.
>   - The iterated value is exposed as `$value`.
> - A finite `number`.
>   - The directive is applied the specified number of times.

> [!WARNING]
> There is currently no distinction between [`let`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/let), [`const`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/const) and
> [`var`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/var) declarations inside `for` loops, but future versions may introduce specific behavior for these.

> [!WARNING]
> There is currently no special handling for [`<template>`](https://developer.mozilla.org/docs/Web/HTML/Element/template) elements, but future versions may introduce specific behavior for these elements.

## Variables

### `$id: string`

The evaluated value of the [`*id`](#id) directive if present, or the auto-generated identifier.

### `$iterations: number`

The total number of iterations.

### `$i: number`

The current iteration index _(0-based)_.

### `$I: number`

The current iteration index _(1-based, same as `$i + 1`)_.

### `$first: number`

Whether this is the first iteration _(same as `$i === 0`)_.

### `$last: number`

Whether this is the last iteration _(same as `$i === ($iterations - 1)`)_.

# `*id="expression"`

| Version                              | Phase      |
| ------------------------------------ | ---------- |
| ![](https://jsr.io/badges/@mizu/for) | 0 — `META` |

Hint for [`*for`](#for) directive to differentiate generated elements.

```html
<!--<ol>-->
<li *for="const {id} of items" *id="id"></li>
<!--</ol>-->
```

## Notes

> [!CAUTION]
> Must be used on an element with a [`*for`](#for) directive.

> [!NOTE]
> Identifiers must be unique within the loop, any duplicates will be replaced by the last occurrence.
