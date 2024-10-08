// Imports
import { fromFileUrl, parse } from "@std/path"
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

// Extract supported languages
const mapping = {} as Record<PropertyKey, string>
const files = await tree("highlightjs/highlight.js", { branch: "main", path: "src/languages" })
const { default: hljs } = await import(`${_code.import.highlightjs}/lib/core`)
logger.info(`found ${files.length} languages`)
for (const filename of files) {
  const language = parse(filename).name
  const log = logger.with({ language }).debug("processing")
  const { default: syntax } = await import(`${_code.import.highlightjs}/lib/languages/${language}`)
  hljs.registerLanguage(language, syntax)
  mapping[language] = language
  for (const alias of (hljs.getLanguage(language).aliases ?? [])) {
    mapping[alias] = language
    log.trace("registered alias", alias)
  }
}
await Deno.writeTextFile(fromFileUrl(import.meta.resolve("./mapping.json")), JSON.stringify(mapping))
logger.ok("mapping.json generated")
