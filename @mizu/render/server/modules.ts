// Imports
import type { Arrayable } from "@libs/typing/types"
import type { Directive } from "@mizu/internal/engine"
import _mizu from "@mizu/mizu"
import _bind from "@mizu/bind"
import _clean from "@mizu/clean"
import _code from "@mizu/code"
import _custom_element from "@mizu/custom-element"
import _eval from "@mizu/eval"
import _event from "@mizu/event"
import _for from "@mizu/for/empty"
import _html from "@mizu/html"
import _http from "@mizu/http/event"
import _if from "@mizu/if/else"
import _is from "@mizu/is"
import _markdown from "@mizu/markdown"
import _model from "@mizu/model"
import _mustache from "@mizu/mustache"
import _once from "@mizu/once"
import _ref from "@mizu/ref"
import _refresh from "@mizu/refresh"
import _set from "@mizu/set"
import _show from "@mizu/show"
import _skip from "@mizu/skip"
import _text from "@mizu/text"
import _toc from "@mizu/toc"

/** Directive modules known to the compiler, indexed by resolved specifier. */
export default {
  [import.meta.resolve("@mizu/mizu")]: _mizu,
  [import.meta.resolve("@mizu/bind")]: _bind,
  [import.meta.resolve("@mizu/clean")]: _clean,
  [import.meta.resolve("@mizu/code")]: _code,
  [import.meta.resolve("@mizu/custom-element")]: _custom_element,
  [import.meta.resolve("@mizu/eval")]: _eval,
  [import.meta.resolve("@mizu/event")]: _event,
  [import.meta.resolve("@mizu/for/empty")]: _for,
  [import.meta.resolve("@mizu/html")]: _html,
  [import.meta.resolve("@mizu/http/event")]: _http,
  [import.meta.resolve("@mizu/if/else")]: _if,
  [import.meta.resolve("@mizu/is")]: _is,
  [import.meta.resolve("@mizu/markdown")]: _markdown,
  [import.meta.resolve("@mizu/model")]: _model,
  [import.meta.resolve("@mizu/mustache")]: _mustache,
  [import.meta.resolve("@mizu/once")]: _once,
  [import.meta.resolve("@mizu/ref")]: _ref,
  [import.meta.resolve("@mizu/refresh")]: _refresh,
  [import.meta.resolve("@mizu/set")]: _set,
  [import.meta.resolve("@mizu/show")]: _show,
  [import.meta.resolve("@mizu/skip")]: _skip,
  [import.meta.resolve("@mizu/text")]: _text,
  [import.meta.resolve("@mizu/toc")]: _toc,
} as Record<string, Arrayable<Directive>>
