// Imports
import type { rw } from "@libs/typing/types"
import { expandGlob } from "@std/fs"
import { Logger } from "@libs/logger"
import { command } from "@libs/run/command"
import * as YAML from "@std/yaml"
const log = new Logger()

/*** Fill GitHub files with current existing scopes. */
if (import.meta.main) {
  const scopes = [...await Array.fromAsync(Deno.readDir("@mizu"))].map(({ name }) => name).filter((name) => !["coverage"].includes(name))
  scopes.push("www", "repo")
  for await (const { path, name } of expandGlob(".github/ISSUE_TEMPLATE/*.yml")) {
    if (name === "config.yml") {
      continue
    }
    const parsed = YAML.parse(await Deno.readTextFile(path)) as rw
    parsed.body.find((filed: rw) => filed.id === "scope").attributes.options = scopes
    await Deno.writeTextFile(path, YAML.stringify(parsed))
    await command("deno", ["fmt", path], { stdout: null, stderr: null })
    log.with({ path }).ok("done")
  }
}
