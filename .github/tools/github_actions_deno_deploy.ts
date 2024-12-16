// deno-lint-ignore-file no-explicit-any
// Imports
import * as JSONC from "@std/jsonc"
import * as core from "@actions/core"

// Parse deno.jsonc and print deno deploy flags
const config = JSONC.parse(await Deno.readTextFile("./deno.jsonc")) as any
await Deno.writeTextFile(".imports.json", JSON.stringify({ imports: config.imports }, null, 2))
core.setOutput("project", config.deploy.project)
core.setOutput("entrypoint", config.deploy.entrypoint)
core.setOutput("include", config.deploy.include.join(","))
core.setOutput("exclude", config.deploy.exclude.join(","))
core.setOutput("import_map", ".imports.json")
