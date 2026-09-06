import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { Server } from "./server.ts"
import { serialize } from "./compile.ts"

// Compilation requires `Deno.bundle()`
if (typeof (globalThis as { Deno?: { bundle?: unknown } }).Deno?.bundle === "function") {
  test("`Server.render()` leaves compiled elements untouched", async () => {
    const mizu = new Server({ context: { foo: "bar" } })
    await expect(mizu.render(`<main *mizu.compile><p *text="foo"></p></main><p *text="foo"></p>`, { select: "body" })).resolves.toBe(`<body><main *mizu.compile=""><p *text="foo"></p></main><p *text="foo">bar</p></body>`)
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
    const open = html.indexOf("<script>")
    const close = html.lastIndexOf("</script>")
    expect(html.slice(0, open)).toBe(`<body><main *mizu.compile=""><p *text="foo"></p><ul><template *for="items"><li *text="$value"></li></template></ul>`)
    expect(html.slice(close)).toBe(`</script></main><p *text="foo">bar</p></body>`)
    const script = html.slice(open + "<script>".length, close)
    expect(script).toContain(`"*text"`)
    expect(script).toContain(`"*for"`)
    expect(script).not.toContain(`"*html"`)
    expect(script).toContain(`Math.random`)
    expect(script).toContain(`hi ${"$"}{`)
    expect(script).not.toContain(`fragments`)
  }, { permissions: "inherit" })

  test("`Server.compile()` exports `Mizu.hydrate()` when an entrypoint script exists", async () => {
    const warn = fn() as testing
    const mizu = new Server({ warn })
    let html = await mizu.compile(`<main *mizu.compile="#entry"><p *text="'foo'"></p></main><script id="entry">Mizu.hydrate()</script>`, { select: "body" })
    expect(html).toContain(`fragments`)
    expect(warn).not.toBeCalled()
    html = await mizu.compile(`<main *mizu.compile="#missing"><p *text="'foo'"></p></main>`, { select: "body" })
    expect(html).not.toContain(`fragments`)
    expect(warn).toBeCalledTimes(1)
  }, { permissions: "inherit" })

  test("`Server.compile()` skips context values that cannot be serialized", async () => {
    const warn = fn() as testing
    const mizu = new Server({ warn, context: { foo: "bar", unsupported: new WeakMap() } })
    const html = await mizu.compile(`<main *mizu.compile><p *text="foo"></p></main>`, { select: "main" })
    expect(html).toContain(`"bar"`)
    expect(html).not.toContain(`unsupported`)
    expect(warn).toBeCalledTimes(1)
  }, { permissions: "inherit" })
}

test("`serialize()` serializes values into code", () => {
  expect(serialize({ a: [1, "b", null, undefined, true, 2n], d: new Date(0), r: /x/g, m: new Map([["k", 1]]), s: new Set([1]) })).toBe(`{ "a": [1, "b", null, undefined, true, 2n], "d": new Date(0), "r": /x/g, "m": new Map([["k", 1]]), "s": new Set([1]) }`)
  expect(serialize(Math.random)).toBe("Math.random")
  expect(serialize(Array.prototype.map)).toBe("Array.prototype.map")
  expect(serialize((a: number) => a + 1)).toMatch(/^\(\(?a\)? ?=> ?a ?\+ ?1\)$/)
  expect(serialize({ greet() {} }.greet)).toMatch(/^\(function greet ?\(\) ?\{\s*\}\)$/)
  expect(serialize("</script>")).toBe(`"\\u003c/script>"`)
  expect(() => serialize(Symbol())).toThrow(TypeError)
  expect(() => serialize(new WeakMap())).toThrow(TypeError)
  const circular = {} as Record<string, unknown>
  circular.self = circular
  expect(() => serialize(circular)).toThrow(TypeError)
})
