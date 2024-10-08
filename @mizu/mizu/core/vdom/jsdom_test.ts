import { expect, test } from "@libs/testing"
import { Window } from "./jsdom.ts"

test()("`Window.constructor()` returns a new instance", async () => {
  await using window = new Window()
  expect(window.document).toBeDefined()
  expect(window.location.href).toBe(globalThis.location?.href ?? "about:blank")
})
