# `::value="model"`

| Version                                | Phase                        |
| -------------------------------------- | ---------------------------- |
| ![](https://jsr.io/badges/@mizu/model) | 52 — `ATTRIBUTE_MODEL_VALUE` |

Bind an [`<input>`](https://developer.mozilla.org/docs/Web/HTML/Element/input), [`<select>`](https://developer.mozilla.org/docs/Web/HTML/Element/select) or [`<textarea>`](https://developer.mozilla.org/docs/Web/HTML/Element/textarea) element's
[`value` attribute](https://developer.mozilla.org/docs/Web/HTML/Attributes) in a bi-directional manner.

```html
<select ::value="foo">
  <!--<option>...</option>-->
</select>
```

## Notes

> [!WARNING] [`<input type="checkbox">`](https://developer.mozilla.org/docs/Web/HTML/Element/input/checkbox) and [`<select multiple>`](https://developer.mozilla.org/docs/Web/HTML/Element/select#multiple) elements will bind to an array of values.

> [!CAUTION]
> Must be used on elements with a `value` property, such as [`<input>`](https://developer.mozilla.org/docs/Web/HTML/Element/input), [`<select>`](https://developer.mozilla.org/docs/Web/HTML/Element/select), or
> [`<textarea>`](https://developer.mozilla.org/docs/Web/HTML/Element/textarea). For other elements, use the [`: attribute`](#bind) directive.

> [!NOTE]
> You can use the shorthand syntax `::="model"` instead of `:: value="model"`.

## Modifiers

### `.event[string="input"]`

Change the [`Event`](https://developer.mozilla.org/docs/web/api/event) that triggers the model update. Recommended events are [`"input"`](https://developer.mozilla.org/docs/Web/API/Element/input_event) or
[`"change"`](https://developer.mozilla.org/docs/Web/API/HTMLElement/change_event).

### `.name[boolean]`

Automatically set the [input `name` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/input#name) based on the attribute's value _(e.g., `<input ::.name= "foo">` becomes `<input name= "foo">`)_. The default is `true` for
[`<input type="radio">`](https://developer.mozilla.org/docs/Web/HTML/Element/input/radio) and [`<input type="checkbox">`](https://developer.mozilla.org/docs/Web/HTML/Element/input/checkbox), and `false` for all other elements.

### `.value[boolean]`

Initialize the model using the [nullish coalescing operator](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) and the [input `value` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/input#value) if present _(e.g.,
`<input ::.value= "foo"value= "bar">` assigns `foo` the value `"bar"` if it was nullish)_.

### `.throttle[duration≈250ms]`

Prevent the listener from being called more than once during the specified time frame.

### `.debounce[duration≈250ms]`

Delay listener execution until the specified time frame has passed without any activity.

### `.keys[string]`

Specify which keys must be pressed for the listener to trigger on a [`KeyboardEvent`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent). See [`@event.keys` modifier](#event) for more information.
