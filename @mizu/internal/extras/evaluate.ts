// Imports
import type { Nullable, State } from "@mizu/internal/engine"
import { Renderer } from "@mizu/internal/engine"

/** Default renderer instance. */
// deno-lint-ignore no-explicit-any
const renderer = await new Renderer(null as any, { directives: [] }).ready

/**
 * Evaluate an expression with given variables and arguments.
 *
 * This is a convenience function built upon Mizu {@linkcode Renderer.evaluate} and does not require a DOM or an already instantiated renderer.
 *
 * Both `variables` and `imports` are exposed through {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/with | with} statements,
 * meaning that their properties can be accessed directly in the expression without prefixing them.
 *
 * It is possible to specify the `context` (either `"expression"` or `"function"`).
 *
 * If set to `"expression"` (default), the expression is evaluated as a regular JavaScript expression.
 * ```ts
 * console.assert(await evaluate("1 + 1") === 2)
 * ```
 *
 * If set to `"function"`, the expression is automatically wrapped in an async function, effectively treating the expression as a function body.
 * It also means that no implicit value is returned, requiring an explicit `return` statement to return a value.
 *
 * ```ts
 * console.assert(await evaluate("return 1 + 1", null, { context: "function" }) === 2)
 * ```
 *
 * > [!IMPORTANT]
 * > Note that because evaluation is not performed within a ESM module, it is not possible to use {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/import | import} statement directly (and other ESM-only features).
 * > Instead, use the `imports` option which will dynamically import the specified modules and expose them in the evaluation context.

 * Both of these examples are equivalent:
 * ```ts
 * console.assert(await evaluate("foo.default", null, { imports: { foo: "data:application/javascript,export default true" }}) === true)
 * ```
 * ```ts
 * const foo = await import("data:application/javascript,export default true")
 * console.assert(await evaluate("foo.default", { foo }))
 * ```
 *
 * > [!NOTE]
 * > The root {@linkcode Renderer.internal} prefix is used internally to manage evaluation state, and thus cannot be used as a variable name.
 */
export async function evaluate<T = unknown>(expression: string, variables = null as Nullable<Record<PropertyKey, unknown>>, { imports = {} as Record<string, string>, context = "expression" as "expression" | "function" } = {}): Promise<T> {
  if (context === "function") {
    expression = `async () =>{${expression}}`
  }
  variables ??= {}
  return await renderer.evaluate(null, expression, {
    state: { ...Object.fromEntries(await Promise.all(Object.entries(imports).map(async ([name, value]) => [name, await import(value)]))), ...variables } as State,
    args: context === "function" ? [] : undefined,
  }) as T
}
