import { expect, test, type testing } from "@libs/testing"
import { Window } from "@mizu/mizu/core/vdom"
import { keyboard } from "./keyboard.ts"
const { KeyboardEvent, MouseEvent } = new Window()

test()(`{@event} keyboard() handles single keys`, () => {
  const fn = keyboard("a")
  expect(fn(new KeyboardEvent("keydown", { key: "a" }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "b" }))).toBe(false)
})

test()(`{@event} keyboard() handles combination keys`, () => {
  for (const key of ["ctrl", "shift", "meta", "alt"] as const) {
    const fn = keyboard(`${key}+a`)
    expect(fn(new KeyboardEvent("keydown", { key: "a", [`${key}Key`]: true }))).toBe(true)
    expect(fn(new KeyboardEvent("keydown", { key: "a" }))).toBe(false)
    expect(fn(new KeyboardEvent("keydown", { key: "b", [`${key}Key`]: true }))).toBe(false)
  }
})

test()(`{@event} keyboard() handles "key" wildcard`, () => {
  const fn = keyboard("key")
  expect(fn(new KeyboardEvent("keydown", { key: "a" }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "b" }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "ctrl" }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "shift" }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "meta" }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "alt" }))).toBe(false)
})

test()(`{@event} keyboard() handles "key" wildcard within combinations`, () => {
  const fn = keyboard("alt+key")
  expect(fn(new KeyboardEvent("keydown", { key: "Alt", altKey: true }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "x", altKey: true }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "x", altKey: false }))).toBe(false)
})

test()(`{@event} keyboard() handles "space" alias`, () => {
  const fn = keyboard("space")
  expect(fn(new KeyboardEvent("keydown", { key: " " }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "a" }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "" }))).toBe(false)
})

test()(`{@event} keyboard() handles multiple combinations`, () => {
  const fn = keyboard("a, b, ctrl+c")
  expect(fn(new KeyboardEvent("keydown", { key: "a" }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "b" }))).toBe(true)
  expect(fn(new KeyboardEvent("keydown", { key: "c" }))).toBe(false)
  expect(fn(new KeyboardEvent("keydown", { key: "c", ctrlKey: true }))).toBe(true)
})

test()(`{@event} keyboard() does not react on non KeyboardEvent`, () => {
  const fn = keyboard("dead")
  expect(fn(new MouseEvent("click") as testing)).toBe(false)
})
