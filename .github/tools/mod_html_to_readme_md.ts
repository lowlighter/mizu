// Imports
import type { rw } from "@libs/typing/types"
import { Window } from "@mizu/internal/vdom"
import { dirname, fromFileUrl, join } from "@std/path"
import { expandGlob } from "@std/fs"
import * as JSONC from "@std/jsonc"
import { Logger } from "@libs/logger"
import { command } from "@libs/run/command"
import server from "@www/serve.ts"
const window = new Window()
const log = new Logger()

/*** Generate documentation for modules. */
if (import.meta.main) {
  // Directives
  for await (const { path: source } of expandGlob("**/mod.html", { root: Deno.args[0], includeDirs: false })) {
    const destination = join(dirname(source), "README.md")
    await Deno.writeTextFile(destination, await htmlToMd(await Deno.readTextFile(source)))
    await command("deno", ["fmt", destination], { stdout: null, stderr: null })
    log.with({ source, destination }).ok("done")
  }

  // Special cases
  for await (const { path: source } of expandGlob("**/deno.jsonc", { root: Deno.args[0], includeDirs: false })) {
    const jsonc = JSONC.parse(await Deno.readTextFile(source)) as rw
    if ((jsonc.name === "@mizu/render") || ("workspace" in jsonc)) {
      const destination = join(dirname(source), "README.md")
      await Deno.writeTextFile(destination, await mdWithHtmlInclude(destination))
      await command("deno", ["fmt", destination], { stdout: null, stderr: null })
      log.with({ source, destination }).ok("done")
    }
  }
}

/** Read markdown file and include HTML content. */
export async function mdWithHtmlInclude(path: string) {
  const content = await Deno.readTextFile(path)
  return content
    .replace(/(?<open><!-- (?<include>@mizu\/[\/.\w]+\.html) -->)[\s\S]*(?<close><!-- \k<include> -->)/g, (_, open, include, close) => {
      const html = Deno.readTextFileSync(join(fromFileUrl(import.meta.resolve("../../")), include.replace("@mizu/", "")))
      const window = new Window(`<body>${html}</body>`)
      const markdown = toMarkdown(window.document.querySelector("body")).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      window.close()
      return `${open}\n\n${markdown}\n\n${close}`
    })
}

/** Convert `<mizu-directive>` documentation from HTML to markdown. */
export async function htmlToMd(html: string) {
  await using window = new Window(`<body>${html}</body>`)
  return Array.from(
    await Promise.all(
      Array.from(window.document.querySelectorAll("mizu-directive")).map(async (directive) => {
        // Directive name, metatada, description and examples
        const content = [`# ${toMarkdown(directive.querySelector("[\\#name]"))}`]
        const metadata = await (await server.fetch(new Request(`https://mizu.invalid/about/directives/${directive.getAttribute("directory")}?name=${directive.getAttribute("id")}`, { headers: { accept: "application/json" } }))).json()
        const table = ["| Version | Phase |", "| --- | --- |", `| ![](https://jsr.io/badges/@mizu/${directive.getAttribute("directory")}) | ${metadata.phase.value} — \`${metadata.phase.name}\` |`]
        if ("default" in metadata) {
          table[0] += " Default |"
          table[1] += " --- |"
          table[2] += ` \`${metadata.default}\` |`
        }
        if ("multiple" in metadata) {
          table[0] += " Multiple |"
          table[1] += " --- |"
          table[2] += ` ${metadata.multiple ? "Yes" : "No"} |`
        }
        content.push(table.join("\n"))
        content.push(toMarkdown(Array.from(directive.querySelectorAll("[\\#description]"))))
        directive.querySelectorAll("[\\#example]").forEach((example) => content.push(`\`\`\`html\n${unindent(example.innerHTML.replace(/=""/g, "")).trim()}\n\`\`\``))

        // Notes
        if (directive.querySelector("[\\#note]")) {
          content.push("## Notes")
          directive.querySelectorAll("[\\#note]").forEach((note) => content.push(toMarkdown(note)))
        }

        // Variables
        if (directive.querySelector("[\\#variable]")) {
          content.push("## Variables")
          directive.querySelectorAll("[\\#variable]").forEach((variable) => {
            const name = variable.getAttribute("name")
            const type = variable.querySelector("[\\#type]")
            if (type) {
              variable.removeChild(type)
              variable.innerHTML = `${variable.innerHTML}`
            }
            content.push(`### \`${name ?? ""}: ${type?.textContent ?? "unknown"}\``)
            content.push(toMarkdown(Array.from(variable.childNodes)))
          })
        }

        // Modifiers
        if (directive.querySelector("[\\#modifier]")) {
          content.push("## Modifiers")
          directive.querySelectorAll("[\\#modifier]").forEach((modifier) => {
            let name = modifier.getAttribute("name")
            const type = modifier.querySelector("[\\#type]")
            if (type) {
              modifier.removeChild(type)
              modifier.innerHTML = `${modifier.innerHTML}`
            }
            if (name === "..") {
              name = "..."
            } else if (name) {
              const typings = metadata.typings.modifiers[name] ?? {}
              const defaults = `${
                ("default" in typings) ? ((typings.type ?? "string") === "string" ? `"${typings.default}"` : typings.default) : typings.allowed ? typings.allowed[0] : ({ boolean: true, duration: 0, number: 0, string: "" } as Record<PropertyKey, unknown>)[typings.type]
              }${({ duration: "ms" } as Record<PropertyKey, string>)[typings.type] ?? ""}`
              name = `.${name}[${typings.allowed ? typings.allowed.map((v: string) => `"${v}"`).join(" | ") : typings.type ?? "string"}${("default" in typings) || (typings.enforce) ? `${typings.type === "duration" ? "≈" : "="}${defaults}` : ""}]`
            } else {
              name = `[${type?.textContent ?? "string"}]`
            }
            content.push(`### \`${name}\``)
            content.push(toMarkdown(Array.from(modifier.childNodes)))
          })
        }
        return content.join("\n\n")
      }),
    ),
  ).join("\n\n")
}

/** Convert elements to markdown. */
function toMarkdown(elements: Array<Node> | Node | null, markdown = "") {
  ;[elements].flat().filter((element): element is Node => Boolean(element)).forEach((element, i, a) => {
    // Format text nodes
    if (element.nodeType === window.Node.TEXT_NODE) {
      const node = element as Text
      if (node.textContent?.trim()) {
        let text = node.textContent
        if (i === 0) {
          text = text.trimStart()
        }
        if (i === a.length - 1) {
          text = text.trimEnd()
        }
        if (a[i + 1]?.nodeType === window.Node.ELEMENT_NODE) {
          text = `${text.trimEnd()} `
        }
        markdown += text
      }
    } // Convert element nodes to markdown
    else if (element.nodeType === window.Node.ELEMENT_NODE) {
      const node = element as HTMLElement
      switch (node.tagName) {
        // Ignore
        case "WBR":
          break
        // New line
        case "BR":
          markdown += "\\"
          break
        // Heading
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
          markdown += `\n${"#".repeat(Number(node.tagName[1]))} ${toMarkdown(Array.from(node.childNodes))}\n\n`
          break
        // Code blocks
        case "PRE": {
          if (node.querySelector("code")) {
            const language = Array.from(node.querySelectorAll("*"))
              .flatMap((child) => Array.from(child.attributes))
              .find((attr) => attr.name.startsWith("*code"))?.name.match(/\[(.*)\]/)?.[1] ?? ""
            markdown += `\n\`\`\`${language}\n${unindent(node.textContent)}\n\`\`\`\n`
            break
          }
        }
        /* falls through */
        // Block
        case "DIV": {
          if (node.classList.contains("flash")) {
            const type = node.classList.contains("attention") ? "WARNING" : "NOTE"
            markdown += prefix(`[!${type}]\n\n${toMarkdown(Array.from(node.childNodes))}`, "> ")
            break
          }
        }
        /* falls through */
        case "BODY":
        case "SECTION":
        case "P":
          markdown += `${toMarkdown(Array.from(node.childNodes))}\n\n`
          break
        // Content
        case "UL":
        case "SPAN":
        case "SMALL":
        case "ABBR":
          markdown += toMarkdown(Array.from(node.childNodes))
          break
        // Code
        case "CODE":
        case "VAR":
          markdown += `\`${toMarkdown(Array.from(node.childNodes))}\``
          break
        // Italic (or swapped icons)
        case "I":
          if (node.hasAttribute("%response.swap")) {
            const icon = node.getAttribute("%http")?.match(/\/([-\w]+)-16\.svg$/)?.[1] ?? ""
            const emoji = { rocket: "🍜", "project-symlink": "🍤", "ai-model": "🍣", "code-review": "🍱", apps: "🥡", "code-of-conduct": "🍙" }[icon] ?? ""
            markdown += emoji
            if (node.nextSibling?.nodeType === window.Node.TEXT_NODE) {
              node.nextSibling.textContent = ` ${node.nextSibling.textContent?.trimStart()}`
            }
            break
          }
          markdown += `*${toMarkdown(Array.from(node.childNodes))}*`
          break
        // Bold
        case "B":
        case "STRONG":
          markdown += `**${toMarkdown(Array.from(node.childNodes))}**`
          break
        // Italic and bold
        case "EM":
          markdown += `***${toMarkdown(Array.from(node.childNodes))}***`
          break
        // Quote
        case "Q":
          markdown += `« ${toMarkdown(Array.from(node.childNodes))} »`
          break
        // Link
        case "A":
          markdown += `[${toMarkdown(Array.from(node.childNodes))}](${node.getAttribute("href")})`
          break
        // Image
        case "IMG":
          markdown += `![${node.getAttribute("alt") ?? ""}](${node.getAttribute("src")})`
          break
        // List
        case "LI": {
          let depth = 0
          let element = node.parentElement
          while (element) {
            depth += /ul/i.test(`${element?.tagName}`) ? 1 : 0
            element = element.parentElement
          }
          Array.from(node.childNodes).filter((node): node is Text => node.nodeType === window.Node.TEXT_NODE).forEach((text) => text.textContent = text.textContent!.replaceAll(/\s+/g, " "))
          markdown += `\n${"  ".repeat(Math.max(0, depth - 1))}- ${toMarkdown(Array.from(node.childNodes))}`
          break
        }
        // Callouts
        case "MIZU-NOTE":
        case "MIZU-WARN":
        case "MIZU-RESTRICTION":
        case "MIZU-TBD":
        case "MIZU-IMPORT": {
          const type = { "MIZU-NOTE": "NOTE", "MIZU-TBD": "NOTE", "MIZU-WARN": "WARNING", "MIZU-RESTRICTION": "CAUTION", "MIZU-IMPORT": "IMPORTANT" }[node.tagName]
          markdown += prefix(`[!${type}]\n${toMarkdown(Array.from(node.childNodes))}`, "> ")
          break
        }
        default:
          log.with({ tag: node.tagName }).error("Unknown tag")
          markdown += toMarkdown(Array.from(node.childNodes))
      }
    }
  })
  return markdown
}

/** Prefix all lines. */
function prefix(content: string, prefix: string) {
  return content.split("\n").map((line) => `${prefix}${line}`).join("\n")
}

/** Unindent element. */
function unindent(content: string | null) {
  content ??= ""
  const trim = content.match(/^[ \t]*\S/m)?.[0].match(/\S/)?.index ?? 0
  content = content.replaceAll(new RegExp(`^[ \\t]{${trim}}`, "gm"), "")
  return content
}
