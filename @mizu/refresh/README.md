# `*refresh="interval"`

| Version                                  | Phase                 |
| ---------------------------------------- | --------------------- |
| ![](https://jsr.io/badges/@mizu/refresh) | 99 — `POSTPROCESSING` |

Force an element to be processed again at a specified interval _(in seconds)_.

```html
<div *refresh="1.5">
  <!--<time *text="new Date()"></time>-->
</div>
```

## Notes

> [!WARNING]
> Context is recreated starting from the initial root context and the element itself, meaning that anything computed in-between is not available. To prevent unexpected behaviour, it is recommended to only use this on elements that can be rendered independently.

> [!WARNING]
> Avoid using it on iterative directives such as [`*for`](#for) as the [`*refresh`](#refresh) directive will be duplicated for each generated element.

> [!NOTE]
> Target element will be rendered regardless of any detected changes. This directive is thus useful to update content that cannot be directly observed, but it is advised to use this sparingly to avoid performance issues.

> [!NOTE]
> Set the interval to `null` to clear the refresh.

> [!NOTE]
> If the element is commented out by a directive, refresh is automatically cleared.
