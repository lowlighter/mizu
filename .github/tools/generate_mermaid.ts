// deno-lint-ignore-file no-external-import no-console
// Import Astral
import { getBinary, launch } from "jsr:@astral/astral@0.4.8"

/* Matcha theming. */
const css = `
  #graph {
    fill: var(--default);
    font-family: Arial, sans-serif;
    font-size: 1rem;
  }

  /* Composite states */
  #graph .statediagram-cluster rect {
    fill: var(--bg-muted);
    stroke: var(--default);
  }
  #graph .statediagram-cluster.statediagram-cluster .inner {
    fill: var(--bg-default);
  }

  /* Start */
  #graph .node circle.state-start {
    stroke: var(--default);
    fill: var(--default);
  }

  /* End */
  #graph .node.default[id*=_end] g g path:first-child {
    fill: var(--default) !important;
  }
  #graph .node.default[id*=_end] g g path:last-child {
    stroke: var(--bg-default) !important;
  }

  /* Choices */
  #graph .statediagram-state path:first-child {
    fill: var(--bg-default) !important;
  }
  #graph .statediagram-state path:last-child {
    stroke: var(--default) !important;
  }

  /* Nodes */
  #graph .node rect {
    fill: var(--bg-default);
    stroke: var(--default);
  }

  /* Nodes text */
  #graph .nodeLabel {
    color: var(--default);
  }

  /* Edges */
  #graph .transition {
    stroke: var(--default);
  }

  /* Edges text */
  #graph .edgeLabel p {
    border-radius: var(--bd-radius);
    color: var(--muted);
    background: var(--bg-muted);
  }
  #graph .edgeLabel p code {
    background: var(--bg-default);
  }
`

/*** Render a mermaid diagram from an input file. */
if (import.meta.main) {
  if ((Deno.args.length === 1) && (Deno.args[0] === "--bin-path")) {
    console.log(await getBinary("chrome", { cache: ".cache" }))
    Deno.exit(0)
  }
  const [input, output, ...gargbage] = Deno.args
  if (!input) {
    throw new Error("Input file is required.")
  }
  if (!output) {
    throw new Error("Output file is required.")
  }
  if (gargbage.length) {
    throw new Error("Too many arguments.")
  }
  await Deno.writeTextFile(output, await mermaid(await Deno.readTextFile(input), { cache: ".cache" }))
}

/** Render a mermaid diagram. */
async function mermaid(content: string, options?: { cache?: string }) {
  await using browser = await launch({ cache: options?.cache, args: options?.cache ? [`--user-data-dir=${options.cache}`] : [] })
  await using page = await browser.newPage(undefined, { sandbox: true })
  page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <main></main>
        <script type="module">
          import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
          mermaid.initialize({ startOnLoad: false, fontSize: 18 })
          const { svg } = await mermaid.render("graph", atob("${btoa(content)}"))
          document.querySelector("main").innerHTML = svg
          document.querySelector("main svg style").textContent += atob("${btoa(css)}")
        </script>
      </body>
    </html>
  `.trim())
  await page.waitForNetworkIdle()
  await page.waitForSelector("main svg")
  return `${await page.evaluate("document.querySelector('main svg')?.outerHTML")}`
}
