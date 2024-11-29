import { expect, test } from "@libs/testing"
import { filter } from "./filter.ts"
import { format } from "./format.ts"
import { Window } from "../vdom/mod.ts"
import { Phase, Renderer } from "../engine/mod.ts"
const renderer = await new Renderer(new Window()).ready

test("`filter()` returns `Element.innerHTML` after filtering it", async () => {
  await using window = new Window(`<expect><main></main></expect>`)
  const main = window.document.querySelector("expect")
  expect(filter(renderer, main)).toBe(format("<main></main>"))
  expect(filter(renderer, null)).toBe(format(""))
})

test("`filter()` recurses on `Node.childNodes`", async () => {
  await using window = new Window(`<expect><main><a><b style="color: blue"></b></a></main></expect>`)
  const main = window.document.querySelector("expect")
  expect(filter(renderer, main)).toBe(format(`<main><a><b style="color: blue;"></b></a></main>`))
})

test("`filter()` formats `style` attributes to match `deno fmt` output", async () => {
  await using window = new Window(`<expect><main style="color: red"></main></expect>`)
  const main = window.document.querySelector("expect")
  expect(filter(renderer, main)).toBe(format(`<main style="color: red;"></main>`))
})

test("`filter()` formats `Element.innerHTML` when `format: true`", async () => {
  await using window = new Window(`<expect><main>\n<span>foo</span></main></expect>`)
  const main = window.document.querySelector("expect")
  expect(filter(renderer, main, { format: false })).toBe("<main>\n<span>foo</span></main>")
  expect(filter(renderer, main, { format: true })).toBe(format("<main>\n  <span>foo</span>\n</main>"))
})

test("`filter()` filters out `Comment` when `comments: false`", async () => {
  await using window = new Window(`<expect><main><!--foo--></main></expect>`)
  const main = window.document.querySelector("expect")
  expect(filter(renderer, main, { comments: false })).toBe(format("<main></main>"))
  expect(filter(renderer, main, { comments: true })).toBe(format("<main><!--foo--></main>"))
})

test("`filter()` filters out `Element` with a `filter-remove` attribute", async () => {
  await using window = new Window(`<expect><main><a filter-remove></a><b></b></main></expect>`)
  const main = window.document.querySelector("expect")
  const renderer = await new Renderer(window).ready
  expect(filter(renderer, main)).toBe(format(`<main><b></b></main>`))
})

test("`filter()` filters out `Attr` not matching specified `directives`", async () => {
  await using window = new Window(`<expect><main *foo="bar" *foo[bar]="baz" *foo.bar.baz="qux" *bar="foobar" ~baz="qux" *keep></main></expect>`)
  const main = window.document.querySelector("expect")
  const directives = [{ name: "*foo", phase: Phase.TESTING }, { name: "*bar", phase: Phase.TESTING }, { name: /^~(?<test>)/, phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { directives }).ready
  expect(filter(renderer, main, { directives: [] })).toBe(format(`<main *keep=""></main>`))
  expect(filter(renderer, main, { directives: ["*bar"] })).toBe(format(`<main *bar="foobar" *keep=""></main>`))
  expect(filter(renderer, main, { directives: ["/^~(?<test>)/"] })).toBe(format(`<main ~baz="qux" *keep=""></main>`))
  expect(filter(renderer, main, { directives: ["*"] })).toBe(format(`<main *foo="bar" *foo[bar]="baz" *foo.bar.baz="qux" *bar="foobar" ~baz="qux" *keep=""></main>`))
})

test("`filter()` filters out `Attr` matching the `clean` pattern", async () => {
  await using window = new Window(`<expect><main test-foo data-bar></main></expect>`)
  const main = window.document.querySelector("expect")
  const renderer = await new Renderer(window).ready
  expect(filter(renderer, main, { clean: "^test-" })).toBe(format(`<main data-bar=""></main>`))
})
