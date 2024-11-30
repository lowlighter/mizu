// deno-lint-ignore-file no-console
// Imports
import { getBinary } from "@astral/astral"

console.log(await getBinary("chrome", { cache: ".cache" }))
