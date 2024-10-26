/**
 * Resolve dynamic imports based on the environment.
 *
 * On deno, imports are resolved with {@linkcode https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import.meta/resolve | import.meta.resolve},
 * and are expected to already be specified in the import map.
 *
 * On browsers, imports are resolved to {@linkcode https://esm.sh | esm.sh}.
 */
export function resolve(imported: string, meta?: ImportMeta) {
  if (globalThis.window)
    meta = undefined
  return meta?.resolve?.(imported) ?? `https://esm.sh/${imported.replace("@npm/", "")}`.replace("esm.sh/@", "esm.sh/jsr/@")
}