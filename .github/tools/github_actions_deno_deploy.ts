// Imports
import * as JSONC from "@std/jsonc"
import * as core from "@actions/core"

// Ensure script is run in CI environment
if (!Deno.env.get("CI")) {
  throw new Error("This script should be run only in CI environment")
}

// Remove lockfiles and package.json to avoid resolution conflicts
// https://github.com/denoland/deno/issues/27380
await Deno.remove("deno.lock", { recursive: true })
await Deno.remove("package.json", { recursive: true })
await Deno.remove("package-lock.json", { recursive: true })

// Parse deno.jsonc and print deno deploy flags
// deno-lint-ignore no-explicit-any
const config = JSONC.parse(await Deno.readTextFile("./deno.jsonc")) as any
await Deno.writeTextFile(".imports.json", JSON.stringify({ imports: config.imports }, null, 2))
core.setOutput("project", config.deploy.project)
core.setOutput("entrypoint", config.deploy.entrypoint)
core.setOutput("include", config.deploy.include.join(","))
core.setOutput("exclude", config.deploy.exclude.join(","))
core.setOutput("import_map", ".imports.json")
