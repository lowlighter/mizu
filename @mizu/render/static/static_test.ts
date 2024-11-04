import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { Logger } from "@libs/logger"
import { join } from "@std/path"
import { Static } from "./static.ts"
const output = "/fake/path"
const logger = new Logger({ level: "disabled" })
const encoder = new TextEncoder()
const fs = { stat: fn(), mkdir: fn(), rmdir: fn(), read: fn(), write: fn() } as testing

test()("`Server.generate()` manages `output` directory", async () => {
  let exists = false
  const stat = fn(() => exists ? Promise.resolve({}) : Promise.reject("Not found")) as testing
  const mkdir = fn() as testing
  const rmdir = fn() as testing
  const mizu = new Static({ logger, output, fs: { ...fs, stat, mkdir, rmdir } })
  await mizu.generate([], { clean: false })
  expect(stat).toHaveBeenCalledWith(output)
  expect(rmdir).not.toBeCalled()
  expect(mkdir).toHaveBeenCalledWith(output, { recursive: true })
  exists = true
  await mizu.generate([], { clean: true })
  expect(stat).toHaveBeenCalledWith(output)
  expect(rmdir).toHaveBeenCalledWith(output, { recursive: true })
  expect(mkdir).toHaveBeenCalledWith(output, { recursive: true })
}, { permissions: { read: true } })

test()("`Server.generate()` can retrieve content from urls", async () => {
  const write = fn() as testing
  const mizu = new Static({ directives: ["@mizu/test"], logger, output, fs: { ...fs, write, mkdir: () => null } })
  await mizu.generate([
    [
      new URL(`data:text/html,<p ~test.text="foo"></p>`),
      "bar.html",
      { render: { select: "p", context: { foo: "bar" } } },
    ],
  ])
  expect(write).toHaveBeenCalledWith(join(output, "bar.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
}, { permissions: { read: true } })

test()("`Server.generate()` can retrieve content from functions", async () => {
  const mizu = new Static({ directives: ["@mizu/test"], logger, output, fs: { ...fs, mkdir: () => null } })
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

test()("`Server.generate()` can retrieve content from local files", async () => {
  const write = fn() as testing
  const mkdir = fn() as testing
  const mizu = new Static({ directives: ["@mizu/test"], logger, output, fs: { ...fs, write, mkdir, read: () => Promise.resolve(encoder.encode(`<p ~test.text="foo"></p>`)) } })
  await mizu.generate([
    [
      "mod.ts",
      ".",
      { directory: import.meta.dirname!, render: { select: "p", context: { foo: "bar" } } },
    ],
  ])
  expect(write).toHaveBeenCalledWith(join(output, "mod.ts"), encoder.encode(`<p ~test.text="foo">bar</p>`))
}, { permissions: { read: true } })

test()("`Server.generate()` can retrieve content strings", async () => {
  const write = fn() as testing
  const mizu = new Static({ directives: ["@mizu/test"], logger, output, fs: { ...fs, write, mkdir: () => null } })
  await mizu.generate([
    [
      `<p ~test.text="foo"></p>`,
      "bar.html",
      { render: { select: "p", context: { foo: "bar" } } },
    ],
  ])
  expect(write).toHaveBeenCalledWith(join(output, "bar.html"), encoder.encode(`<p ~test.text="foo">bar</p>`))
}, { permissions: { read: true } })
