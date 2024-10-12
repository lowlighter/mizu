import { expect, test } from "@libs/testing"
import { capture } from "./capture.ts"

test()("`capture()` captures content between delimiters", () => {
  const { captured, match, a, b } = capture("foo {{ bar }} baz", { start: "{{", end: "}}" })!
  expect(captured).toBe("bar")
  expect(match).toBe("{{ bar }}")
  expect(a).toBe("foo {{".length)
  expect(b).toBe("foo {{ bar }}".length)
})

test()("`capture()` handles nested brackets", () => {
  expect(capture("{{ `{{ bar }}` }}", { start: "{{", end: "}}" })).toMatchObject({ captured: "`{{ bar }}`" })
  //expect(capture("{{ `bar }}` }}", { start: "{{", end: "}}" })).toMatchObject({ captured: "`bar }}`" })
  //expect(capture("{{ `{{ bar` }}", { start: "{{", end: "}}" })).toMatchObject({ captured: "`{{ bar`" })
})

test()("`capture()` throws `new SyntaxError()` on unclosed expressions", () => {
  expect(() => capture("foo {{ bar baz", { start: "{{", end: "}}" }))._toThrow(SyntaxError, "Unclosed expression")
})
