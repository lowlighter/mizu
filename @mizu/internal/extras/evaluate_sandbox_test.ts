import { expect, runtime, test } from "@libs/testing"
import { evaluate } from "./evaluate.ts"

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
}
