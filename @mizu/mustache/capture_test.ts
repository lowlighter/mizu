import { expect, test } from "@libs/testing"
import { capture } from "./capture.ts"

test("`capture()` captures content between double delimiters", () => {
  expect(capture("foo {{ bar }} baz")).toMatchObject({
    captured: "bar",
    match: "{{ bar }}",
    a: "foo ".length,
    b: "foo {{ bar }}".length,
    triple: false,
  })
})

test("`capture()` captures content between triple delimiters", () => {
  expect(capture("foo {{{ bar }}} baz")).toMatchObject({
    captured: "bar",
    match: "{{{ bar }}}",
    a: "foo ".length,
    b: "foo {{{ bar }}}".length,
    triple: true,
  })
})

test("`capture()` handles nested delimiters", () => {
  for (const d of ["{{", "{{{"]) {
    const b = { "{{": "}}", "{{{": "}}}" }[d]
    for (const q of ["'", '"', "`"]) {
      expect(capture(`foo ${d} ${q}${d} bar ${b}${q} ${b} baz`)).toMatchObject({ captured: `${q}${d} bar ${b}${q}` })
      expect(capture(`foo ${d} ${q}bar ${b}${q} ${b} baz`)).toMatchObject({ captured: `${q}bar ${b}${q}` })
      expect(capture(`foo ${d} ${q}${d} bar${q} ${b} baz`)).toMatchObject({ captured: `${q}${d} bar${q}` })
    }
    expect(capture(`${d} [{}, {}] ${b}`)).toMatchObject({ captured: "[{}, {}]" })
    expect(capture(`${d} ({}, {}) ${b}`)).toMatchObject({ captured: "({}, {})" })
    expect(capture(`${d} {foo:{}}[bar] ${b}`)).toMatchObject({ captured: "{foo:{}}[bar]" })
    expect(capture(`${d} (() => {{ 1 }}) ${b}`)).toMatchObject({ captured: "(() => {{ 1 }})" })
  }
})

test("`capture()` throws `new SyntaxError()` on unclosed expressions", () => {
  expect(() => capture("foo {{ bar baz")).toThrow(SyntaxError, "Unclosed expression")
})
