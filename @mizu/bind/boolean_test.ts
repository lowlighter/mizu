import { expect, test } from "@libs/testing"
import { boolean } from "./boolean.ts"

for (
  const [attribute, tags] of [
    ["autofocus", { p: true }],
    ["disabled", { button: true, input: true, optgroup: true, option: true, select: true, textarea: true, fieldset: true, link: true, p: false }],
    ["novalidate", { form: true, p: false }],
    ["readonly", { input: true, textarea: true, p: false }],
    ["required", { textarea: true, input: true, select: true, p: false }],
    ["checked", { input: true, p: false }],
    ["formnovalidate", { input: true, button: true, p: false }],
    ["multiple", { select: true, p: false }],
    ["selected", { option: true, p: false }],
    ["ismap", { img: true, p: false }],
    ["playsinline", { video: true, p: false }],
    ["autoplay", { video: true, audio: true, p: false }],
    ["controls", { video: true, audio: true, p: false }],
    ["loop", { video: true, audio: true, p: false }],
    ["muted", { video: true, audio: true, p: false }],
    ["default", { track: true, p: false }],
    ["shadowrootdelegatesfocus", { template: true, p: false }],
    ["shadowrootclonable", { template: true, p: false }],
    ["shadowrootserializable", { template: true, p: false }],
    ["async", { script: true, p: false }],
    ["defer", { script: true, p: false }],
    ["nomodule", { script: true, p: false }],
    ["allowfullscreen", { iframe: true, p: false }],
    ["reversed", { ol: true, p: false }],
    ["open", { details: true, dialog: true, p: false }],
    ["other", { p: false }],
  ] as const
) {
  test(`{:attribute} boolean() treats accordingly {${attribute}}`, () => {
    for (const [tagname, expected] of Object.entries(tags)) {
      expect(boolean(tagname.toUpperCase(), attribute)).toBe(expected)
    }
  })
}
