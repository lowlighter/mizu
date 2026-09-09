import { expect, fn, test, type testing } from "@libs/testing"
import { test as _test } from "@mizu/internal/testing"
import { Window } from "@mizu/internal/vdom"
import { type Directive, Phase, Renderer } from "@mizu/internal/engine"
import directive from "./mod.ts"

_test(import.meta)

test("[@event] supports `_event` internal api", async () => {
  await using window = new Window()
  const tested = {
    name: "~tested",
    phase: Phase.TESTING,
    init: directive.init,
    execute: (renderer, element, options) => directive.execute(renderer, element, { ...options, _event: "testing" } as testing),
  } as Directive
  const renderer = await new Renderer(window, { directives: [tested] }).ready
  const element = Object.assign(renderer.createElement("div", { attributes: { [`${tested.name}`]: "" } }), { addEventListener: fn() })
  await renderer.render(element)
  expect(element.addEventListener).toHaveBeenCalledWith("testing", expect.any(Function), expect.any(Object))
})

test("[@event] supports `_callback` internal api", async () => {
  await using window = new Window()
  const callback = fn()
  const tested = {
    name: "~tested",
    phase: Phase.TESTING,
    init: directive.init,
    execute: (renderer, element, options) => directive.execute(renderer, element, { ...options, _event: "testing", _callback: callback } as testing),
  } as Directive
  const renderer = await new Renderer(window, { directives: [tested] }).ready
  const element = renderer.createElement("div", { attributes: { [`${tested.name}`]: "" } })
  await renderer.render(element)
  element.dispatchEvent(new renderer.window.Event("testing"))
  expect(callback).toHaveBeenCalled()
})
