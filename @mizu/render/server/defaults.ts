// Imports
import type { Directive } from "../engine/mod.ts"
import _mizu from "@mizu/mizu"
import _bind from "@mizu/bind"
import _clean from "@mizu/clean"
import _code from "@mizu/code"
import _custom_element from "@mizu/custom-element"
import _eval from "@mizu/eval"
import _for from "@mizu/for/empty"
import _html from "@mizu/html"
import _http from "@mizu/http"
import _if from "@mizu/if/else"
import _is from "@mizu/is"
import _markdown from "@mizu/markdown"
import _mustache from "@mizu/mustache"
import _once from "@mizu/once"
import _ref from "@mizu/ref"
import _set from "@mizu/set"
import _show from "@mizu/show"
import _skip from "@mizu/skip"
import _text from "@mizu/text"
import _toc from "@mizu/toc"

/** Defaults directives. */
export default [
  _mizu,
  _bind,
  _clean,
  _code,
  _custom_element,
  _eval,
  _for,
  _html,
  _http,
  _if,
  _is,
  _markdown,
  _mustache,
  _once,
  _ref,
  _set,
  _show,
  _skip,
  _text,
  _toc,
].flat(Infinity) as Directive[]
