#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --allow-write=/tmp/output
// Static Site Generation (SSG) with Mizu
// deno-lint-ignore no-external-import
import Mizu from "jsr:@mizu/render/static"

await Mizu.generate([
  // Copy content from strings
  [`<div *text="foo"></div>`, "index.html", { render: { context: { foo: "🌊 Yaa, mizu!" } } }],
  // Copy content from callback return
  [() => JSON.stringify(Date.now()), "timestamp.json"],
  // Copy content from local files
  ["**/*", "static", { directory: "/fake/path" }],
  // Copy content from URL
  [new URL("https://matcha.mizu.sh/matcha.css"), "styles.css"],
], { clean: true, output: "/tmp/output" })
