// Imports
import type { VirtualWindow } from "@mizu/mizu/core/engine"
import { JSDOM } from "@npm/jsdom"
export type { VirtualWindow }

/**
 * Virtual {@linkcode https://developer.mozilla.org/docs/Web/API/Window | Window} implementation based on {@link https://github.com/jsdom/jsdom | JSDOM}.
 *
 * @example
 * ```ts
 * await using window = new Window("<html></html>")
 * console.assert(window.document.documentElement.tagName === "HTML")
 * ```
 */
const Window = (function (content: string) {
  const { window } = new JSDOM(content, { url: globalThis.location?.href, contentType: "text/html" })
  window[Symbol.asyncDispose] = async () => {
    await window.close()
  }
  return window
}) as unknown as (new (content?: string) => VirtualWindow)
export { Window }
