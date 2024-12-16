// Imports
import * as JSONC from "@std/jsonc"
import * as core from "@actions/core"
import { encodeBase64 } from "@std/encoding"

// Parse deno.jsonc and print deno deploy flags
// deno-lint-ignore no-explicit-any
const config = JSONC.parse(await Deno.readTextFile("./deno.jsonc")) as any
core.setOutput("project", config.deploy.project)
core.setOutput("entrypoint", config.deploy.entrypoint)
core.setOutput("include", config.deploy.include.join(","))
core.setOutput("exclude", config.deploy.exclude.join(","))
core.setOutput("import_map", new URL(`data:application/json;base64,${encodeBase64(JSON.stringify(config.imports))}`).href)
