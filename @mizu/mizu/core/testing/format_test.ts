import { expect, test } from "@libs/testing"
import { format } from "./format.ts"

test()("`format()` formats html and tries to put a most one node per line", () => {
  expect(format(`
<main><a>foo</a><b></b></main>
`.trim())).toBe(`
<main>
  <a>
    foo
  </a>
  <b></b>
</main>
`.trim())
})

test()("`format()` formats html and tries to put empty tags on same line", () => {
  expect(format(`
<main>
</main>
`.trim())).toBe(`
<main></main>
`.trim())
})
