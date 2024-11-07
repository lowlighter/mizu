// Imports
import type { Arg } from "@libs/typing"
import type { ClassMethodDef, DocNodeClass, DocNodeInterface, JsDoc, ParamDef, TsTypeDef } from "@deno/doc"
import { fromFileUrl } from "@std/path"
import { pick } from "@std/collections"
import * as JSONC from "@std/jsonc"
import { bundle } from "@libs/bundle/ts"
import { Logger } from "@libs/logger"
import { doc } from "@deno/doc"
import Mizu from "@mizu/render/server"
const log = new Logger()

/** JSR package pattern. */
const jsr = /^(?<package>@[a-z0-9][-a-z0-9]*[a-z0-9]\/[a-z0-9][-a-z0-9]*[a-z0-9])(\/(?<name>.*))?$/

/** Base project url. */
const base = import.meta.resolve("../")

/** Root project path. */
const root = fromFileUrl(base)

/** Project metadata. */
const meta = {
  ...pick(await config("@mizu/mizu"), ["name", "version"]),
  ...pick(await config("."), ["homepage", "license", "author"]),
}
log.with({ root, base }).debug()
log.with(meta).info()

/** License banner. */
const banner = [
  `${meta.name} — ${meta.version}`,
  `Copyright © ${new Date().getFullYear()} ${meta.author}`,
  `${meta.license} license — ${meta.homepage}`,
].join("\n")

/** Parse `deno.jsonc` of specified package. */
function config(name: string, options: { parse: false }): URL
function config(name: string, options?: { parse: true }): Promise<Record<PropertyKey, unknown>>
function config(name: string, { parse = true } = {} as { parse?: boolean }) {
  const url = new URL(`./${name}/deno.jsonc`, base)
  if (parse) {
    return fetch(url.href).then((response) => response.text()).then((text) => JSONC.parse(text) as Record<PropertyKey, unknown>)
  }
  return url
}

/** Generate JS. */
export function js(exported: string, options = {} as Pick<NonNullable<Arg<typeof bundle, 1>>, "format"> & { raw?: Record<PropertyKey, unknown> }) {
  const packaged = exported.match(jsr)?.groups?.package ?? exported
  const url = import.meta.resolve(exported)
  log.with({ package: packaged, url }).debug("bundling javascript")
  if (options?.format === "iife") {
    options.raw ??= {}
    options.raw.target = "es2020"
    options.raw.define = { "import.meta.main": "true" }
  }
  return bundle(new URL(url), { ...options, banner })
}

/** Render HTML. */
export async function html(page: string) {
  Mizu.context = { page }
  log.with({ context: Mizu.context }).debug("rendering html")
  return Mizu.render(await fetch(import.meta.resolve("./html/index.html")).then((response) => response.text()), {warn:() => null})
}

/** Generate documentation for an exported class. */
export async function docs(path: string, { kind, name: exported }: { kind: "class" | "interface"; name: string }) {
  const { package: packaged, name } = path.match(jsr)?.groups ?? {}
  const nodes = await doc(import.meta.resolve(path))
  if (kind === "interface") {
    return nodes.filter((node): node is DocNodeInterface => (node.kind === "interface") && (node.name === exported))
      .flatMap((node) => [
        ...node.interfaceDef.properties.map((leaf) => ({
          name: leaf.name,
          signature: {
            name: `${node.name}${leaf.optional ? "?" : ""}.${leaf.name}`,
            args: `: ${type(leaf.tsType)}`,
          },
          documentation: jsdoc({ packaged, name }, leaf.jsDoc),
          readonly: leaf.readonly,
        })),
      ])
  }
  return nodes.filter((node): node is DocNodeClass => (node.kind === "class") && (node.name === exported))
    .flatMap((node) => [
      ...node.classDef.constructors.map((leaf) => ({
        name: leaf.name,
        signature: {
          name: `${node.name}.${leaf.name}`,
          args: `(${leaf.params.map(param).join(", ")})`,
        },
        documentation: jsdoc({ packaged, name }, leaf.jsDoc),
      })),
      ...node.classDef.properties.map((leaf) => ({
        name: leaf.name,
        signature: {
          name: `${node.name}.${leaf.name}`,
          args: `: ${type(leaf.tsType)}`,
        },
        documentation: jsdoc({ packaged, name }, leaf.jsDoc),
        readonly: leaf.readonly,
        static: leaf.isStatic,
      })),
      ...node.classDef.methods.filter((subnode) => ["getter", "method"].includes(subnode.kind)).map((leaf) => ({
        name: leaf.name,
        signature: {
          name: `${node.name}.${leaf.name}`,
          args: method(leaf),
        },
        documentation: jsdoc({ packaged, name }, leaf.jsDoc),
      })),
    ])
}

/** Generate documentation from JSDoc. */
function jsdoc({ packaged, name }: { packaged: string; name: string }, def?: JsDoc) {
  return def?.doc
    ?.replace(/\[!NOTE\]/, "")
    ?.replace(/\[!IMPORTANT\]/, "")
    ?.replace(/{@linkcode (?<link>[^|}]*?) \| (?<text>[^}]*?)}/g, `[\`$<text>\`]($<link>)`)
    ?.replace(/{@linkcode (?<text>[^}]*?)}/g, `[\`$<text>\`](https://jsr.io/${packaged}/doc/${name}/~/$<text>)`) ?? ""
}

/** Generate method signature. */
function method(def: ClassMethodDef) {
  switch (def.kind) {
    case "getter":
      return `: ${type(def.functionDef.returnType)}`
    default:
      return `(${def.functionDef.params.map(param).join(", ")}) => ${type(def.functionDef.returnType)}`
  }
}

/** Generate parameter signature. */
function param(def?: ParamDef): string {
  switch (def?.kind) {
    case "identifier":
      return `${def.name}${def.optional ? "?" : ""}: ${type(def?.tsType)}`
    case "assign":
      return param(def.left) || "options"
    case "object":
      return "options"
  }
  log.warn("param", def)
  return ""
}

/** Generate type signature. */
function type(def?: TsTypeDef): string {
  switch (def?.kind) {
    case "typeRef":
      return `${def.typeRef.typeName}${def.typeRef.typeParams ? `<${def.typeRef.typeParams.map(type).join(def.typeRef.typeParams.some(({ kind }) => kind === "union") ? "" : ", ")}>` : ""}`
    case "union":
      return def.union.map(type).join(" | ")
    case "intersection":
      return def.intersection.map(type).join(" & ")
    case "keyword":
      return def.keyword
    case "array":
      return `${type(def.array)}[]`
    case "indexedAccess":
      return `${type(def.indexedAccess.objType)}[${type(def.indexedAccess.indexType)}]`
    case "literal":
      switch (def.literal.kind) {
        case "string":
          return `"${def.literal.string}"`
        default:
          return `${def.literal[def.literal.kind as keyof typeof def.literal]}`
      }
    case "typeQuery":
      return `${def.typeQuery}`
    case "typeLiteral":
      return `{ ${def.typeLiteral.properties.map((property) => `${property.name}: ${type(property.tsType)}`)} }`
    case "typePredicate":
      return `${def.repr}`
    case "this":
      return `${def.repr}`
    case "fnOrConstructor":
      return "Function"
    case undefined:
      return ""
  }
  log.warn("type", def)
  return ""
}
