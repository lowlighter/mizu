// Imports
import { type Cache, type Directive, Phase, type Renderer } from "@mizu/mizu/core/engine"
export type * from "@mizu/mizu/core/engine"

/** `*toc` directive. */
export const _toc = {
  name: "*toc",
  phase: Phase.CONTENT,
  default: "'main'",
  init(renderer) {
    renderer.cache<Cache<typeof _toc>>(this.name, new WeakSet())
  },
  async execute(renderer, element, { attributes: [attribute], cache, ...options }) {
    if (!renderer.isHtmlElement(element)) {
      return
    }
    const { tag, value } = renderer.parseAttribute(attribute)
    if (tag === "ignore") {
      return
    }
    const target = renderer.document.querySelector<HTMLElement>(`${await renderer.evaluate(element, value || this.default, options)}`)
    if (!target) {
      return
    }
    const { level, plus, maxlevel = plus ? "Infinity" : level } = tag.match(/^(?:h(?<level>\d+)(?:(?<plus>\+)?|(?:-h(?<maxlevel>\d+))?))?$/i)?.groups ?? {} as Record<PropertyKey, string>
    const ul = headings(renderer, target, { level: Number(level ?? 1), maxlevel: Number(maxlevel ?? 6), ul: renderer.document.createElement("ul"), skip: cache })
    if (!ul.children.length) {
      return
    }
    cache.add(ul)
    element.innerHTML = ul.outerHTML
  },
} as Directive<WeakSet<HTMLUListElement>> & { default: NonNullable<Directive["default"]> }

/** Default exports. */
export default _toc

/** Generate a `<ul>` element containing all heading elements from specified level and recurse on sub-levels. */
function headings(renderer: Renderer, element: HTMLElement, { level, maxlevel, ul, skip }: { level: number; maxlevel: number; ul: HTMLUListElement; skip: Cache<typeof _toc> }) {
  const hx = Array.from(element.querySelectorAll(`h${level}[id]`)) as HTMLElement[]
  if (!hx.length) {
    return ul
  }
  for (const h of hx) {
    const a = Array.from(h.children).find((child): child is HTMLAnchorElement => child.matches('a[href*="#"]'))
    if (!a) {
      continue
    }
    const li = ul.appendChild(renderer.document.createElement("li"))
    li.appendChild(a.cloneNode(true))
    if (level + 1 <= maxlevel) {
      let element = h.parentElement!
      while ((element.tagName === "HGROUP") || (element.hasAttribute("*toc[ignore]"))) {
        element = element.parentElement!
      }
      const hy = Array.from(element.querySelectorAll(`h${level + 1}[id]`)) as HTMLElement[]
      if (hy.length) {
        const ul = li.appendChild(renderer.document.createElement("ul"))
        headings(renderer, element, { level: level + 1, maxlevel, ul, skip })
      }
    }
  }
  return ul
}
