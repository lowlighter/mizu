// Imports
import type { Directive } from "@mizu/internal/engine"
import { Logger } from "@libs/logger"
import { parseArgs } from "@std/cli"
import * as git from "@libs/git"
import * as semver from "@std/semver"
const log = new Logger()

/** Bump packages version and print changelogs. */
if (import.meta.main) {
  const { "dry-run": dryrun } = parseArgs(Deno.args, { boolean: ["dry-run"] })

  // Compute scopes
  const scopes = [...await Array.fromAsync<{ name: string }>(Deno.readDir("@mizu"))]
    .filter(({ name }) => !["internal", "render", "coverage"].includes(name))
    .map(({ name }) => name)

  // Compute render scopes
  const render = { scopes: ["internal", "render"] }
  const mapping = new Map<Directive, Set<string>>()
  for (const scope of scopes) {
    if ((scope === "unstable") || (scope === "extras")) {
      continue
    }
    const { default: exported } = await import(`@mizu/${scope}`)
    for (const directive of [exported].flat()) {
      if (!mapping.has(directive)) {
        mapping.set(directive, new Set())
      }
      mapping.get(directive)!.add(scope)
    }
  }
  for (const [directive, scopes] of mapping) {
    log.with({ directive: `${directive.name}`, scopes: [...scopes].join(",") }).debug()
  }
  for (const section of ["client", "server"] as const) {
    const { default: directives } = await import(`@mizu/render/${section}/defaults`)
    for (const directive of [directives].flat()) {
      render.scopes.push(...(mapping.get(directive) ?? []))
    }
  }
  render.scopes = [...new Set(render.scopes)]

  // Bump package versions
  for (const scope of [...scopes, "internal", "render", "extras"]) {
    log.with({ directive: scope }).debug("checking")
    const { version, changelog } = git.changelog(`@mizu/${scope}/deno.jsonc`, { write: !dryrun, scopes: [scope, "internal", "extras", ...(scope === "render" ? render.scopes : [])] })
    if (version.bump) {
      changelog.split("\n").map((line) => log.with({ directive: scope }).info(line))
      log.with({ directive: scope }).ok(`${semver.format(version.current)} → ${semver.format(version.next)}`)
    } else {
      log.with({ directive: scope }).debug("no changes")
    }
  }
}
