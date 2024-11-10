// Imports
import type { Directive } from "@mizu/internal/engine"
import _mizu from "@mizu/mizu"
import _bind from "@mizu/bind"
import _custom_element from "@mizu/custom-element"
import _eval from "@mizu/eval"
import _event from "@mizu/event"
import _for from "@mizu/for/empty"
import _html from "@mizu/html"
import _http from "@mizu/http/event"
import _if from "@mizu/if/else"
import _model from "@mizu/model"
import _mustache from "@mizu/mustache"
import _once from "@mizu/once"
import _ref from "@mizu/ref"
import _refresh from "@mizu/refresh"
import _set from "@mizu/set"
import _show from "@mizu/show"
import _skip from "@mizu/skip"
import _text from "@mizu/text"

/** Defaults directives. */
export default [
  _mizu,
  _bind,
  _custom_element,
  _eval,
  _event,
  _for,
  _html,
  _http,
  _if,
  _model,
  _mustache,
  _once,
  _ref,
  _refresh,
  _set,
  _show,
  _skip,
  _text,
].flat(Infinity) as Directive[]
