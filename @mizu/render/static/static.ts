// Imports
import type { Arg, Arrayable, Context, Promisable, Renderer } from "@mizu/mizu/core/engine"
import { Logger } from "@libs/logger"
import { expandGlob } from "@std/fs"
import { common, dirname, join, resolve } from "@std/path"
import { readAll, readerFromStreamReader } from "@std/io"
import { Mizu as Server } from "../server/mod.ts"
export { Logger }
export type * from "@mizu/mizu/core/engine"

/** Text encoder. */
const encoder = new TextEncoder()

/** Text decoder. */
const decoder = new TextDecoder()

/**
 * Static site renderer.
 *
 * See {@link https://mizu.sh | mizu.sh documentation} for more details.
 * @module
 */
export class Static extends Server {
  /** Default directives. */
  static override defaults = {
    directives: Server.defaults.directives.slice(),
  } as typeof Server.defaults

  /** {@linkcode Static} constructor. */
  constructor({ directives = Static.defaults.directives, context = {}, ...options } = {} as { directives?: Arg<Renderer["load"]>; context?: ConstructorParameters<typeof Context>[0] } & GenerateOptions) {
    super({ directives, context })
    options.logger ??= new Logger()
    options.output ??= "./output"
    options.clean ??= true
    options.stat ??= Deno.lstat
    options.write ??= Deno.writeFile
    options.read ??= Deno.readFile
    options.mkdir ??= Deno.mkdir
    options.rmdir ??= Deno.remove
    this.options = options as Required<GenerateOptions>
  }

  /** {@linkcode Logger} instance. */
  readonly options: Required<GenerateOptions>

  /**
   * Generate static files.
   *
   * Set `output` option to specify the output directory.
   * Set `clean` option to clean the output directory before generation.
   *
   * Content can be retrieved from local files, callback return or URLs.
   * Rendering using {@linkcode Static.render()} can be enabled by setting the `render` option.
   *
   * ```ts
   * const mizu = new Static({ logger: new Logger({ level: "disabled" }), directives: ["@mizu/test"], output: "/fake/output" })
   * await mizu.generate(
   *   [
   *     // Copy content from local files
   *     { source: "**\/*", directory: "/fake/static", destination: "public" },
   *     { source: "*.html", directory: "/fake/partials", destination: "public", render: { context: { foo: "bar "} } },
   *     // Copy content from callback return
   *     { source: () => `<p ~test.text="'foo'"></p>`, destination: "foo.html", render: { context: { foo: "bar" } } },
   *     { source: () => JSON.stringify({ foo: "bar" }), destination: "foo.json" },
   *     // Copy content from URL
   *     { source: new URL(`data:text/html,<p>foobar</p>`), destination: "bar.html" },
   *     { source: new URL(`data:text/html,<p ~test.text="foo"></p>`), destination: "baz.html", render: { context: { foo: "bar" } } },
   *   ],
   *   // No-op: do not actually write files and directories
   *   { mkdir: () => null as any, write: () => null as any },
   * )
   * ```
   */
  async generate(
    contents: Array<GlobSource | CallbackSource | URLSource>,
    { logger: log = this.options.logger, output = this.options.output, clean = this.options.clean, stat = this.options.stat, write = this.options.write, read = this.options.read, mkdir = this.options.mkdir, rmdir = this.options.rmdir } = {} as GenerateOptions,
  ): Promise<void> {
    // Prepare output directory
    output = resolve(output)
    log.with({ output }).info("generating...")
    if ((await stat(output).then(() => true).catch(() => false)) && clean) {
      log.with({ path: output }).debug("cleaning...")
      await rmdir(output, { recursive: true })
      log.with({ path: output }).ok("cleaned")
    }
    await mkdir(output, { recursive: true })
    log.with({ path: output }).ok()

    // Generate files
    for (const content of contents) {
      const path = join(output, content.destination)
      log.with({ path }).debug("writing...")
      // Copy content from URL
      if (content.source instanceof URL) {
        const bytes = await fetch(content.source).then((response) => response.bytes())
        await write(path, await this.#render(bytes, content.render))
        log.with({ path }).ok()
      } // Copy content from callback
      else if (typeof content.source === "function") {
        let bytes = await content.source()
        if (typeof bytes === "string") {
          bytes = encoder.encode(bytes)
        }
        await write(path, await this.#render(bytes, content.render))
        log.with({ path }).ok()
      } // Copy content from local files
      else {
        const root = (content as GlobSource).directory
        for (const source of [content.source].flat()) {
          for await (const { path: from } of expandGlob(source, { root, includeDirs: false })) {
            const path = join(output, from.replace(common([root, from]), ""))
            await mkdir(dirname(path), { recursive: true })
            await write(path, await this.#render(await read(from), content.render))
            log.with({ path }).ok()
          }
        }
      }
      log.ok("done!")
    }
  }

  /** Used by {@linkcode Static#generate()} to render content. */
  async #render(content: Arg<NonNullable<GenerateOptions["write"]>, 1>, render?: Arg<Static["render"], 1>): Promise<Arg<NonNullable<GenerateOptions["write"]>, 1>> {
    if (render) {
      if (content instanceof ReadableStream) {
        content = await readAll(readerFromStreamReader(content.getReader()))
      }
      const rendered = await this.render(decoder.decode(content), render)
      content = encoder.encode(rendered)
    }
    return content
  }

  /** Default {@linkcode Static} instance. */
  static override readonly default = new Static() as Static
}

/** Options for {@linkcode Static.generate()}. */
export type GenerateOptions = {
  /** {@linkcode Logger} instance. */
  logger?: Logger
  /** Output directory. */
  output?: string
  /** Clean output directory before generation. */
  clean?: boolean
  /** Stat callback. */
  stat?: (path: string) => Promise<unknown>
  /** Read callback. */
  read?: (path: string) => Promise<Uint8Array | ReadableStream<Uint8Array>>
  /** Write callback. */
  write?: (path: string, data: Awaited<ReturnType<NonNullable<GenerateOptions["read"]>>>) => Promisable<void>
  /** Make directory callback. */
  mkdir?: (path: string, options?: { recursive?: boolean }) => Promisable<void>
  /** Remove directory callback. */
  rmdir?: (path: string, options?: { recursive?: boolean }) => Promisable<void>
}

/** Glob source. */
export type GlobSource = {
  /** A list of file globs. */
  source: Arrayable<string>
  /** Source directory. */
  directory: string
  /** Destination path (excluding filename). */
  destination: string
  /** Whether to render content with {@linkcode Static.render()}. */
  render?: Arg<Static["render"], 1>
}

/** Callback source. */
export type CallbackSource = {
  /** A callback that returns file content. */
  source: () => Promisable<Arg<NonNullable<GenerateOptions["write"]>, 1> | string>
  /** Destination path (including filename). */
  destination: string
  /** Whether to render content with {@linkcode Static.render()}. */
  render?: Arg<Static["render"], 1>
}

/** URL source. */
export type URLSource = {
  /** Source URL. */
  source: URL
  /**  Destination path (including filename). */
  destination: string
  /** Whether to render content with {@linkcode Static.render()}. */
  render?: Arg<Static["render"], 1>
}
