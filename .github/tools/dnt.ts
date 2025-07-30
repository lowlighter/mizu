// Imports
import { dirname, join, normalize } from "@std/path"
import { type TarStreamEntry, UntarStream } from "@std/tar/untar-stream"
import { Logger } from "@libs/logger"
import { assert, assertStrictEquals } from "@std/assert"
import { emptyDir, ensureDir, exists } from "@std/fs"

const name = "@mizu/render"
const version = "0.8.3"
const output = "npm"

await download(name, version, { output })

/** Download JSR package. */
async function download(name: string, version: string, { output = escape(name), registry = "https://npm.jsr.io" }) {
  let log = new Logger()
  // Clean output
  log = log.with({ name, version })
  if (await exists(output)) {
    await emptyDir(output)
  }

  // Fetch metadata
  const url = `${registry}/${encodeURIComponent(`@jsr/${escape(name)}`)}`
  log.with({ url }).info("fetching metadata")
  const meta = await fetch(url, { headers: { "content-type": "application/json" } }).then((response) => response.json())
  const dist = meta?.versions?.[version]?.dist
  assert(dist, `Could not find dist metadata for ${name}@${version}`)
  const archive = `${escape(name)}_${version}.tgz`
  const { tarball, shasum } = dist
  log.with({ tarball, shasum }).info()

  // Fetch tarball
  log.with({ tarball, path: archive }).info("fetching")
  await Deno.writeFile(archive, await fetch(tarball).then((response) => response.bytes()))
  log.with({ archive }).ok()
  using file = await Deno.open(archive)
  const buffer = new Uint8Array((await file.stat()).size)
  await file.read(buffer)
  const check = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", buffer))).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()
  assertStrictEquals(check, shasum, `Hash mismatch: ${check} ≠ ${shasum}`)
  log.with({ archive, shasum }).ok()

  // Extract tarball
  log.with({ archive }).info("extracting")
  await file.seek(0, Deno.SeekMode.Start)
  for await (const entry of file.readable.pipeThrough(new DecompressionStream("gzip")).pipeThrough(new UntarStream()) as unknown as AsyncIterable<TarStreamEntry>) {
    const path = join(output, normalize(entry.path))
    await ensureDir(dirname(path))
    await entry.readable?.pipeTo((await Deno.create(path)).writable)
    log.with({ path: entry.path }).debug(path)
  }
  log.with({ archive }).ok()
  await Deno.remove(archive)
}

/** Escape package name. */
function escape(name: string) {
  return name.replace(/^@/, "").replace("/", "__")
}
