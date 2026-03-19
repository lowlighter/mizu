import { expect, runtime, test, type testing } from "@libs/testing"
import { Window } from "@mizu/internal/vdom"
import { retry } from "@std/async/retry"

if (runtime === "deno") {
  test("`Client.render()` is automatically called in iife mode", async () => {
    try {
      await using window = new Window(`<body *mizu><p *text="'foo'"></p></body>`)
      Object.assign(globalThis, { MIZU_IIFE: true, window })
      await import("./mod.ts")
      await retry(() => expect(window.document.querySelector("p")?.textContent).toBe("foo"))
    } finally {
      delete (globalThis as testing).MIZU_IIFE
      delete (globalThis as testing).window
    }
  })
}
