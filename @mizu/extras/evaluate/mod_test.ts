import { expect, runtime, test } from "@libs/testing"
import { evaluate } from "./mod.ts"

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

if (runtime === "deno") {
  test("`evaluates()` supports `permissions` options", async () => {
    await expect(evaluate("Deno.osRelease()", null, { permissions: "none" })).rejects.toThrow(/run again with the --allow-sys flag/)
    await expect(evaluate("Deno.osRelease()", null, { permissions: { sys: ["osRelease"] } })).resolves.toBe(Deno.osRelease())
  })

  test("`evaluates()` supports `permissions` options and evaluates expressions in function context", async () => {
    await expect(evaluate("return Deno.osRelease()", null, { context: "function", permissions: "none" })).rejects.toThrow(/run again with the --allow-sys flag/)
    await expect(evaluate("return Deno.osRelease()", null, { context: "function", permissions: { sys: ["osRelease"] } })).resolves.toBe(Deno.osRelease())
  })

  test("`evaluates()` supports `imports` options", async () => {
    await expect(evaluate("foo.default", null, { imports: { foo: "data:application/javascript,export default 'bar'" } })).resolves.toBe("bar")
  })

  test("`evaluates()` supports `permissions` and `imports` options", async () => {
    await expect(evaluate("foo.default", null, { permissions: "none", imports: { foo: "data:application/javascript,export default Deno.osRelease()" } })).rejects.toThrow(/run again with the --allow-sys flag/)
    await expect(evaluate("foo.default", null, { permissions: { sys: ["osRelease"] }, imports: { foo: "data:application/javascript,export default Deno.osRelease()" } })).resolves.toBe(Deno.osRelease())
  })

  test("`evaluates()` supports `permissions` and custom `sandbox` module", async () => {
    await expect(evaluate("Deno.osRelease()", null, { permissions: "none", sandbox: import.meta.resolve("./sandbox.ts") })).rejects.toThrow(/run again with the --allow-sys flag/)
    await expect(evaluate("Deno.osRelease()", null, { permissions: { sys: ["osRelease"] }, sandbox: import.meta.resolve("./sandbox.ts") })).resolves.toBe(Deno.osRelease())
  })
}
