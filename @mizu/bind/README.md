# `:attribute="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's `[attribute](https://developer.mozilla.org/docs/Web/HTML/Attributes)` value.

```html
<a :href="url">
  <!--...-->
</a>
```

## Notes

> [!WARNING]
> Binding directives is not officially supported and is considered undefined behaviour.

> [!WARNING] [`:class`](#bind-class) and [`:style`](#bind-style) have specific handling described below.

> [!NOTE]
> Multiple attributes can be bound in a single directive using the empty shorthand `:="object"` _(e.g. `:="{ foo: 'bar', bar: true }"`)_.

> [!NOTE]
> Any [boolean attribute defined by the HTML spec](https://html.spec.whatwg.org/#attributes-3) is handled accordingly (removed from the element when falsy).

> [!NOTE]
> Bound attributes with `null` or `undefined` values are removed from the element.

# `:class="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's `[class](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/class)` attribute.

```html
<p :class="{ foo: true, bar: false }">
  <!--...-->
</p>
```

## Notes

> [!NOTE]
> Evaluated expression can be either be:
>
> - A `string` of space-separated class names _(e.g. `"foo bar"`)_.
> - A `Record<PropertyKey, boolean>` of class names mapped to their current state _(e.g. `{ foo: true, bar: false }`)_.
> - An `Array` of any of the listed supported types _(e.g. `[ "foo", { bar: false }, [] ]`)_.

> [!NOTE]
> Initial `class` attribute value is preserved.

> [!NOTE]
> Class names with at least one [truthy value](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) are treated as active.

# `:style="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's `[style](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/style)` attribute.

```html
<p :style="{ color: 'salmon' }">
  <!--...-->
</p>
```

## Notes

> [!NOTE]
> Evaluated expression can be either be:
>
> - A `string` supported by [`HTMLElement.style.cssText`](https://developer.mozilla.org/docs/Web/API/CSSStyleDeclaration/cssText) _(e.g. `"color: blue;"`)_.
> - A `Record<PropertyKey, unknown>` of CSS properties mapped to their current value _(e.g. `{ backgroundColor: "red", "border-color": "green", width: 1 }`)_.
>   - [« camelCase »](https://developer.mozilla.org/docs/Glossary/Camel_case) may be used inplace of [« kebab-case »](https://developer.mozilla.org/docs/Glossary/Kebab_case) to avoid escaping CSS properties names.
>   - Values of type `number` are implicitely converted to `px` unit whenever applicable _( [`HTMLElement.style.setProperty()`](https://developer.mozilla.org/docs/Web/API/CSSStyleDeclaration/setProperty) will be called again with `"px"` appended)_.
> - An `Array` of any of the listed supported types _(e.g. `[ "color: blue", { backgroundColor: "red" }, [] ]`)_.

> [!NOTE]
> Initial `style` attribute value is preserved.

> [!NOTE]
> Specified CSS properties values are processed in the order they are defined, regardless of whether they were marked as [`!important`](https://developer.mozilla.org/docs/Web/CSS/important).
