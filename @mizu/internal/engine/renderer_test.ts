import type { testing } from "@libs/testing"
import { expect, fn, test, TestingError } from "@libs/testing"
import { retry } from "@std/async"
import { Window } from "../vdom/mod.ts"
import { Context, type Directive, Phase, Renderer } from "./renderer.ts"
import _mizu from "@mizu/mizu"
import _test, { PHASE_TESTING_DELTA } from "@mizu/test"
const options = { directives: [_mizu] }

test("`Renderer.constructor()` instantiates a new `Renderer`", async () => {
  await using window = new Window()
  const renderer = new Renderer(window, options)
  expect(renderer.ready).toBeInstanceOf(Promise)
  expect(renderer.window).toBeDefined()
  expect(renderer.document).toBeDefined()
  await expect(renderer.ready).resolves.toBeInstanceOf(Renderer)
})

test("`Renderer.ready` resolves once instance is ready", async () => {
  await using window = new Window()
  const directive = { name: "*foo", init: fn(), phase: Phase.TESTING }
  const renderer = new Renderer(window, { ...options, directives: [directive, { name: "*bar", phase: Phase.TESTING }] as testing })
  expect(renderer.ready).toBeInstanceOf(Promise)
  await expect(renderer.ready).resolves.toBeInstanceOf(Renderer)
  expect(directive.init).toBeCalledWith(renderer)
})

test("`Renderer.cache()` manages cache registries", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  expect(renderer.cache("*foo")).toBeNull()
  expect(renderer.cache("*foo", new WeakMap())).toBeInstanceOf(WeakMap)
  expect(renderer.cache("*foo")).toBeInstanceOf(WeakMap)
})

test('`Renderer.cache("*")` returns an already instantiated `WeakMap` instance', async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  expect(renderer.cache("*")).toBeInstanceOf(WeakMap)
})

test("`Renderer.load()` loads, initializes and sorts directives", async () => {
  await using window = new Window()
  const directives = [{
    name: "*bar",
    phase: 2,
    init: fn() as testing,
  }, {
    name: "*foo",
    phase: 1,
  }]
  const renderer = await new Renderer(window, { ...options, directives: [] }).ready
  await expect(renderer.load(directives)).resolves.toBe(renderer)
  expect(renderer.directives).toHaveLength(directives.length)
  expect(renderer.directives).toMatchObject(directives.reverse())
  expect(directives.find((directive) => directive?.init)?.init).toBeCalledWith(renderer)
})

test("`Renderer.load()` resolves and loads dynamically directives with `import()`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, { ...options, directives: [] }).ready
  await expect(renderer.load("@mizu/test")).resolves.toBe(renderer)
  expect(renderer.directives).toHaveLength(_test.length)
  expect(renderer.directives).toMatchObject(_test as testing)
})

test("`Renderer.load()` ignores directives with `Phase.META`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, { ...options, directives: [] }).ready
  await expect(renderer.load({ name: "*foo", phase: Phase.META })).resolves.not.toThrow()
  expect(renderer.directives).toHaveLength(0)
})

test("`Renderer.load()` ignores invalid directives", async () => {
  await using window = new Window()
  const directive = {
    name: "*foo",
    phase: Phase.TESTING,
    init: fn(() => {
      throw new TestingError("Expected error")
    }) as testing,
  }
  const renderer = await new Renderer(window, { ...options, directives: [] }).ready
  await expect(renderer.load(directive)).rejects.toThrow(TestingError, "Expected error")
  expect(directive.init).toBeCalledWith(renderer)
  expect(renderer.directives).toHaveLength(0)
  await expect(renderer.load({ name: "", phase: Phase.TESTING, execute() {} })).rejects.toThrow(SyntaxError, "Malformed directive")
  expect(renderer.directives).toHaveLength(0)
  await expect(renderer.load({ name: "*foo", phase: Phase.UNKNOWN, execute() {} })).rejects.toThrow(SyntaxError, "Malformed directive")
  expect(renderer.directives).toHaveLength(0)
})

test("`Renderer.load()` ignores duplicates or already loaded directives", async () => {
  await using window = new Window()
  const warn = fn() as testing
  const directive = {
    name: "*foo",
    phase: Phase.TESTING,
  }
  const renderer = await new Renderer(window, { ...options, warn, directives: [] }).ready
  await renderer.load([directive, directive])
  await renderer.load([directive])
  await renderer.load(directive)
  expect(renderer.directives).toHaveLength(1)
  expect(renderer.directives).toMatchObject([directive])
  expect(warn).toBeCalledWith("Directive [*foo] is already loaded, skipping")
})

test("`Renderer.internal()` returns internal identifiers", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  expect(renderer.internal()).toBe("__mizu_internal")
  expect(renderer.internal("foo")).toBe("__mizu_internal_foo")
})

test("`Renderer.evaluate()` evaluates expressions", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  await expect(renderer.evaluate(null, "1+1")).resolves.toBe(2)
  await expect(renderer.evaluate(null, "true")).resolves.toBe(true)
  await expect(renderer.evaluate(null, "['foo','bar']")).resolves.toEqual(["foo", "bar"])
  await expect(renderer.evaluate(null, "{foo:'bar'}")).resolves.toEqual({ foo: "bar" })
})

test("`Renderer.evaluate()` evaluates expressions with variables", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  await expect(renderer.evaluate(null, "foo", { context: new Context({ foo: true }) })).resolves.toBe(true)
  await expect(renderer.evaluate(null, "$foo", { state: { $foo: true } })).resolves.toBe(true)
  await expect(renderer.evaluate(null, "foo", { context: new Context({ foo: true }), state: { $foo: false } })).resolves.toBe(true)
  await expect(renderer.evaluate(null, "$foo", { context: new Context({ foo: true }), state: { $foo: false } })).resolves.toBe(false)
  await expect(renderer.evaluate(null, "foo")).rejects.toThrow(ReferenceError)
})

test("`Renderer.evaluate()` evaluates expressions with callables", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const foo = fn(() => true)
  await expect(renderer.evaluate(null, "foo", { context: new Context({ foo }) })).resolves.toBeInstanceOf(Function)
  expect(foo).not.toBeCalled()
  await expect(renderer.evaluate(null, "foo", { context: new Context({ foo }), args: [true] })).resolves.toBe(true)
  expect(foo).toBeCalledWith(true)
})

test("`Renderer.evaluate()` rejects if the `Renderer.internal` identifier is used", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  await expect(renderer.evaluate(null, "null", { context: new Context({ [renderer.internal()]: true }) })).rejects.toThrow(TypeError)
})

test("`Renderer.render()` requires `*mizu` attribute when `implicit: false`", async () => {
  await using window = new Window()
  const directive = { name: "*foo", execute: fn(), phase: Phase.TESTING }
  const renderer = await new Renderer(window, { ...options, directives: [directive] as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "" } }), { implicit: false })).not.resolves.toThrow()
  expect(directive.execute).not.toBeCalled()
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", [_mizu.name]: "" } }), { implicit: false })).not.resolves.toThrow()
  expect(directive.execute).toBeCalledTimes(1)
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "" }, innerHTML: `<a *foo ${_mizu.name}><b ${_mizu.name}></b></a>` }), { implicit: false })).not.resolves.toThrow()
  expect(directive.execute).toBeCalledTimes(2)
})

test("`Renderer.render()` returns selected element with `select` option", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const element = renderer.createElement("div", { innerHTML: "<span>foo</span>" })
  await expect(renderer.render(element, { select: "span" })).resolves.toHaveProperty("tagName", "SPAN")
  await expect(renderer.render(element, { select: "unknown" })).resolves.toBeNull()
})

test("`Renderer.render()` returns stringified result when `stringify: true`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const element = renderer.createElement("div", { innerHTML: "<span>foo</span>" })
  await expect(renderer.render(element, { select: "unknown", stringify: true })).resolves.toBe("")
  await expect(renderer.render(element, { select: "span", stringify: true })).resolves.toBe("<span>foo</span>")
  await expect(renderer.render(element, { stringify: true })).resolves.toBe("<!DOCTYPE html><div><span>foo</span></div>")
})

test("`Renderer.render()` throws on `Error` when `throw: true`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, { ...options, directives: [_test] }).ready
  const element = renderer.createElement("div", { innerHTML: "<span ~test.throw>foo</span>" })
  await expect(renderer.render(element, { throw: true })).rejects.toThrow(AggregateError)
})

test("`Renderer.#render() // 1` ignores non-element nodes unless they were processed before and put into cache", async () => {
  await using window = new Window()
  const directive = { name: "*foo", setup: fn(), phase: Phase.TESTING }
  const renderer = await new Renderer(window, { ...options, directives: [directive] as testing }).ready
  await expect(renderer.render(renderer.document.createComment("comment") as testing)).not.resolves.toThrow()
  expect(directive.setup).not.toBeCalled()
  await expect(renderer.render(renderer.comment(renderer.createElement("div"), { directive: "", expression: "" }) as testing)).not.resolves.toThrow()
  expect(directive.setup).toBeCalled()
})

test("`Renderer.#render() // 2` calls `directive.setup()`", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", setup: fn(), phase: Phase.TESTING }, { name: "*bar", setup: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "" } }))).not.resolves.toThrow()
  expect(directives[0].setup).toBeCalled()
  expect(directives[1].setup).toBeCalled()
})

test("`Renderer.#render() // 2.1` ends the process if `false` is returned", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", setup: fn(() => false), execute: fn(), phase: Phase.TESTING }, { name: "*bar", execute: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }))).not.resolves.toThrow()
  expect(directives[0].setup).toBeCalled()
  expect(directives[0].setup).toReturnWith(false)
  expect(directives[0].execute).not.toBeCalled()
  expect(directives[1].execute).not.toBeCalled()
})

test("`Renderer.#render() // 2.1` updates `state` if it is returned", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", setup: fn(() => ({ state: { $bar: true } })), execute: fn((_: unknown, __: unknown, { state }: testing) => state), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }), { state: { $foo: true } })).not.resolves.toThrow()
  expect(directives[0].setup).toBeCalled()
  expect(directives[0].execute).toBeCalled()
  expect((directives[0].execute as testing)[Symbol.for("@MOCK")].calls[0].args[2].state).toMatchObject({ $foo: true, $bar: true })
})

test("`Renderer.#render() // 2.1` ", async () => {
  await using window = new Window()
  const directives = [
    { name: "*execute:none+present", setup: fn(() => ({})), execute: fn(), phase: Phase.TESTING },
    { name: "*execute:none+absent", setup: fn(() => ({})), execute: fn(), phase: Phase.TESTING },
    { name: "*execute:false", setup: fn(() => ({ execute: false })), execute: fn(), phase: Phase.TESTING },
    { name: "*execute:true", setup: fn(() => ({ execute: true })), execute: fn(), phase: Phase.TESTING },
  ]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*execute:none+present": "", "*execute:false": "" } }))).not.resolves.toThrow()
  expect(directives[0].setup).toBeCalled()
  expect(directives[0].execute).toBeCalled()
  expect(directives[1].setup).toBeCalled()
  expect(directives[1].execute).not.toBeCalled()
  expect(directives[2].setup).toBeCalled()
  expect(directives[2].execute).not.toBeCalled()
  expect(directives[3].setup).toBeCalled()
  expect(directives[3].execute).toBeCalled()
})

test("`Renderer.#render() // 3` retrieves `HTMLElement` from `Comment` if applicable", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", execute: fn((_: unknown, element: unknown) => element), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  const element = renderer.createElement("div", { attributes: { "*foo": "" } })
  await expect(renderer.render(element)).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalled()
  expect(directives[0].execute).toHaveReturnedWith(element)
  const comment = renderer.comment(element, { directive: "*foo", expression: "" })
  await expect(renderer.render(comment as testing)).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalled()
  expect(directives[0].execute).toHaveReturnedWith(element)
})

test("`Renderer.#render() // 4.1` calls `directive.execute()` if node is elligible", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", execute: fn(), phase: Phase.TESTING }, { name: "*bar", execute: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*bar": "" } }))).not.resolves.toThrow()
  expect(directives[0].execute).not.toBeCalled()
  expect(directives[1].execute).toBeCalledTimes(1)
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*bar.foo": "" } }))).not.resolves.toThrow()
  expect(directives[0].execute).not.toBeCalled()
  expect(directives[1].execute).toBeCalledTimes(2)
})

test("`Renderer.#render() // 4.2` warns on conflicting directives", async () => {
  await using window = new Window()
  const warn = fn() as testing
  const directives = [{ name: "*foo", phase: Phase.CONTENT }, { name: "*bar", phase: Phase.CONTENT }]
  const renderer = await new Renderer(window, { ...options, warn, directives: directives as testing }).ready
  Object.assign(renderer, { warn })
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }))).not.resolves.toThrow()
  expect(warn).toBeCalledWith("Using [*bar] and [*foo] directives together might result in unexpected behaviour", expect.anything())
})

test("`Renderer.#render() // 4.2` warns on duplicates directives", async () => {
  await using window = new Window()
  const warn = fn() as testing
  const renderer = await new Renderer(window, { ...options, warn, directives: [{ name: "*foo", phase: Phase.TESTING }] as testing }).ready
  Object.assign(renderer, { warn })
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo[1]": "", "*foo[2]": "" } }))).not.resolves.toThrow()
  expect(warn).toBeCalledWith("Using multiple [*foo] directives might result in unexpected behaviour", expect.anything())
})

test("`Renderer.#render() // 4.3` updates node when a new `element` is returned", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", execute: fn((renderer: Renderer, element: HTMLElement) => ({ element: renderer.comment(element, { directive: "", expression: "" }) })), phase: Phase.TESTING }, { name: "*bar", execute: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }))).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalledTimes(1)
  expect((directives[0].execute as testing)[Symbol.for("@MOCK")].calls[0].args[1].nodeType).toBe(renderer.window.Node.ELEMENT_NODE)
  expect(directives[1].execute).toBeCalledTimes(1)
  expect((directives[1].execute as testing)[Symbol.for("@MOCK")].calls[0].args[1].nodeType).toBe(renderer.window.Node.COMMENT_NODE)
})

test("`Renderer.#render() // 4.3` ends the process if `final: true` is returned", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", execute: fn(() => ({ final: true })), phase: Phase.TESTING }, { name: "*bar", execute: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }))).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalled()
  expect(directives[0].execute).toHaveReturnedWith({ final: true })
  expect(directives[1].execute).not.toBeCalled()
})

test("`Renderer.#render() // 4.3` updates `state` or `context` if one of them is returned", async () => {
  await using window = new Window()
  const directives = [
    { name: "*foo", execute: fn((_: unknown, __: unknown) => ({ state: { $bar: true } })), phase: Phase.TESTING },
    { name: "*bar", execute: fn((_: unknown, __: unknown) => ({ context: { $bar: true } })), phase: Phase.TESTING },
  ]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "", "*bar": "" } }), { state: { $foo: true } })).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalled()
  expect(directives[1].execute).toBeCalled()
  expect((directives[1].execute as testing)[Symbol.for("@MOCK")].calls[0].args[2].state).toMatchObject({ $foo: true, $bar: true })
})

test("`Renderer.render() // 5` recurses on child nodes", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", execute: fn(), phase: Phase.TESTING }, { name: "*bar", execute: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  const a = renderer.createElement("div", { attributes: { "*foo": "" } })
  const b = renderer.createElement("div", { attributes: { "*bar": "" } })
  a.appendChild(b)
  await expect(renderer.render(a)).not.resolves.toThrow()
  expect(directives[0].execute).toBeCalledTimes(1)
  expect(directives[0].execute).toBeCalledWith(renderer, a, expect.anything())
  expect(directives[1].execute).toBeCalledTimes(1)
  expect(directives[1].execute).toBeCalledWith(renderer, b, expect.anything())
})

test("`Renderer.#render() // 6` calls `directive.cleanup()`", async () => {
  await using window = new Window()
  const directives = [{ name: "*foo", cleanup: fn(), phase: Phase.TESTING }, { name: "*bar", cleanup: fn(), phase: Phase.TESTING }]
  const renderer = await new Renderer(window, { ...options, directives: directives as testing }).ready
  await expect(renderer.render(renderer.createElement("div", { attributes: { "*foo": "" } }))).not.resolves.toThrow()
  expect(directives[0].cleanup).toBeCalled()
  expect(directives[1].cleanup).toBeCalled()
})

test("`Renderer.render() // R` reacts to properties changes using the closest possible subtree and context", async () => {
  await using window = new Window()
  const context = new Context({ foo: "bar", fn: { a: fn(), b: fn(), c: fn() } })
  const renderer = new Renderer(window, { ...options, directives: [_test] })
  const a = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.a()" } })
  const b = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.b()", "~test.text": "foo" } })
  const c = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.c()", "~test.text": "1 + 1" } })
  renderer.document.body.appendChild(a)
  a.appendChild(b)
  a.appendChild(c)
  await renderer.render(a, { context, reactive: true })
  expect(b.textContent).toBe("bar")
  expect(c.textContent).toBe("2")
  expect(context.target.fn.a).toBeCalledTimes(1)
  expect(context.target.fn.b).toBeCalledTimes(1)
  expect(context.target.fn.c).toBeCalledTimes(1)
  context.target.foo = "baz"
  await retry(() => {
    expect(b.textContent).toBe("baz")
    expect(c.textContent).toBe("2")
  })
  expect(context.target.fn.a).toBeCalledTimes(1)
  expect(context.target.fn.b).toBeCalledTimes(2)
  expect(context.target.fn.c).toBeCalledTimes(1)
})

test("`Renderer.render() // R` reacts to properties changes and avoid queuing multiple renderings of the same subtrees", async () => {
  await using window = new Window()
  const context = new Context({ a: false, b: false, c: false, fn: { a: fn(), b: fn(), c: fn() } })
  const renderer = new Renderer(window, { ...options, directives: [_test] })
  const a = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.a()", "~test[content].eval": "a" } })
  const b = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.b()", "~test[content].eval": "b" } })
  const c = renderer.createElement("div", { attributes: { "~test[testing].eval": "fn.c()", "~test[content].eval": "c" } })
  renderer.document.body.appendChild(a)
  a.appendChild(b)
  b.appendChild(c)
  await renderer.render(a, { context, reactive: true })
  expect(context.target.fn.a).toBeCalledTimes(1)
  expect(context.target.fn.b).toBeCalledTimes(1)
  expect(context.target.fn.c).toBeCalledTimes(1)
  context.target.b = true
  context.target.c = true
  context.target.a = true
  await retry(() => {
    expect(context.target.fn.a).toBeCalledTimes(2)
    expect(context.target.fn.b).toBeCalledTimes(2)
    expect(context.target.fn.c).toBeCalledTimes(2)
  })
})

test("`Renderer.render() // R` reacts to properties changes and continue to track changes after elements morphing", async () => {
  await using window = new Window()
  const context = new Context({ foo: "bar", comment: true })
  const renderer = new Renderer(window, { ...options, directives: [_test] })
  const element = renderer.createElement("div", { innerHTML: `<div ~test[postprocessing].comment="comment" ~test[preprocessing]="foo"></div>` })
  renderer.document.body.appendChild(element)
  await renderer.render(element, { context, reactive: true })
  expect(element.childNodes[0].nodeType).toBe(renderer.window.Node.COMMENT_NODE)
  context.target.comment = false
  await retry(() => {
    expect(element.childNodes[0].nodeType).not.toBe(renderer.window.Node.COMMENT_NODE)
  })
})

test("`Renderer.render() // R` reacts to properties changes and continue to track changes after context changes", async () => {
  await using window = new Window()
  const context = new Context({ foo: "bar", comment: true })
  let override = null as testing
  const directive = {
    name: "*foo",
    phase: Phase.TESTING,
    execute: (_, __, { context }) => {
      if (!override) {
        override = context.with({ bar: "baz" })
        return { context: override }
      }
    },
  } as Directive
  const renderer = new Renderer(window, { ...options, directives: [_test, directive] })
  const element = renderer.createElement("div", { attributes: { "*foo": "", "~test[preprocessing].eval": "foo", "~test[content].text": "foo + bar" } })
  renderer.document.body.appendChild(element)
  await renderer.render(element, { context, reactive: true })
  expect(element.textContent).toBe("barbaz")
  override.target.bar = "qux"
  await retry(() => {
    expect(element.textContent).toBe("barqux")
  })
})

test("`Renderer.flushReactiveRenderQueue()` flushes queued reactive render requests", async () => {
  await using window = new Window()
  const context = new Context({ foo: "bar" })
  const renderer = new Renderer(window, { ...options, directives: [_test] })
  const element = renderer.createElement("div", { attributes: { "~test.text": "foo" } })
  renderer.document.body.appendChild(element)
  await renderer.render(element, { context, reactive: true })
  expect(element.textContent).toBe("bar")
  for (let i = 0; i < 10; i++) {
    context.target.foo = `${i}`
  }
  context.target.foo = "baz"
  await renderer.flushReactiveRenderQueue()
  expect(element.textContent).toBe("baz")
})

test("`Renderer.createElement()` creates a `new HTMLElement()`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  expect(renderer.createElement("input")).toHaveProperty("tagName", "INPUT")
  expect(renderer.createElement("input", { value: "foo" })).toHaveProperty("value", "foo")
  expect(renderer.createElement("input", { attributes: { foo: "bar" } }).getAttribute("foo")).toBe("bar")
})

test("`Renderer.replaceElementWithChildNodes()` replaces an `HTMLElement` with another `HTMLElement.childNodes`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  renderer.document.body.innerHTML = "<span><slot></slot></span>"
  const div = renderer.createElement("div", { innerHTML: "<p>foo</p>" })
  const span = renderer.document.querySelector("span")!
  const slot = span.querySelector("slot")!
  renderer.replaceElementWithChildNodes(slot, div)
  expect(span.innerHTML).toBe(div.innerHTML)
})

test("`Renderer.comment()` replaces an `HTMLElement` by a `new Comment()`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div")
  renderer.document.body.appendChild(div)
  expect(renderer.document.body.innerHTML).toBe(div.outerHTML)
  const comment = renderer.comment(div, { directive: "*foo", expression: "bar" })
  expect(comment.nodeType).toBe(renderer.window.Node.COMMENT_NODE)
  expect(comment.nodeValue).toBe(`[*foo="bar"]`)
  expect(renderer.document.body.innerHTML).toBe(`<!--[*foo="bar"]-->`)
})

test("`Renderer.uncomment()` restores an `HTMLElement` that was replaced by a `Comment`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div")
  renderer.document.body.appendChild(div)
  expect(renderer.document.body.innerHTML).toBe(div.outerHTML)
  const comment = renderer.comment(div, { directive: "*foo", expression: "bar" })
  expect(renderer.document.body.innerHTML).toBe(`<!--[*foo="bar"]-->`)
  expect(renderer.uncomment(comment)).toBe(div)
  expect(renderer.document.body.innerHTML).toBe(div.outerHTML)
})

test("`Renderer.uncomment()` throws a `new ReferenceError()` when passing an uncached `Comment`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const comment = renderer.document.createComment("")
  expect(renderer.cache("*").has(comment)).toBe(false)
  expect(() => renderer.uncomment(comment)).toThrow(ReferenceError)
})

test("`Renderer.getComment()` returns the `Comment` associated with a specified `HTMLElement`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div")
  renderer.document.body.appendChild(div)
  expect(renderer.getComment(div)).toBeNull()
  const comment = renderer.comment(div, { directive: "*foo", expression: "bar" })
  expect(renderer.getComment(div)).toBe(comment)
  renderer.uncomment(comment)
  expect(renderer.getComment(div)).toBeNull()
})

test("`Renderer.createNamedNodeMap()` creates a `new NamedNodeMap()`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const nodemap = renderer.createNamedNodeMap()
  expect(nodemap.constructor.name).toMatch(/NamedNodeMap/)
})

test("`Renderer.createAttribute()` creates a `new Attr()`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const a = renderer.createAttribute("foo", "bar")
  expect(a.constructor.name).toBe("Attr")
  expect(a.name).toBe("foo")
  expect(a.value).toBe("bar")
  const b = renderer.createAttribute("*foo", "bar")
  expect(b.constructor.name).toBe("Attr")
  expect(b.name).toBe("*foo")
  expect(b.value).toBe("bar")
})

test("`Renderer.setAttribute()` updates `HTMLElement.attributes`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div")
  expect(div.hasAttribute("foo")).toBe(false)
  renderer.setAttribute(div, "foo", "bar")
  expect(div.getAttribute("foo")).toBe("bar")
  renderer.setAttribute(div, "foo", "baz")
  expect(div.getAttribute("foo")).toBe("baz")
})

test("`Renderer.setAttribute()` updates `Comment.nodeValue`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const comment = renderer.comment(renderer.createElement("div"), { directive: "*foo", expression: "bar" })
  expect(comment.nodeValue).toBe(`[*foo="bar"]`)
  renderer.setAttribute(comment, "baz", "qux")
  expect(comment.nodeValue).toBe(`[*foo="bar"] [baz="qux"]`)
})

test("`Renderer.getAttributes()` returns matching `HTMLElement.attributes` after directive syntax parsing", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div", { attributes: { "*foo.bar": "true", "*foo.baz": "false" } })
  expect(renderer.getAttributes(div, "*foo")).toHaveLength(2)
  expect(renderer.getAttributes(div, "*foo", { first: true })).not.toBeNull()
  expect(renderer.getAttributes(div, /^\*/)).toHaveLength(2)
  expect(renderer.getAttributes(div, /^\*/, { first: true })).not.toBeNull()
  const comment = renderer.comment(div, { directive: "", expression: "" })
  expect(renderer.getAttributes(comment as testing, "*foo")).toHaveLength(0)
  expect(renderer.getAttributes(comment as testing, "*foo", { first: true })).toBeNull()
  expect(renderer.getAttributes(comment as testing, /^\*/)).toHaveLength(0)
  expect(renderer.getAttributes(comment as testing, /^\*/, { first: true })).toBeNull()
})

for (
  const [name, tested, expected, typings = {}, extras = {}] of [
    ["names", `*foo="bar"`, { value: "bar", name: "*foo" }],
    ["with escaped name", `*{foo.bar}="foobar"`, { value: "foobar", name: "*foo.bar" }],
    ["tags", `*foo[baz]="bar"`, { value: "bar", name: "*foo", tag: "baz" }],
    ["with escaped name and with tags", `*{foo.bar}[baz]="foobar"`, { value: "foobar", name: "*foo.bar", tag: "baz" }],
    ["without modifiers", `*foo="bar"`, { value: "bar", modifiers: { a: undefined } }, { modifiers: { a: { type: Boolean } } }, { modifiers: true }],
    ["modifiers with optional values", `*foo.a="bar"`, { value: "bar", modifiers: { a: true } }, { modifiers: { a: { type: Boolean } } }, { modifiers: true }],
    ["modifiers with default values", `*foo.a="bar"`, { value: "bar", modifiers: { a: false } }, { modifiers: { a: { type: Boolean, default: false } } }, { modifiers: true }],
    ["modifiers with enforced values", `*foo="bar"`, { value: "bar", modifiers: { a: true } }, { modifiers: { a: { type: Boolean, enforce: true } } }, { modifiers: true }],
    ["modifiers with enforced values and defaults", `*foo="bar"`, { value: "bar", modifiers: { a: false } }, { modifiers: { a: { type: Boolean, default: false, enforce: true } } }, { modifiers: true }],
    ["modifiers values", `*foo.a[false]="bar"`, { value: "bar", modifiers: { a: false } }, { modifiers: { a: { type: Boolean } } }, { modifiers: true }],
    ["modifiers values and fallbacks on empty values", `*foo.a[]="bar"`, { value: "bar", modifiers: { a: true } }, { modifiers: { a: { type: Boolean } } }, { modifiers: true }],
    ["modifiers values and fallbacks invalid values", `*foo.a[garbage]="bar"`, { value: "bar", modifiers: { a: true } }, { modifiers: { a: { type: Boolean } } }, { modifiers: true }],
  ] as const
) {
  test(`\`Renderer.parseAttributes()\` parses attributes ${name}`, async () => {
    await using window = new Window()
    const renderer = await new Renderer(window, options).ready
    const div = renderer.createElement("div", { innerHTML: `<div ${tested}></div>` }).querySelector("div")!
    const attribute = div.attributes[0]
    expect(renderer.parseAttribute(attribute, typings, extras as testing)).toMatchObject(expected)
  })
}

test("`Renderer.parseAttributes()` parses attributes with `prefix` option", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const div = renderer.createElement("div", { innerHTML: `<div *foo="bar"></div>` }).querySelector("div")!
  const attribute = div.attributes[0]
  expect(renderer.parseAttribute(attribute, {}, { prefix: "" }).name).toBe("*foo")
  expect(renderer.parseAttribute(attribute, {}, { prefix: "*" }).name).toBe("foo")
})

for (
  const [name, tested, expected, typings] of [
    ['with `"true"` values as `true`', `*foo="true"`, { value: true }, { type: Boolean }],
    ['with `"yes"` values as `true`', `*foo="yes"`, { value: true }, { type: Boolean }],
    ['with `"on"` values as `true`', `*foo="on"`, { value: true }, { type: Boolean }],
    ['with `"false"` values as `false`', `*foo="false"`, { value: false }, { type: Boolean }],
    ['with `"no"` values as `false`', `*foo="no"`, { value: false }, { type: Boolean }],
    ['with `"off"` values as `false`', `*foo="off"`, { value: false }, { type: Boolean }],
    ["with specified value and defaults", `*foo="false"`, { value: false }, { type: Boolean, default: true }],
    ["and defaults to `true`", `*foo`, { value: true }, { type: Boolean }],
    ["and defaults to configured `default`", `*foo`, { value: false }, { type: Boolean, default: false }],
    ["and fallbacks to `true` on invalid values", `*foo="bar"`, { value: true }, { type: Boolean }],
    ["and fallbacks to `default` on invalid values", `*foo="bar"`, { value: false }, { type: Boolean, default: false }],
  ] as const
) {
  test(`\`Renderer.parseAttributes()\` parses booleans ${name}`, async () => {
    await using window = new Window()
    const renderer = await new Renderer(window, options).ready
    const div = renderer.createElement("div", { innerHTML: `<div ${tested}></div>` }).querySelector("div")!
    const attribute = div.attributes[0]
    expect(renderer.parseAttribute(attribute, typings)).toMatchObject(expected)
  })
}

for (
  const [name, tested, expected, typings] of [
    ["", `*foo="1"`, { value: 1 }, { type: Number }],
    ["with negative values", `*foo="-1"`, { value: -1 }, { type: Number }],
    ["with decimal values", `*foo=".5"`, { value: .5 }, { type: Number }],
    ["with negative decimal values", `*foo="-.5"`, { value: -.5 }, { type: Number }],
    ["with specified value and defaults", `*foo="2"`, { value: 2 }, { type: Number, default: 1 }],
    ["and defaults to `0`", `*foo`, { value: 0 }, { type: Number }],
    ["and defaults to configured `default`", `*foo`, { value: 1 }, { type: Number, default: 1 }],
    ["and rounds values when `integer: true`", `*foo="1"`, { value: 1 }, { type: Number, integer: true }],
    ["and rounds negative values when `integer: true`", `*foo="-1"`, { value: -1 }, { type: Number, integer: true }],
    ["and rounds decimal values when `integer: true`", `*foo=".5"`, { value: 1 }, { type: Number, integer: true }],
    ["and rounds negative decimal values when `integer: true`", `*foo="-.5"`, { value: -0 }, { type: Number, integer: true }],
    ["and validates that values are greater than `min`", `*foo="-2"`, { value: -2 }, { type: Number, min: -3 }],
    ["and sets values to `min` value when they are lower than `min`", `*foo="-2"`, { value: -1 }, { type: Number, min: -1 }],
    ["and validates that values are lower than `max`", `*foo="2"`, { value: 2 }, { type: Number, max: 3 }],
    ["and sets values to `max` when they are greater than `max`", `*foo="2"`, { value: 1 }, { type: Number, max: 1 }],
    ["and fallbacks to `0` on invalid values", `*foo="bar"`, { value: 0 }, { type: Number }],
    ["and fallbacks to `default` on invalid values", `*foo="bar"`, { value: 1 }, { type: Number, default: 1 }],
    ["and fallbacks on `-Infinity`", `*foo="-Infinity"`, { value: 0 }, { type: Number }],
    ["and fallbacks on `Infinity`", `*foo="+Infinity"`, { value: 0 }, { type: Number }],
    ["and fallbacks on `NaN`", `*foo="NaN"`, { value: 0 }, { type: Number }],
  ] as const
) {
  test(`\`Renderer.parseAttributes()\` parses numbers ${name}`, async () => {
    await using window = new Window()
    const renderer = await new Renderer(window, options).ready
    const div = renderer.createElement("div", { innerHTML: `<div ${tested}></div>` }).querySelector("div")!
    const attribute = div.attributes[0]
    expect(renderer.parseAttribute(attribute, typings)).toMatchObject(expected)
  })
}

for (
  const [name, tested, expected, typings] of [
    ["", `*foo="1"`, { value: 1 }, { type: Date }],
    ['with `"ms"` unit', `*foo="1ms"`, { value: 1 }, { type: Date }],
    ['with `"s"` unit', `*foo="1s"`, { value: 1_000 }, { type: Date }],
    ['with `"m"` unit', `*foo="1m"`, { value: 60_000 }, { type: Date }],
    ["with specified values and defaults", `*foo="2"`, { value: 2 }, { type: Date, default: 1 }],
    ["and defaults to `0`", `*foo`, { value: 0 }, { type: Date }],
    ["and defaults to configured `default`", `*foo`, { value: 1 }, { type: Date, default: 1 }],
    ["and rounds values", `*foo=".9"`, { value: 1 }, { type: Date }],
    ['and rounds values with `"ms"` unit', `*foo=".9ms"`, { value: 1 }, { type: Date }],
    ['and rounds values with `"s"` unit', `*foo=".9s"`, { value: 900 }, { type: Date }],
    ['and rounds values with `"m"` unit', `*foo=".9m"`, { value: 54_000 }, { type: Date }],
    ["and fallbacks to `0` on negative values", `*foo="-1"`, { value: 0 }, { type: Date }],
    ["and fallbacks to `0` on invalid values", `*foo="bar"`, { value: 0 }, { type: Date }],
    ["and fallbacks to `default` on invalid values", `*foo="bar"`, { value: 1 }, { type: Date, default: 1 }],
    ["and fallbacks on invalid units", `*foo="1xx"`, { value: 0 }, { type: Date }],
    ["and fallbacks on negative values", `*foo="-1"`, { value: 0 }, { type: Date }],
    ["and fallbacks on `Infinity`", `*foo="Infinity"`, { value: 0 }, { type: Date }],
  ] as const
) {
  test(`\`Renderer.parseAttributes()\` parses durations ${name}`, async () => {
    await using window = new Window()
    const renderer = await new Renderer(window, options).ready
    const div = renderer.createElement("div", { innerHTML: `<div ${tested}></div>` }).querySelector("div")!
    const attribute = div.attributes[0]
    expect(renderer.parseAttribute(attribute, typings)).toMatchObject(expected)
  })
}

for (
  const [name, tested, expected, typings = {}] of [
    ["", `*foo="bar"`, { value: "bar" }],
    ["with boolean-like truthy values", `*foo="true"`, { value: "true" }],
    ["with boolean-like falsy values", `*foo="false"`, { value: "false" }],
    ["with number-like integer values", `*foo="1"`, { value: "1" }],
    ["with number-like decimal values", `*foo=".5"`, { value: ".5" }],
    ["with duration-like values", `*foo="1ms"`, { value: "1ms" }],
    ["with duration-like decimal values", `*foo=".5ms"`, { value: ".5ms" }],
    ["with specified values and defaults", `*foo="bar"`, { value: "bar" }, { default: "baz" }],
    ['and defaults to `""`', `*foo`, { value: "" }],
    ["and defaults to configured `default`", `*foo`, { value: "bar" }, { default: "bar" }],
    ["and validates values are in `allowed` values", `*foo="baz"`, { value: "baz" }, { type: String, allowed: ["bar", "baz"] }],
    ["and validates values are in `allowed` values with specified defaults", `*foo="baz"`, { value: "baz" }, { type: String, allowed: ["bar", "baz"], default: "bar" }],
    ["and defaults to value `allowed` first value`", `*foo`, { value: "bar" }, { type: String, allowed: ["bar", "baz"] }],
    ["and defaults to value `allowed` configured `default`", `*foo`, { value: "baz" }, { type: String, allowed: ["bar", "baz"], default: "baz" }],
    ["and fallbacks to `allowed` first value on invalid values", `*foo="qux"`, { value: "bar" }, { type: String, allowed: ["bar", "baz"] }],
    ["and fallbacks to `allowed` configured `default` on invalid values", `*foo="qux"`, { value: "baz" }, { type: String, allowed: ["bar", "baz"], default: "baz" }],
  ] as const
) {
  test(`\`Renderer.parseAttributes()\` parses strings ${name}`, async () => {
    await using window = new Window()
    const renderer = await new Renderer(window, options).ready
    const div = renderer.createElement("div", { innerHTML: `<div ${tested}></div>` }).querySelector("div")!
    const attribute = div.attributes[0]
    expect(renderer.parseAttribute(attribute, typings)).toMatchObject(expected)
  })
}

test("`Renderer.elementHasPhase()` tests if an element has a directive with specified phase", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, { ...options, directives: [_test] }).ready
  const div = renderer.createElement("div", { attributes: { "~test": "" } })
  expect(renderer.elementHasPhase(div, Phase.TESTING - PHASE_TESTING_DELTA)).toBe(true)
  expect(renderer.elementHasPhase(div, Phase.META)).toBe(false)
})

test("`Renderer.isHtmlElement()` checks if the given node is an `HTMLElement`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const element = renderer.createElement("div")
  const comment = renderer.document.createComment("")
  expect(renderer.isHtmlElement(element)).toBe(true)
  expect(renderer.isHtmlElement(comment)).toBe(false)
})

test("`Renderer.isComment()` checks if the given node is a `Comment`", async () => {
  await using window = new Window()
  const renderer = await new Renderer(window, options).ready
  const element = renderer.createElement("div")
  const comment = renderer.document.createComment("")
  expect(renderer.isComment(element)).toBe(false)
  expect(renderer.isComment(comment)).toBe(true)
})

test("`Renderer.warn()` calls the `warn()` callback", async () => {
  await using window = new Window()
  const warn = fn() as testing
  const renderer = await new Renderer(window, { ...options, warn }).ready
  const element = renderer.createElement("div")
  renderer.warn("foo", element)
  expect(warn).toBeCalledWith("foo", element)
})

test("`Renderer.debug()` calls the `debug()` callback", async () => {
  await using window = new Window()
  const debug = fn() as testing
  const renderer = await new Renderer(window, { ...options, debug }).ready
  const element = renderer.createElement("div")
  renderer.debug("foo", element)
  expect(debug).toBeCalledWith("foo", element)
})
