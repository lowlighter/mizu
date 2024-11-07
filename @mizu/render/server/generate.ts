// Imports
import type { Arg, Arrayable, Promisable } from "@mizu/internal/engine"
import type { Server, ServerGenerateFileSystemOptions as FileSystemOptions, ServerGenerateOptions as GenerateOptions } from "./server.ts"
import { expandGlob } from "@std/fs"
import { common, dirname, join, resolve } from "@std/path"
import { readAll, readerFromStreamReader } from "@std/io"
import { Buffer } from "@node/buffer"

/** Text encoder. */
const encoder = new TextEncoder()

/** Text decoder. */
const decoder = new TextDecoder()

/** Used by {@linkcode Server.generate()} to generate content. */
export async function generate(server: Server, sources: Array<StringSource | GlobSource | CallbackSource | URLSource>, { output, clean, fs } = {} as Omit<Required<GenerateOptions>, "fs"> & { fs: Required<FileSystemOptions> }): Promise<void> {
  // Prepare output directory
  output = resolve(output)
  if ((await Promise.resolve(fs.stat(output)).then(() => true).catch(() => false)) && clean) {
    await fs.rmdir(output, { recursive: true })
  }
  await fs.mkdir(output, { recursive: true })

  // Generate files
  for (const [source, destination, options = {}] of sources) {
    const path = join(output, destination)
    // Copy content from URL
    if (source instanceof URL) {
      const bytes = await fetch(source).then((response) => response.bytes())
      await fs.write(path, await render(server, Buffer.from(bytes), options.render))
    } // Copy content from callback
    else if (typeof source === "function") {
      let bytes = await source()
      if (typeof bytes === "string") {
        bytes = Buffer.from(encoder.encode(bytes))
      }
      await fs.write(path, await render(server, bytes, options.render))
    } // Copy content from local files
    else if ("directory" in options) {
      const root = `${options.directory}`
      const sources = [source].flat()
      for (const source of sources) {
        for await (const { path: from } of expandGlob(source, { root, includeDirs: false })) {
          const path = join(output, from.replace(common([root, from]), ""))
          await fs.mkdir(dirname(path), { recursive: true })
          await fs.write(path, await render(server, await fs.read(from), options.render))
        }
      }
    } // Copy content from string
    else {
      await fs.write(path, await render(server, Buffer.from(encoder.encode(source as string)), options.render))
    }
  }
}

/** Used by {@linkcode generate()} to render content. */
async function render(server: Server, content: Arg<NonNullable<FileSystemOptions["write"]>, 1>, render?: Arg<Server["render"], 1>): Promise<Arg<NonNullable<FileSystemOptions["write"]>, 1>> {
  if (render) {
    if (content instanceof ReadableStream) {
      content = Buffer.from(await readAll(readerFromStreamReader(content.getReader())))
    }
    const rendered = await server.render(decoder.decode(content), render)
    content = Buffer.from(encoder.encode(rendered))
  }
  return content
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
    render?: Arg<Server["render"], 1>
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
    render?: Arg<Server["render"], 1>
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
    render?: Arg<Server["render"], 1>
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
    render?: Arg<Server["render"], 1>
  }?,
]
