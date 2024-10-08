// Imports
import type { Directive as _Directive } from "./directive.ts"

/**
 * Enum representing all possible value that a {@linkcode _Directive | Directive.phase} can have.
 *
 * For more information, see the {@link https://mizu.sh/#concept-phase | mizu.sh documentation}.
 */
export enum Phase {
  /** Placeholder value (intended for internal use only). @internal */
  UNKNOWN = NaN,

  // 0X - Preprocessing ————————————————————————————————————————————————————————————————————————————————

  /** Directives that contain only metadata. */
  META = 0,

  /** Directives that determine the rendering eligibility of an element. */
  ELIGIBILITY = 1,

  /** Directives that must be executed first as they influence the rendering process. */
  PREPROCESSING = 2,

  // 10 - Testing ——————————————————————————————————————————————————————————————————————————————————————

  /** Placeholder value (intended for testing use only). @internal */
  TESTING = 10,

  // 1X - Context ——————————————————————————————————————————————————————————————————————————————————————

  /** Directives that alter the rendering context. */
  CONTEXT = 11,

  // 2X - Transforms ———————————————————————————————————————————————————————————————————————————————————

  /** Directives that expand elements. */
  EXPAND = 21,
  /** Directives that morph elements. */
  MORPHING = 22,
  /** Directives that toggle elements. */
  TOGGLE = 23,

  // 3X - HTTP —————————————————————————————————————————————————————————————————————————————————————————

  /** HTTP directives that set headers. */
  HTTP_HEADER = 31,
  /** HTTP directives that set the body. */
  HTTP_BODY = 32,
  /** HTTP directives that perform requests. */
  HTTP_REQUEST = 33,
  /** HTTP directives that set content. */
  HTTP_CONTENT = 34,
  /** HTTP directives that add interactivity. */
  HTTP_INTERACTIVITY = 35,

  // 4X - Content ——————————————————————————————————————————————————————————————————————————————————————

  /** Directives that set content. */
  CONTENT = 41,

  /** Directives that clean content. */
  CONTENT_CLEANING = 49,

  // 5X - Attributes ———————————————————————————————————————————————————————————————————————————————————

  /** Directives that set attributes. */
  ATTRIBUTE = 51,
  /** Directives that model value attributes. */
  ATTRIBUTE_MODEL_VALUE = 52,

  /** Directives that clean attributes. */
  ATTRIBUTE_CLEANING = 59,

  // 6X - Interactivity ————————————————————————————————————————————————————————————————————————————————

  /** Directives that enhance element interactivity. */
  INTERACTIVITY = 61,

  // 7X - Styling ——————————————————————————————————————————————————————————————————————————————————————

  /** Directives that affect display. */
  DISPLAY = 71,

  // 8X - Others ———————————————————————————————————————————————————————————————————————————————————————

  /** Directives that register custom elements. */
  CUSTOM_ELEMENT = 81,
  /** Directives that register references. */
  REFERENCE = 82,

  /** Directives that apply custom processing logic. */
  CUSTOM_PROCESSING = 89,

  // 9X - Postprocessing ———————————————————————————————————————————————————————————————————————————————

  /** Directives that must be executed last as they influence the rendering process. */
  POSTPROCESSING = 99,
}
