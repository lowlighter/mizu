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
> Usage of this directive is discouraged and it is recommended to use alternative directives whenever possible for improved maintainability and security reasons. It is nevertheless still offered to help covering edge cases.

> [!NOTE]
> It is executed after the element and all of its children have been completely processed.
