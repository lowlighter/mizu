import { expect, test } from "@libs/testing"
import { evaluate } from "./evaluate.ts"

test("`evaluates()` evaluates expressions", async () => {
  await expect(evaluate("1 + 1")).resolves.toBe(2)
  await expect(evaluate("foo + bar", { foo: 1, bar: 2 })).resolves.toBe(3)
  await expect(evaluate("function foo() {}")).resolves.toBeInstanceOf(Function)
})

test("`evaluates()` evaluates expressions in function context", async () => {
  await expect(evaluate("1 + 1", null, { context: "function" })).resolves.toBeUndefined()
  await expect(evaluate("return 1 + 1", null, { context: "function" })).resolves.toBe(2)
  await expect(evaluate("return foo + bar", { foo: 1, bar: 2 }, { context: "function" })).resolves.toBe(3)
  await expect(evaluate("return function foo() {}", null, { context: "function" })).resolves.toBeInstanceOf(Function)
})

test("`evaluates()` supports `imports` options", async () => {
  await expect(evaluate("foo.default", null, { imports: { foo: "data:application/javascript,export default 'bar'" } })).resolves.toBe("bar")
})
