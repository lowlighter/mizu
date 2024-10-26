// Imports
import { Vendor } from "@tools/vendor_imports.ts"
import { fromFileUrl } from "@std/path"
import { _code } from "./mod.ts"

const { hljs } = await import("./import/highlight.js/core.ts")
const mapping = {} as Record<PropertyKey, string>
const vendor = await new Vendor({ directive: _code.name, meta: import.meta, name: "highlight.js" })
  .github({
    repository: "highlightjs/highlight.js",
    branch: "main",
    path: "src/languages",
    globs: ["*.js"],
    destination: "languages",
    export: (name) => `export { default as syntax } from "highlight.js/lib/languages/${name}"\n`,
    async callback(name, { log }) {
      const { syntax } = await import(`./import/highlight.js/languages/${name}.ts`)
      hljs.registerLanguage(name, syntax)
      mapping[name] = name
      for (const alias of (hljs.getLanguage(name)?.aliases ?? [])) {
        mapping[alias] = name
        log.trace("registered alias", alias)
      }
    },
  })
await Deno.writeTextFile(fromFileUrl(import.meta.resolve("./mapping.json")), JSON.stringify(mapping))
vendor.log.ok("mapping.json generated")
