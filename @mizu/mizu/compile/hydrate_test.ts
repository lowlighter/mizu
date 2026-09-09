import { expect, test } from "@libs/testing"
import { Window } from "@mizu/internal/vdom"
import { Context, Renderer } from "@mizu/internal/engine"
import _if from "@mizu/if/else"
import _for from "@mizu/for/empty"
import _text from "@mizu/text"
import { hydrate } from "./hydrate.ts"
const directives = [_if, _for, _text]

test("`hydrate()` restores the elements commented out by a server-side render", async () => {
  const content = `<div id="fragment"><p *if="shown" *text="'conditional'"></p><li *for="const item of items" *text="item"></li></div>`
  await using window = new Window(`<body>${content}</body>`)
  const renderer = await new Renderer(window, { directives }).ready
  const element = renderer.document.querySelector("#fragment") as unknown as HTMLElement

  // A server-side render comments out the conditional element and generates the loop items
  await renderer.render(element, { context: new Context({ shown: false, items: ["a", "b"] }) })
  expect(element.innerHTML).toBe(`<!--[*if="shown"]--><!--[*for="const item of items"]--><li *text="item">a</li><li *text="item">b</li>`)

  // The elements are preserved so another renderer can restore them
  element.innerHTML =
    `<template ${"data-mizu"}='[*if="shown"]'><p *if="shown" *text="'conditional'"></p></template><!--[/data-mizu]--><template ${"data-mizu"}='[*for="const item of items"]'><li *for="const item of items" *text="item"></li></template><li *text="item">a</li><li *text="item">b</li><!--[/data-mizu]-->`
  await using client = new Window(`<body>${element.outerHTML}</body>`)
  const hydrated = await new Renderer(client, { directives }).ready
  const target = hydrated.document.querySelector("#fragment") as unknown as HTMLElement
  hydrate(hydrated, target)
  expect(target.innerHTML).toBe(`<!--[*if="shown"]--><!--[*for="const item of items"]-->`)

  // The restored elements are rendered again with the client context
  await hydrated.render(target, { context: new Context({ shown: true, items: ["a", "b", "c"] }) })
  expect(target.innerHTML).toBe(`<p *if="shown" *text="'conditional'">conditional</p><!--[*for="const item of items"]--><li *text="item">a</li><li *text="item">b</li><li *text="item">c</li>`)
})
