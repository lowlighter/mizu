import type { testing } from "@libs/testing"
import { expect, test} from "@libs/testing"
import { resolve } from "./resolve.ts"

test()("`resolve()` resolves imports in deno", () => {
  expect(resolve("@libs/testing", import.meta)).toBe(import.meta.resolve("@libs/testing"))
  expect(resolve("@npm/jsdom", import.meta)).toBe(import.meta.resolve("@npm/jsdom"))
})

test()("`resolve()` resolves imports in browsers", () => {
  try {
    Object.assign(globalThis, { window: {} })
    for (const meta of [import.meta, {}, undefined] as testing) {
      expect(resolve("@libs/testing", meta)).toBe("https://esm.sh/jsr/@libs/testing")
      expect(resolve("@npm/jsdom", meta)).toBe("https://esm.sh/jsdom")
    }
  }
  finally {
    delete (globalThis as testing).window
  }
})
