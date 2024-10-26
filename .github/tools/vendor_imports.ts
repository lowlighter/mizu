// Imports
import type { Promisable } from "@libs/typing"
import { fromFileUrl, join, parse, globToRegExp } from "@std/path"
import { emptyDir, exists } from "@std/fs"
import { Logger } from "@libs/logger"

/** Vendor imports. */
export class Vendor {
  /** Constructor. */
  constructor({directive, meta, name}:{directive: string|RegExp, meta:ImportMeta, name:string}) {
    this.#directory = join(fromFileUrl(meta.resolve(`./import/${name}`)))
    this.log = new Logger().with({ directive })
  }

  /** Exposed import directory. */
  readonly #directory

  /** Linked {@linkcode Logger}. */
  readonly log

  /** List files from github repository. */
  async #tree(repository: string, { branch, path }: { branch: string; path: string }) {
    const segments = [...path.split("/"), ""]
    let subtree = { url: `https://api.github.com/repos/${repository}/git/trees/${branch}`, tree: [] as Array<{ path: string; type: string }> }
    while (segments.length) {
      const segment = segments.shift()
      this.log.debug(`fetching ${subtree.url}`)
      const { tree } = await fetch(subtree.url).then((response) => response.json())
      subtree = segment ? tree.find(({ path }: { path: string }) => path === segment) : { url: subtree.url, tree }
    }
    return subtree.tree.filter(({ type }: { type: string }) => type === "blob").map(({ path }: { path: string }) => path)
  }

  /** Vendor files from github repository. */
  async github({ repository, branch, path, globs, destination, export:exporter, callback }: { repository: string; branch: string; path: string; globs?: string[], destination:string, export?:(name:string) => string, callback?: (name:string, _:{ log: Logger}) => Promisable<void> }) {
    destination = join(this.#directory, destination)
    // Clean directory
    await emptyDir(destination)
    this.log.with({ destination }).ok("cleaned")
    // Search files from repository
    let files = await this.#tree(repository, { branch, path })
    if (globs)
      files = files.filter((file) => globs.every(glob => globToRegExp(glob, {extended:true}).test(file)))
    this.log.with({ repository, branch, path }).info(`found ${files.length} matching files`)
    // Process files
    for (const filename of files) {
      const { name } = parse(filename)
      const log = this.log.with({ name }).debug("processing")
      // Re-export file
      if (exporter) {
        const exports = join(destination, `${name}.ts`)
        if (!await exists(exports)) {
          await Deno.writeTextFile(exports, exporter(name))
          log.with({ exports }).ok()
        }
      }
      // Apply callback
      await callback?.(name, { log })
    }
    return this
  }

}
