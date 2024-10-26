# `*mizu`

| Version                               | Phase             |
| ------------------------------------- | ----------------- |
| ![](https://jsr.io/badges/@mizu/mizu) | 1 — `ELIGIBILITY` |

Enable _**mizu**_ rendering for the element and its children.

```html
<main *mizu="">
  <!--...-->
</main>
```

## Notes

> [!CAUTION]
> For performance reasons, it is not possible to specify any attribute [`[tag]`](/#concept-directive-tag) or [`.modifiers`](/#concept-directive-modifier) with this directive.

> [!NOTE]
> If you are using the [user API](/#api-user), you can chose whether to require this directive or not to enable _**mizu**_ rendering using the `implicit` option. By default, rendering is explicit in Client-Side APIs and implicit in Server-Side APIs.

## Variables

### `$root: HTMLElement`

The closest element that declares a [`*mizu`](#mizu) directive.
