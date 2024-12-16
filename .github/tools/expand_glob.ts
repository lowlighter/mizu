// deno-lint-ignore-file no-console
// Imports
import { expandGlob } from "@std/fs"

/*** Fill GitHub files with current existing scopes. */
if (import.meta.main) {
  const paths = []
  for (const glob of Deno.args) {
    for await (const { path } of expandGlob(glob)) {
      paths.push(path)
    }
  }
  console.log(paths.join(","))
}
