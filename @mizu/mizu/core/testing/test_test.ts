import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { test as runner } from "./test.ts"

test()("`<test>` resolves test files and generates `Deno.test()` cases", async () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  await runner(`data:text/html;charset=utf-8,<test></test>`, test as testing)
  expect(test).toBeCalledTimes(1)
  expect(test.skip).not.toBeCalled()
  expect(test.only).not.toBeCalled()
})

test()("`<test only>` resolves test files and generates `Deno.only()` cases", async () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  await runner(`data:text/html;charset=utf-8,<test only></test>`, test as testing)
  expect(test).not.toBeCalled()
  expect(test.skip).not.toBeCalled()
  expect(test.only).toBeCalledTimes(1)
})

test()("`<test skip>` resolves test files and generates `Deno.ignore()` cases", async () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  await runner(`data:text/html;charset=utf-8,<test skip></test>`, test as testing)
  expect(test).not.toBeCalled()
  expect(test.skip).toBeCalledTimes(1)
  expect(test.only).not.toBeCalled()
})

await runner(import.meta.resolve("./fixtures/mod_test.html"))
