// Imports
import type { Nullable, Renderer } from "@mizu/internal/engine"
export type * from "@mizu/internal/engine"

/** Attribute and closing marker used to preserve the elements commented out by a server-side render. */
export const hydratable = "data-mizu" as const

/**
 * Restore the elements commented out by a server-side render so they can be rendered again.
 *
 * Elements preserved in a `<template data-mizu>` are commented out again, and the nodes generated after them are discarded.
 */
export function hydrate(renderer: Renderer, element: HTMLElement): void {
  for (const template of Array.from(element.querySelectorAll(`template[${hydratable}]`)) as HTMLTemplateElement[]) {
    const { directive, expression } = `${template.getAttribute(hydratable)}`.match(/^\[(?<directive>[^=]+)="(?<expression>[\s\S]*)"\]$/)?.groups ?? {}
    const original = template.content.firstElementChild as Nullable<HTMLElement>
    if ((!directive) || (!original) || (!template.parentNode)) {
      continue
    }
    for (let node = template.nextSibling as Nullable<ChildNode>; node;) {
      const next = node.nextSibling
      const marker = (renderer.isComment(node as unknown as Comment)) && ((node as unknown as Comment).data === `[/${hydratable}]`)
      node.remove()
      if (marker) {
        break
      }
      node = next
    }
    template.replaceWith(original)
    renderer.comment(original, { directive, expression })
  }
}
