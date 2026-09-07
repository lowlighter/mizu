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
> The subtree is skipped by the server renderer, unless the `render` mode is used, in which case it is rendered before being compiled.

> [!NOTE]
> `Server.compile()` appends a `<script>` to the element, bundling _**mizu.js**_ with the directives found in its subtree along with the current context. Use [`*mizu.compile-entrypoint`](#mizu-compile-entrypoint) to control where and when it is rendered.

> [!CAUTION]
> Context values are shipped as code: functions lose their closure, native functions must be reachable from `globalThis` _(e.g. `Math.random`)_, and other values are skipped with a warning. `Server.compile()` requires `Deno.bundle()`.

# `*mizu.compile-entrypoint`

| Version                                       | Phase             |
| --------------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu/compile) | 1 — `ELIGIBILITY` |

Use a `<script>` as the entrypoint of a compiled element.

```html
<main *mizu.compile>
  <script *mizu.compile-entrypoint>
  Mizu.hydrate({ context: { foo: "bar" } })
  </script>
</main>
```

## Notes

> [!NOTE]
> Its content is bundled along with _**mizu.js**_ and replaces the script, with `Mizu.hydrate()` available in scope to render the element _(rather than on load)_. Options are merged over the shipped context.

> [!CAUTION]
> Must be placed within an element using the [`*mizu.compile`](#mizu-compile) directive.
