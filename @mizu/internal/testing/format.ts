// Imports
import { createFromBuffer } from "@dprint/formatter"
import { fromFileUrl } from "@std/path"
// deno-lint-ignore no-external-import
import { readFileSync } from "node:fs"

/** HTML formatter. */
const formatter = createFromBuffer(readFileSync(fromFileUrl(import.meta.resolve("./fixtures/markup_fmt-v0.13.1.wasm"))))
formatter.setConfig({}, { printWidth: 120, closingBracketSameLine: true, closingTagLineBreakForEmpty: "never", preferAttrsSingleLine: true, whitespaceSensitivity: "ignore" })

/** Format HTML. */
export function format(html: string): string {
  const options = { filePath: "test.html", fileText: html }
  return formatter.formatText({ ...options, fileText: formatter.formatText({ ...options, overrideConfig: { printWidth: 0 } }) })
    .split("\n")
    .filter((line) => line)
    .join("\n")
}
