import { expect, test } from "@libs/testing"
import { Window } from "@mizu/internal/vdom"
import { Server } from "./server.ts"

test("`Server.render()` renders content", async () => {
  const html = `<html><body><a ~test.text="foo"></a><b ~test.text="foo"></b><c ~test.text="$renderer"></c></body></html>`
  const mizu = new Server({ directives: ["@mizu/test"], context: { foo: "" } })
  await expect(mizu.render(html, { select: "body" })).resolves.toBe(`<body><a ~test.text="foo"></a><b ~test.text="foo"></b><c ~test.text="$renderer">server</c></body>`)
  await expect(mizu.render(html, { select: "body", context: { foo: "bar" }, state: { $renderer: "custom" } })).resolves.toBe(`<body><a ~test.text="foo">bar</a><b ~test.text="foo">bar</b><c ~test.text="$renderer">custom</c></body>`)
})

test("`Server.render()` renders virtual nodes", async () => {
  await using window = new Window(`<html><body><a ~test.text="foo"></a></html>`)
  const mizu = new Server({ directives: ["@mizu/test"], context: { foo: "bar" } })
  await expect(mizu.render(window.document.documentElement, { select: "body" })).resolves.toBe(`<body><a ~test.text="foo">bar</a></body>`)
})

test("`Server.render()` returns doctype when no selector is passed", async () => {
  const html = `<html><body><body></html>`
  const mizu = new Server()
  await expect(mizu.render(html)).resolves.toMatch(/^<!DOCTYPE html>/)
})

test("`Server.context` can be edited", async () => {
  await using window = new Window(`<html><body><a ~test.text="foo"></a></html>`)
  const mizu = new Server({ directives: ["@mizu/test"] })
  expect(mizu.context).toEqual({})
  mizu.context = { foo: "bar" }
  expect(mizu.context).toEqual({ foo: "bar" })
  await expect(mizu.render(window.document.documentElement, { select: "body" })).resolves.toBe(`<body><a ~test.text="foo">bar</a></body>`)
})
