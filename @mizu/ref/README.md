# `*ref="name"`

| Version                              | Phase            |
| ------------------------------------ | ---------------- |
| ![](https://jsr.io/badges/@mizu/ref) | 82 — `REFERENCE` |

Create a reference to the element for later use.

```html
<div *ref="foo" data-text="bar">
  <!--<p *text="$refs.foo.dataset.text"></p>-->
</div>
```

## Notes

> [!NOTE]
> Redefining a reference will overwrite its previous value for the rest of the subtree without affecting its value in the parent subtree.

## Variables

### `$refs: Record<PropertyKey, HTMLElement>`

A record of all previously referenced elements in current subtree.

## Modifiers

### `.raw[boolean=true]`

Whether to skip expression evaluation or not.
