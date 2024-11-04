// Imports
import type { Arg, Arrayable, Context, Promisable, Renderer } from "@mizu/internal/engine"
import { Logger } from "@libs/logger"
import { expandGlob } from "@std/fs"
import { common, dirname, join, resolve } from "@std/path"
import { readAll, readerFromStreamReader } from "@std/io"
import { Mizu as Server } from "../server/mod.ts"
import { mkdir, readFile as read, rmdir, stat, writeFile as write } from "@node/fs/promises"
import { Buffer } from "@node/buffer"
export { Logger }
export type * from "@mizu/internal/engine"

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
    options.fs ??= {}
    options.fs.stat ??= stat
    options.fs.mkdir ??= mkdir
    options.fs.rmdir ??= rmdir
    options.fs.read ??= read
    options.fs.write ??= write
    this.options = options as Required<GenerateOptions>
  }

  /** {@linkcode Logger} instance. */
  readonly options: Required<GenerateOptions>

  /**
   * Generate static files from various sources.
   *
   * Options:
   * - `output`: Specify the path to the output directory.
   * - `clean`: Empty the `output` directory before generating files.
   *
   * Supported sources:
   * - {@linkcode StringSource}: Generate content from raw strings.
   * - {@linkcode GlobSource}: Generate content from local files matching the provided glob patterns.
   * - {@linkcode CallbackSource}: Generate content from callback returns.
   * - {@linkcode URLSource}: Generate content from fetched URLs.
   *
   * Each source can be templated using mizu rendering by passing a `render` option.
   *
   * ```ts
   * const mizu = new Static({ logger: new Logger({ level: "disabled" }), directives: ["@mizu/test"], output: "/fake/output" })
   * await mizu.generate(
   *   [
   *     // Copy content from strings
   *     [ "<p>foo</p>", "string.html" ],
   *     [ "<p ~test.text='foo'></p>", "string_render.html", { render: { context: { foo: "bar" } } } ],
   *     // Copy content from local files
   *     [ "**\/*", "public", { directory: "/fake/static" } ],
   *     [ "*.html", "public", { directory: "/fake/partials", render: { context: { foo: "bar "} } } ],
   *     // Copy content from callback return
   *     [ () => JSON.stringify({ foo: "bar" }), "callback.json" ],
   *     [ () => `<p ~test.text="'foo'"></p>`, "callback.html", { render: { context: { foo: "bar" } } } ],
   *     // Copy content from URL
   *     [ new URL(`data:text/html,<p>foobar</p>`), "url.html" ],
   *     [ new URL(`data:text/html,<p ~test.text="foo"></p>`), "url_render.html", { render: { context: { foo: "bar" } } } ],
   *   ],
   *   // No-op: do not actually write files and directories
   *   { fs: { mkdir: () => null as any, write: () => null as any } },
   * )
   * ```
   */
  async generate(
    sources: Array<StringSource | GlobSource | CallbackSource | URLSource>,
    { logger: log = this.options.logger, output = this.options.output, clean = this.options.clean, fs: _fs } = {} as GenerateOptions,
  ): Promise<void> {
    const fs = { ...this.options.fs, ..._fs } as FileSystemOptions
    // Prepare output directory
    output = resolve(output)
    log.with({ output }).info("generating...")
    if ((await Promise.resolve(fs.stat(output)).then(() => true).catch(() => false)) && clean) {
      log.with({ path: output }).debug("cleaning...")
      await fs.rmdir(output, { recursive: true })
      log.with({ path: output }).ok("cleaned")
    }
    await fs.mkdir(output, { recursive: true })
    log.with({ path: output }).ok()

    // Generate files
    for (const [source, destination, options = {}] of sources) {
      const path = join(output, destination)
      log.with({ path }).debug("writing...")
      // Copy content from URL
      if (source instanceof URL) {
        const bytes = await fetch(source).then((response) => response.bytes())
        await fs.write(path, await this.#render(Buffer.from(bytes), options.render))
        log.with({ path }).ok()
      } // Copy content from callback
      else if (typeof source === "function") {
        let bytes = await source()
        if (typeof bytes === "string") {
          bytes = Buffer.from(encoder.encode(bytes))
        }
        await fs.write(path, await this.#render(bytes, options.render))
        log.with({ path }).ok()
      } // Copy content from local files
      else if ("directory" in options) {
        const root = `${options.directory}`
        const sources = [source].flat()
        for (const source of sources) {
          for await (const { path: from } of expandGlob(source, { root, includeDirs: false })) {
            const path = join(output, from.replace(common([root, from]), ""))
            await fs.mkdir(dirname(path), { recursive: true })
            await fs.write(path, await this.#render(await fs.read(from), options.render))
            log.with({ path }).ok()
          }
        }
      } // Copy content from string
      else {
        await fs.write(path, await this.#render(Buffer.from(encoder.encode(source as string)), options.render))
        log.with({ path }).ok()
      }
    }
    log.ok("done!")
  }

  /** Used by {@linkcode Static#generate()} to render content. */
  async #render(content: Arg<NonNullable<FileSystemOptions["write"]>, 1>, render?: Arg<Static["render"], 1>): Promise<Arg<NonNullable<FileSystemOptions["write"]>, 1>> {
    if (render) {
      if (content instanceof ReadableStream) {
        content = Buffer.from(await readAll(readerFromStreamReader(content.getReader())))
      }
      const rendered = await this.render(decoder.decode(content), render)
      content = Buffer.from(encoder.encode(rendered))
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
  /** File system options. */
  fs?: Partial<FileSystemOptions>
}

/** File system options. */
export type FileSystemOptions = {
  /** Stat callback. */
  stat: (path: string) => Promise<unknown>
  /** Read callback. */
  read: (path: string) => Promise<Buffer>
  /** Write callback. */
  write: (path: string, data: Buffer) => Promisable<void>
  /** Make directory callback. */
  mkdir: (path: string, options?: { recursive?: boolean }) => Promisable<unknown>
  /** Remove directory callback. */
  rmdir: (path: string, options?: { recursive?: boolean }) => Promisable<unknown>
}

/** String source. */
export type StringSource = [
  /** File content. */
  string,
  /** Destination path (including filename). */
  string,
  /** Options. */
  {
    /** Whether to render content with {@linkcode Static.render()}. */
    render?: Arg<Static["render"], 1>
  }?,
]

/**
 * Glob source.
 *
 * The presence of the `directory` option is used to distinguish this type from {@linkcode StringSource}.
 */
export type GlobSource = [
  /** A list of file globs. */
  Arrayable<string>,
  /** Destination path (excluding filename). */
  string,
  /** Options. */
  {
    /** Source directory. */
    directory: string
    /** Whether to render content with {@linkcode Static.render()}. */
    render?: Arg<Static["render"], 1>
  },
]

/** Callback source. */
export type CallbackSource = [
  /** A callback that returns file content. */
  () => Promisable<Arg<NonNullable<FileSystemOptions["write"]>, 1> | string>,
  /** Destination path (including filename). */
  string,
  /** Options. */
  {
    /** Whether to render content with {@linkcode Static.render()}. */
    render?: Arg<Static["render"], 1>
  }?,
]

/** URL source. */
export type URLSource = [
  /** Source URL. */
  URL,
  /** Destination path (including filename). */
  string,
  /** Options. */
  {
    /** Whether to render content with {@linkcode Static.render()}. */
    render?: Arg<Static["render"], 1>
  }?,
]
