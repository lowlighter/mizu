// Imports
import { Vendor } from "@tools/vendor_imports.ts"
import { _markdown } from "./mod.ts"

await new Vendor({ directive: _markdown.name, meta: import.meta, name: "markdown" })
  .github({
    repository: "lowlighter/libs",
    branch: "main",
    path: "markdown/plugins",
    globs: ["*.ts", "!(*_test.ts)", "!(mod.ts)"],
    destination: "plugins",
    export: (name) => `export { default } from "@libs/markdown/plugins/${name}"\n`,
  })
