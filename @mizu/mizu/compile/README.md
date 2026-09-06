# `*mizu.compile`

| Version                                       | Phase             |
| --------------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu/compile) | 1 — `ELIGIBILITY` |

Mark an element to be rendered client-side by a self-contained bundle of _**mizu.js**_, reduced to the directives it uses.

```html
<main *mizu.compile>
  <!--...-->
</main>
```

## Notes

> [!NOTE]
> The element and its children are skipped by the server renderer. `Server.compile()` appends a `<script>` to the element, bundling _**mizu.js**_ with the directives found in its subtree along with the current context.

> [!NOTE]
> When the value is a selector matching a `<script>` of the document, rendering is deferred until `Mizu.hydrate()` is called from it _(e.g. `Mizu.hydrate({ context: { foo: "bar" } })`)_, otherwise it happens on load.

> [!CAUTION]
> Context values are shipped as code: functions lose their closure, native functions must be reachable from `globalThis` _(e.g. `Math.random`)_, and other values are skipped with a warning. `Server.compile()` requires `Deno.bundle()`.
