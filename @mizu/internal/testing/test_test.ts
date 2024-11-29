import type { testing } from "@libs/testing"
import { expect, fn, test } from "@libs/testing"
import { test as runner } from "./test.ts"

test("`<test/>` generates `Deno.test` cases", () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  runner(`<test></test>`, test as testing)
  expect(test).toBeCalledTimes(1)
  expect(test.skip).not.toBeCalled()
  expect(test.only).not.toBeCalled()
})

test("`<test only/>` generates `Deno.test.only()` cases", () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  runner(`<test only></test>`, test as testing)
  expect(test).not.toBeCalled()
  expect(test.skip).not.toBeCalled()
  expect(test.only).toBeCalledTimes(1)
})

test("`<test skip/>` generates `Deno.test.ignore()` cases", () => {
  const callback = () => () => {}
  const test = Object.assign(fn(callback), { skip: fn(callback), only: fn(callback) })
  runner(`<test skip></test>`, test as testing)
  expect(test).not.toBeCalled()
  expect(test.skip).toBeCalledTimes(1)
  expect(test.only).not.toBeCalled()
})

runner(import.meta.resolve("./fixtures/mod_test.html"))
