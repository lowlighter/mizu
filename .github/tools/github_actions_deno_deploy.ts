// Imports
import * as JSONC from "@std/jsonc"
import * as core from "@actions/core"

// Parse deno.jsonc and print deno deploy flags
// deno-lint-ignore no-explicit-any
const config = JSONC.parse(await Deno.readTextFile("./deno.jsonc")) as any
core.setOutput("project", config.deploy.project)
core.setOutput("entrypoint", config.deploy.entrypoint)
core.setOutput("include", config.deploy.include.join(","))
core.setOutput("exclude", config.deploy.exclude.join(","))
core.setOutput("import_map", ".imports_map.json")

const imports = config.imports
for (const [key, value] of Object.entries(config.imports)) {
  if ((key.startsWith("@")) && (!key.endsWith("/"))) {
    imports[`${key}/`] = `${value}/`
  }
}

await Deno.writeTextFile(".imports_map.json", JSON.stringify({ imports }, null, 2))
