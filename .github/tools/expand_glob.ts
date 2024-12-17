// deno-lint-ignore-file no-console
// Imports
import { expandGlob } from "@std/fs"
import { parseArgs } from "@std/cli"

/*** Resolve globs. */
if (import.meta.main) {
  const { _: globs, ...flags } = parseArgs(Deno.args, { boolean: ["break"], string: ["separator"] })
  const paths = []
  for (const glob of globs) {
    for await (const { path } of expandGlob(glob)) {
      paths.push(path)
    }
    if ((paths.length) && (flags.break)) {
      break
    }
  }
  console.log(paths.join(flags.separator ?? ","))
}
