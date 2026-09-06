# `*mizu.compile`

| Version                                       | Phase             |
| --------------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu/compile) | 1 — `ELIGIBILITY` |

Compile the element and its children into self-contained HTML, where directives with client-side behaviour are turned into a vanilla script.

```html
<main *mizu.compile>
  <!--...-->
</main>
```

## Notes

> [!NOTE]
> Directives implementing a `compile()` hook _(such as [`@event`](#event))_ are compiled instead of being executed, and their attributes are removed. Their scripts are collected into a single `<script data-mizu>` appended to the element, and compiled elements are identified by a
> `data-mizu` attribute.

> [!NOTE]
> The context is shipped to the client as the default context of the script. Functions lose their closure but can still resolve shipped variables, and values that cannot be serialized are skipped with a warning.

> [!CAUTION]
> Compiled elements are not meant to be rendered again by _**mizu.js**_, and the shipped context is not shared with it.
