// Imports
import { Vendor } from "@tools/vendor_imports.ts"
import { _markdown } from "./mod.ts"
import { fromFileUrl } from "@std/path"
import { command } from "@libs/run/command"
import * as JSONC from "@std/jsonc"

// Get dependency
const config = fromFileUrl(import.meta.resolve("./deno.jsonc"))
const { imports: { "@libs/markdown": dependency } } = JSONC.parse(await Deno.readTextFile(config)) as { imports: Record<string, string> }

//
const mapping = [] as string[]
const vendor = await new Vendor({ directive: _markdown.name, meta: import.meta, name: "markdown" })
  .github({
    repository: "lowlighter/libs",
    branch: "main",
    path: "markdown/plugins",
    globs: ["*.ts", "!(*_test.ts)", "!(mod.ts)"],
    callback(name) {
      mapping.push(name)
    },
  })

// Update deno.jsonc
const imports = {
  "@libs/markdown": dependency,
  "@libs/markdown/plugins/____": `${dependency}/plugins/____`,
  ...Object.fromEntries(mapping.map((name) => [`@libs/markdown/plugins/${name}`, `${dependency}/plugins/${name}`])),
}
await Deno.writeTextFile(config, Deno.readTextFileSync(config).replace(/"imports": {[^}]+}/, `"imports": ${JSON.stringify(imports)}`))
await command("deno", ["fmt", config], { stdout: null, stderr: null })
vendor.log.ok(`updated ${config}`)
