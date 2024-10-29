# `:attribute="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's [`attribute`](https://developer.mozilla.org/docs/Web/HTML/Attributes) value.

```html
<a :href="url">
  <!--...-->
</a>
```

## Notes

> [!NOTE]
> Binding directives is not officially supported and is considered undefined behaviour.

> [!WARNING] [`:class`](#bind-class) and [`:style`](#bind-style) have specific handling described below.

> [!NOTE]
> Bind multiple attributes in a single directive using the shorthand `:="object"` _(e.g. `:="{ foo: 'bar', bar: true }"`)_.

> [!NOTE]
> Boolean attributes defined by the [HTML spec](https://html.spec.whatwg.org/#attributes-3) are handled accordingly (removed when falsy).

> [!NOTE]
> Attributes with `null` or `undefined` values are removed.

# `:class="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's [`class`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/class) attribute.

```html
<p :class="{ foo: true, bar: false }">
  <!--...-->
</p>
```

## Notes

> [!NOTE]
> The expression can be:
>
> - A `string` of space-separated class names _(e.g., `"foo bar"`)_.
> - A `Record<PropertyKey, boolean>` mapping class names to their state _(e.g., `{ foo: true, bar: false }`)_.
> - An `Array` of the supported types _(e.g., `[ "foo", { bar: false }, [] ]`)_.

> [!NOTE]
> The initial `class` attribute value is preserved.

> [!NOTE]
> Class names with at least one [truthy value](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) are treated as active.

# `:style="value"`

| Version                               | Phase            | Multiple |
| ------------------------------------- | ---------------- | -------- |
| ![](https://jsr.io/badges/@mizu/bind) | 51 — `ATTRIBUTE` | Yes      |

Bind an element's [`style`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/style) attribute.

```html
<p :style="{ color: 'salmon' }">
  <!--...-->
</p>
```

## Notes

> [!NOTE]
> The expression can be:
>
> - A `string` supported by [`HTMLElement.style.cssText`](https://developer.mozilla.org/docs/Web/API/CSSStyleDeclaration/cssText) _(e.g., `"color: blue;"`)_.
> - A `Record<PropertyKey, unknown>` mapping CSS properties to their values _(e.g., `{ backgroundColor: "red", "border-color": "green", width: 1 }`)_.
>   - Use [« camelCase »](https://developer.mozilla.org/docs/Glossary/Camel_case) instead of [« kebab-case »](https://developer.mozilla.org/docs/Glossary/Kebab_case) to avoid escaping CSS property names.
>   - Values of type `number` are implicitly converted to `px` units when applicable _( [`HTMLElement.style.setProperty()`](https://developer.mozilla.org/docs/Web/API/CSSStyleDeclaration/setProperty) will be called with `"px"` appended)_.
> - An `Array` of the supported types _(e.g., `[ "color: blue", { backgroundColor: "red" }, [] ]`)_.

> [!NOTE]
> The initial `style` attribute value is preserved.

> [!NOTE]
> CSS properties are processed in the order they are defined, regardless of [`!important`](https://developer.mozilla.org/docs/Web/CSS/important).
