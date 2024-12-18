import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { join, resolve } from "@std/path"
import { Server } from "./server.ts"
const output = resolve("/fake/path")
const encoder = new TextEncoder()
const fs = { stat: fn(), mkdir: fn(), rm: fn(), read: fn(), readdir: fn(() => []), write: fn() } as testing

test("`Server.generate()` manages `output` directory", async () => {
  let exists = false
  const stat = fn(() => exists ? Promise.resolve({}) : Promise.reject("Not found")) as testing
  const mkdir = fn() as testing
  const rm = fn() as testing
  const mizu = new Server({ generate: { output, fs: { ...fs, stat, mkdir, rm } } })
  await mizu.generate([], { clean: false })
  expect(stat).toHaveBeenCalledWith(output)
  expect(rm).not.toBeCalled()
  expect(mkdir).toHaveBeenCalledWith(output, { recursive: true })
  exists = true
  await mizu.generate([], { clean: true })
  expect(stat).toHaveBeenCalledWith(output)
  expect(rm).toHaveBeenCalledWith(output, { recursive: true })
  expect(mkdir).toHaveBeenCalledWith(output, { recursive: true })
}, { permissions: { read: true } })

test("`Server.generate()` can retrieve content from urls", async () => {
  const write = fn() as testing
  const mizu = new Server({ directives: ["@mizu/test"], generate: { output, fs: { ...fs, write, mkdir: () => null } } })
  await mizu.generate([
    [
      new URL(`data:text/html,<p ~test.text="foo"></p>`),
      "bar.html",
      { render: { select: "p", context: { foo: "bar" } } },
    ],
  ])
  expect(write).toHaveBeenCalledWith(join(output, "bar.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
}, { permissions: { read: true } })

test("`Server.generate()` can retrieve content from functions", async () => {
  const mizu = new Server({ directives: ["@mizu/test"], generate: { output, fs: { ...fs, mkdir: () => null } } })
  for (
    const source of [
      () => `<p ~test.text="foo"></p>`,
      () => encoder.encode(`<p ~test.text="foo"></p>`),
      () =>
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(`<p ~test.text="foo"></p>`))
            controller.close()
          },
        }),
    ]
  ) {
    const write = fn() as testing
    await mizu.generate([
      [
        source as testing,
        "bar.html",
        { render: { select: "p", context: { foo: "bar" } } },
      ],
    ], { fs: { write } })
    expect(write).toHaveBeenCalledWith(join(output, "bar.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
  }
}, { permissions: { read: true } })

test("`Server.generate()` can retrieve content from local files", async () => {
  for (
    const { readdir, stat } of [
      {
        readdir: (path: string) => ({ "/": ["a", "bar.html"], "/a": ["b"], "/a/b": ["foo.html"] })[path.replaceAll("\\", "/")],
        stat: (path: string) => ({ isFile: path.includes("."), isDirectory: !path.includes(".") }),
      },
      {
        readdir: (path: string) => ({ "/": [{ name: "a" }, { name: "bar.html" }], "/a": [{ name: "b" }], "/a/b": [{ name: "foo.html" }] })[path.replaceAll("\\", "/")],
        stat: (path: string) => ({ isFile: () => path.includes("."), isDirectory: () => !path.includes(".") }),
      },
    ] as const
  ) {
    const write = fn() as testing
    const mkdir = fn() as testing
    const mizu = new Server({
      directives: ["@mizu/test"],
      generate: { output, fs: { ...fs, write, mkdir, readdir, stat, read: () => Promise.resolve(encoder.encode(`<p ~test.text="foo"></p>`)) } },
    })
    await mizu.generate([
      [
        "**/*.html",
        ".",
        { directory: "/", render: { select: "p", context: { foo: "bar" } } },
      ],
      [
        "*.html",
        ".",
        { directory: "/", render: { select: "p", context: { foo: "baz" } } },
      ],
    ])
    expect(write).toHaveBeenCalledWith(resolve("/fake/path/a/b/foo.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
    expect(write).toHaveBeenCalledWith(resolve("/fake/path/bar.html"), encoder.encode(`<p ~test.text="foo">baz</p>`))
  }
}, { permissions: { read: true } })

test("`Server.generate()` can retrieve content strings", async () => {
  const write = fn() as testing
  const mizu = new Server({ directives: ["@mizu/test"], generate: { output, fs: { ...fs, write, mkdir: () => null } } })
  await mizu.generate([
    [
      `<p ~test.text="foo"></p>`,
      "bar.html",
      { render: { select: "p", context: { foo: "bar" } } },
    ],
  ])
  expect(write).toHaveBeenCalledWith(join(output, "bar.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
}, { permissions: { read: true } })
