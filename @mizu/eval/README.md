# `*eval="expression"`

| Version                               | Phase                    |
| ------------------------------------- | ------------------------ |
| ![](https://jsr.io/badges/@mizu/eval) | 89 — `CUSTOM_PROCESSING` |

Evaluate a JavaScript expression in the context of the element.

```html
<div *eval="console.log('$data')">
  <!--...-->
</div>
```

## Notes

> [!WARNING]
> Use this directive sparingly, prefer alternative directives for better maintainability and security. This directive is intended for edge cases.

> [!NOTE]
> The expression runs **after** the element and all its children have been fully processed.
