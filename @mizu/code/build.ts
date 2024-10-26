// Imports
import { fromFileUrl, join, parse } from "@std/path"
import { emptyDir, exists } from "@std/fs"
import { Logger } from "@libs/logger"
import { _code } from "./mod.ts"
const logger = new Logger().with({ directive: _code.name })

/** List files from github repository. */
async function tree(repository: string, { branch, path }: { branch: string; path: string }) {
  const segments = [...path.split("/"), ""]
  let subtree = { url: `https://api.github.com/repos/${repository}/git/trees/${branch}`, tree: [] as Array<{ path: string; type: string }> }
  while (segments.length) {
    const segment = segments.shift()
    logger.debug(`fetching ${subtree.url}`)
    const { tree } = await fetch(subtree.url).then((response) => response.json())
    subtree = segment ? tree.find(({ path }: { path: string }) => path === segment) : { url: subtree.url, tree }
  }
  return subtree.tree.filter(({ type }: { type: string }) => type === "blob").map(({ path }: { path: string }) => path)
}

// Clean imports
const imports = join(fromFileUrl(import.meta.resolve("./import/highlight.js")))
await emptyDir(join(imports, "languages"))
logger.with({ path: join(imports, "languages") }).ok("cleaned")

// Extract supported languages
const mapping = {} as Record<PropertyKey, string>
const files = await tree("highlightjs/highlight.js", { branch: "main", path: "src/languages" })
const { hljs } = await import("./import/highlight.js/core.ts")
logger.info(`found ${files.length} languages`)
for (const filename of files) {
  const language = parse(filename).name
  const log = logger.with({ language }).debug("processing")
  // Create language exports
  const exports = join(imports, "languages", `${language}.ts`)
  if (!await exists(exports)) {
    await Deno.writeTextFile(exports, `export { default as syntax } from "highlight.js/lib/languages/${language}"\n`)
    log.with({ path: exports }).ok()
  }
  // Register language in mapping
  const { syntax } = await import(`./import/highlight.js/languages/${language}.ts`)
  hljs.registerLanguage(language, syntax)
  mapping[language] = language
  for (const alias of (hljs.getLanguage(language)?.aliases ?? [])) {
    mapping[alias] = language
    log.trace("registered alias", alias)
  }
}

// Save mapping
await Deno.writeTextFile(fromFileUrl(import.meta.resolve("./mapping.json")), JSON.stringify(mapping))
logger.ok("mapping.json generated")
