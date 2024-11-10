# `*refresh="interval"`

| Version                                  | Phase                 |
| ---------------------------------------- | --------------------- |
| ![](https://jsr.io/badges/@mizu/refresh) | 99 — `POSTPROCESSING` |

Reprocess an element at a specified interval _(in seconds)_.

```html
<div *refresh="1.5">
  <!--<time *text="new Date()"></time>-->
</div>
```

## Notes

> [!WARNING]
> Context is recreated from the initial root context and the element itself, meaning intermediate computations are not retained. Use this only on elements that can be rendered independently to avoid unexpected errors.

> [!WARNING]
> Avoid using with iterative directives like [`*for`](#for) as [`*refresh`](#refresh) will be duplicated for each generated element.

> [!NOTE]
> The target element will be rendered regardless of detected changes. This is useful for updating content that cannot be directly observed, but use sparingly to avoid performance issues.

> [!NOTE]
> Set the interval to `null` to stop refreshing.

> [!NOTE]
> If the element is commented out by a directive, the refresh is automatically cleared.

> [!NOTE]
> Refresh operations are performed using [`setTimeout`](https://developer.mozilla.org/docs/Web/API/Window/setTimeout). New calls are scheduled when the directive is processed again, ensuring a consistent interval.

## Variables

### `$refresh: boolean`

A flag that indicates whether the element is being refreshed.
