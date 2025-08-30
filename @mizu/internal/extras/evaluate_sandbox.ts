import { Renderer } from "../engine/mod.ts"
onmessage = async (event) => {
  try {
    const { expression, variables, imports, context } = event.data as { expression: string; variables: Record<PropertyKey, unknown> | null; imports: Record<string, string>; context: "expression" | "function" }
    // deno-lint-ignore no-explicit-any
    const renderer = await new Renderer(null as any, { directives: [] }).ready
    const result = await renderer.evaluate(null, expression, {
      state: { ...Object.fromEntries(await Promise.all(Object.entries(imports).map(async ([name, value]) => [name, await import(value)]))), ...variables },
      args: context === "function" ? [] : undefined,
    })
    postMessage({ result })
  } catch (error) {
    postMessage({ error })
  } finally {
    self.close()
  }
}
