import { expect, test } from "@libs/testing"
import { Window } from "../engine/vdom/mod.ts"
import { Client } from "./client.ts"

test()("`Client.render()` renders dom content", async () => {
  await using window = new Window(`<html><body><a *mizu ~test.text="foo"></a><b ~test.text="foo"></b><c *mizu ~test.text="$renderer"></c></body></html>`)
  Client.defaults.directives.push("@mizu/test")
  const mizu = new Client({ context: { foo: "" }, window })
  await mizu.render()
  expect(window.document.querySelector("a")?.textContent).toBe("")
  expect(window.document.querySelector("b")?.textContent).toBe("")
  expect(window.document.querySelector("c")?.textContent).toBe("client")

  await mizu.render(undefined, { context: { foo: "bar" }, state: { $renderer: "custom" } })
  expect(window.document.querySelector("a")?.textContent).toBe("bar")
  expect(window.document.querySelector("b")?.textContent).toBe("")
  expect(window.document.querySelector("c")?.textContent).toBe("custom")

  mizu.context.foo = "baz"
  await mizu.render()
  expect(window.document.querySelector("a")?.textContent).toBe("baz")
  expect(window.document.querySelector("b")?.textContent).toBe("")
  expect(window.document.querySelector("c")?.textContent).toBe("client")

  await mizu.flush()
})
