// Imports
import type { Arg, Arrayable, Context, Promisable, Renderer } from "@mizu/internal/engine"
import { Logger } from "@libs/logger"
import { expandGlob } from "@std/fs"
import { common, dirname, join, resolve } from "@std/path"
import { readAll, readerFromStreamReader } from "@std/io"
import { Mizu as Server } from "../server/mod.ts"
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
   *   { mkdir: () => null as any, write: () => null as any },
   * )
   * ```
   */
  async generate(
    contents: Array<StringSource | GlobSource | CallbackSource | URLSource>,
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
    for (const [source, destination, options = {}] of contents) {
      const path = join(output, destination)
      log.with({ path }).debug("writing...")
      // Copy content from URL
      if (source instanceof URL) {
        const bytes = await fetch(source).then((response) => response.bytes())
        await write(path, await this.#render(bytes, options.render))
        log.with({ path }).ok()
      } // Copy content from callback
      else if (typeof source === "function") {
        let bytes = await source()
        if (typeof bytes === "string") {
          bytes = encoder.encode(bytes)
        }
        await write(path, await this.#render(bytes, options.render))
        log.with({ path }).ok()
      } // Copy content from local files
      else if ("directory" in options) {
        const root = `${options.directory}`
        const sources = [source].flat()
        for (const source of sources) {
          for await (const { path: from } of expandGlob(source, { root, includeDirs: false })) {
            const path = join(output, from.replace(common([root, from]), ""))
            await mkdir(dirname(path), { recursive: true })
            await write(path, await this.#render(await read(from), options.render))
            log.with({ path }).ok()
          }
        }
      } // Copy content from string
      else {
        await write(path, await this.#render(encoder.encode(source as string), options.render))
        log.with({ path }).ok()
      }
    }
    log.ok("done!")
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
  () => Promisable<Arg<NonNullable<GenerateOptions["write"]>, 1> | string>,
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
