/**
 * Checks whether an HTML attribute is a boolean attribute for the specified tag name.
 *
 * See {@link https://html.spec.whatwg.org/#attributes-3 | HTML attributes reference}.
 */
export function boolean(tagname: string, attribute: string): boolean {
  if (/^autofocus|inert|itemscope$/.test(attribute)) {
    return true
  }
  if (attribute === "disabled") {
    return /^(?:BUTTON|INPUT|OPTGROUP|OPTION|SELECT|TEXTAREA|FIELDSET|LINK)$/.test(tagname)
  }
  switch (tagname) {
    // Form elements
    case "FORM":
      return attribute === "novalidate"
    case "TEXTAREA":
      return /^(?:readonly|required)$/.test(attribute)
    case "INPUT":
      if (/^(?:checked|formnovalidate|readonly)$/.test(attribute)) {
        return true
      }
      // fallthrough
    case "SELECT":
      return /^(?:multiple|required)$/.test(attribute)
    case "OPTION":
      return attribute === "selected"
    case "BUTTON":
      return attribute === "formnovalidate"

    // Media elements
    case "IMG":
      return attribute === "ismap"
    case "VIDEO":
      if (attribute === "playsinline") {
        return true
      }
      // fallthrough
    case "AUDIO":
      return /^(?:autoplay|controls|loop|muted)$/.test(attribute)
    case "TRACK":
      return attribute === "default"

    // Other elements
    case "TEMPLATE":
      return /^shadowroot(?:delegatesfocus|clonable|serializable)$/.test(attribute)
    case "SCRIPT":
      return /^(?:async|defer|nomodule)$/.test(attribute)
    case "IFRAME":
      return attribute === "allowfullscreen"
    case "OL":
      return attribute === "reversed"
    case "DETAILS":
    case "DIALOG":
      return attribute === "open"
  }
  return false
}
