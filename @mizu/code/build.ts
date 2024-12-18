// Imports
import { Vendor } from "@tools/vendor_imports.ts"
import { fromFileUrl } from "@std/path"
import { _code } from "./mod.ts"
import { command } from "@libs/run/command"
import * as JSONC from "@std/jsonc"

// Get dependency
const config = fromFileUrl(import.meta.resolve("./deno.jsonc"))
const { imports: { "highlight.js": dependency } } = JSONC.parse(await Deno.readTextFile(config)) as { imports: Record<string, string> }

// Fetch highlight.js languages
const { default: hljs } = await import(`${dependency}/lib/core`)
const mapping = {} as Record<PropertyKey, string>
const vendor = await new Vendor({ directive: _code.name, meta: import.meta, name: "highlight.js" })
  .github({
    repository: "highlightjs/highlight.js",
    branch: "main",
    path: "src/languages",
    globs: ["*.js"],
    async callback(name, { log }) {
      const { default: syntax } = await import(`${dependency}/lib/languages/${name}`)
      hljs.registerLanguage(name, syntax)
      mapping[name] = name
      for (const alias of (hljs.getLanguage(name)?.aliases ?? [])) {
        mapping[alias] = name
        log.trace("registered alias", alias)
      }
    },
  })

// Write mapping.json
await Deno.writeTextFile(fromFileUrl(import.meta.resolve("./mapping.json")), JSON.stringify(mapping))
vendor.log.ok("mapping.json generated")

// Update deno.jsonc
const imports = {
  "highlight.js": dependency,
  "highlight.js/lib/core": `${dependency}/lib/core`,
  ...Object.fromEntries(Object.entries(mapping).map(([name, language]) => [`highlight.js/lib/languages/${language}`, `${dependency}/lib/languages/${name}`])),
}
await Deno.writeTextFile(config, Deno.readTextFileSync(config).replace(/"imports": {[^}]+}/, `"imports": ${JSON.stringify(imports)}`))
await command("deno", ["fmt", config], { stdout: null, stderr: null })
vendor.log.ok(`updated ${config}`)
