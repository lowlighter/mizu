# `*ref="name"`

| Version                              | Phase            |
| ------------------------------------ | ---------------- |
| ![](https://jsr.io/badges/@mizu/ref) | 82 — `REFERENCE` |

Create a reference to an element for later use.

```html
<div *ref="foo" data-text="bar">
  <!--<p *text="$refs.foo.dataset.text"></p>-->
</div>
```

## Notes

> [!NOTE]
> Redefining a reference will shadow its previous value within the current subtree, without affecting its value in the parent subtree.

## Variables

### `$refs: Record<PropertyKey, HTMLElement>`

A collection of all referenced elements within the current subtree.

## Modifiers

### `.raw[boolean=true]`

Skip expression evaluation if set.
