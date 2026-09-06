# `*mizu`

| Version                               | Phase             |
| ------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu) | 1 — `ELIGIBILITY` |

Enable _**mizu.js**_ rendering for the element and its children.

```html
<main *mizu>
  <!--...-->
</main>
```

## Notes

> [!CAUTION]
> For performance reasons, this directive must not have any [`[tag]`](/#concept-directive-tag) or [`.modifiers`](/#concept-directive-modifier). If it does, the directive will be ignored.

> [!NOTE]
> You can choose whether to require this directive for _**mizu.js**_ rendering with the [`implicit`](https://jsr.io/@mizu/render@0.5.0/doc/engine/~/RendererRenderOptions.implicit) option when using the [user API](/#api-user). By default, rendering is explicit in Client-Side APIs
> and implicit in Server-Side APIs.

## Variables

### `$root: HTMLElement`

The closest element that declares a [`*mizu`](#mizu) directive.

# `!ephemeral`

| Version                               | Phase             |
| ------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu) | 1 — `ELIGIBILITY` |

Evaluate a directive a single time and remove it automatically after being processed.

```html
<input type="button" value="Click me!" !@click="this.value = 'Clicked!'">
```

## Notes

> [!NOTE]
> Directives using the `*` prefix may omit it _(e.g. `!directive` is equivalent to `!*directive`)_.

> [!NOTE]
> Directives that have placement restrictions must also be marked as ephemeral _(e.g. `!if` / `!else`)_.
