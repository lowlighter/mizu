import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { Server } from "./server.ts"
import { serialize } from "./compile.ts"

// Compilation requires `Deno.bundle()`
if (typeof (globalThis as { Deno?: { bundle?: unknown } }).Deno?.bundle === "function") {
  test("`Server.render()` leaves compiled elements unrendered", async () => {
    const mizu = new Server({ context: { foo: "bar" } })
    await expect(mizu.render(`<main *mizu.compile><p *text="foo"></p></main><p *text="foo"></p>`, { select: "body" })).resolves.toBe(`<body><main *mizu.compile=""><p *text="foo"></p></main><p *text="foo">bar</p></body>`)
    await expect(mizu.render(`<main *mizu.compile="render"><p *text="foo"></p></main>`, { select: "body" })).resolves.toBe(`<body><main *mizu.compile="render"><p *text="foo">bar</p></main></body>`)
  }, { permissions: "inherit" })

  test("`Server.compile()` bundles the directives used in compiled elements along with the context", async () => {
    const mizu = new Server({
      context: {
        foo: "bar",
        items: [1, 2],
        random: Math.random,
        greet() {
          return `hi ${this.foo}`
        },
      },
    })
    const html = await mizu.compile(`<main *mizu.compile><p *text="foo"></p><ul><template *for="items"><li *text="$value"></li></template></ul></main><p *text="foo"></p>`, { select: "body" })
    const [before, script, after] = split(html)
    expect(before).toBe(`<body><main><p *text="foo"></p><ul><template *for="items"><li *text="$value"></li></template></ul>`)
    expect(after).toBe(`</main><p *text="foo">bar</p></body>`)
    expect(script).toContain(`"*text"`)
    expect(script).toContain(`"*for"`)
    expect(script).not.toContain(`"*show"`)
    expect(script).toContain(`Math.random`)
    expect(script).toContain(`document.currentScript.parentElement`)
    expect(script).not.toContain(`globalThis.Mizu`)
  }, { permissions: "inherit" })

  test("`Server.compile()` with `render` mode renders compiled elements before bundling them", async () => {
    const mizu = new Server({ context: { foo: "bar" } })
    const [before] = split(await mizu.compile(`<main *mizu.compile="render"><p *text="foo"></p></main>`, { select: "body" }))
    expect(before).toBe(`<body><main><p *text="foo">bar</p>`)
  }, { permissions: "inherit" })

  test("`Server.compile()` bundles [*mizu.compile-entrypoint] scripts in place", async () => {
    const mizu = new Server({ context: { foo: "bar" } })
    const html = await mizu.compile(`<main *mizu.compile><div><p *text="foo"></p><script *mizu.compile-entrypoint>Mizu.hydrate({ context: { foo: "baz" } })</script></div></main>`, { select: "body" })
    const [before, script, after] = split(html)
    expect(before).toBe(`<body><main><div><p *text="foo"></p>`)
    expect(after).toBe(`</div></main></body>`)
    expect(script).toContain(`document.currentScript.parentElement.parentElement`)
    expect(script).toContain(`"baz"`)
    expect(script).not.toContain(`globalThis.Mizu`)
  }, { permissions: "inherit" })

  test("`Server.compile()` with `render` mode preserves the elements commented out by directives", async () => {
    const mizu = new Server({ context: { shown: false, items: ["a", "b"] } })
    const [before] = split(await mizu.compile(`<main *mizu.compile="render"><p *if="shown"></p><li *for="const item of items" *text="item"></li></main>`, { select: "main" }))
    expect(before).toBe(
      `<main><template data-mizu="[*if=&quot;shown&quot;]"><p *if="shown"></p></template><!--[/data-mizu]--><template data-mizu="[*for=&quot;const item of items&quot;]"><li *for="const item of items" *text="item"></li></template><li *text="item">a</li><li *text="item">b</li><!--[/data-mizu]-->`,
    )
  }, { permissions: "inherit" })

  test("`Server.compile()` (error) expects [*mizu.compile-entrypoint] to be within a compiled element", async () => {
    const warn = fn() as testing
    const mizu = new Server({ warn })
    const html = await mizu.compile(`<main><script *mizu.compile-entrypoint>Mizu.hydrate()</script></main>`, { select: "body" })
    expect(html).toBe(`<body><main><script>Mizu.hydrate()</script></main></body>`)
    expect(warn).toBeCalledTimes(1)
  }, { permissions: "inherit" })

  test("`Server.compile()` escapes sequences that would break out of the bundled script", async () => {
    const mizu = new Server({ context: { evil: `</script><!--<script>` } })
    const html = await mizu.compile(`<main *mizu.compile><p *text="evil"></p></main><p id="after"></p>`, { select: "body" })
    const [, script, after] = split(html)
    expect(script).not.toMatch(/<\/script/i)
    expect(script).not.toContain(`<!--`)
    expect(script).toContain(`<\\/script`)
    expect(script).toContain(`<\\x21--`)
    expect(after).toBe(`</main><p id="after"></p></body>`)
  }, { permissions: "inherit" })

  test("`Server.compile()` skips context values that cannot be serialized", async () => {
    const warn = fn() as testing
    const mizu = new Server({ warn, context: { foo: "bar", unsupported: new WeakMap() } })
    const [, script] = split(await mizu.compile(`<main *mizu.compile><p *text="foo"></p></main>`, { select: "main" }))
    expect(script).toContain(`"bar"`)
    expect(script).not.toContain(`unsupported`)
    expect(warn).toBeCalledTimes(1)
  }, { permissions: "inherit" })
}

test("`serialize()` serializes values into code", () => {
  expect(serialize({ a: [1, "b", null, undefined, true, 2n], d: new Date(0), r: /x/g, m: new Map([["k", 1]]), s: new Set([1]) })).toBe(`{ "a": [1, "b", null, undefined, true, 2n], "d": new Date(0), "r": /x/g, "m": new Map([["k", 1]]), "s": new Set([1]) }`)
  expect(serialize(Math.random)).toBe("Math.random")
  expect(serialize(Array.prototype.map)).toBe("Array.prototype.map")
  expect(serialize((a: number) => a + 1)).toMatch(/^\(\(?a\)?\s*=>\s*a\s*\+\s*1\)$/)
  expect(serialize({ greet() {} }.greet)).toMatch(/^\(function greet ?\(\)\s*\{\s*\}\)$/)
  expect(serialize("</script>")).toBe(`"\\u003c/script>"`)
  expect(() => serialize(Symbol())).toThrow(TypeError)
  expect(() => serialize(new WeakMap())).toThrow(TypeError)
  const circular = {} as Record<string, unknown>
  circular.self = circular
  expect(() => serialize(circular)).toThrow(TypeError)
})

/** Split a compiled output around its bundled script. */
function split(html: string) {
  const a = html.indexOf("<script>")
  const b = html.indexOf("</script>", a)
  return [html.slice(0, a), html.slice(a + "<script>".length, b), html.slice(b + "</script>".length)]
}
