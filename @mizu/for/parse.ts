// Imports
import type { Optional } from "@libs/typing"

/**
 * Expression parser for loops content.
 *
 * Parse any valid expression that can be evaluated in EcmaScript by `for (<expression>)` syntax.
 *
 * This simple AST does not guarantee syntax validity (which will be enforced by runtime anyways),
 * but it should be able to extract any defined identifiers, whether they're initialized through destructuring, spreading, aliasing, etc.
 *
 * {@link https://tc39.es/ecma262/#sec-for-statement | Reference}
 *
 * ```ts
 * import { Expression } from "./parse.ts"
 *
 * const identifiers = Expression.parse("const {a, b:c} of []")
 * console.assert(identifiers.join(",") === ["a", "c"].join(","))
 * ```
 *
 * @author Simon Lecoq (lowlighter)
 * @license MIT
 */
export class Expression {
  /** Parse expression. */
  static parse(expression: string) {
    return new Expression(expression).#parse()
  }

  /** Constructor. */
  private constructor(expression: string) {
    this.#expression = expression.trim()
    this.#identifiers = [] as string[]
  }

  /** Expression. */
  #expression

  /** Collected identifiers. */
  #identifiers

  /** Parse expressions. */
  #parse() {
    if (!this.#peek(";")) {
      this.#consume(/^(?:let|const|var) /)
      if (!this.#nested()) {
        this.#identifiers.push(this.#identifier({ assignment: false }))
        // Handle regular `for` loops
        if (this.#peek("=")) {
          this.#value(/^[\s\S]*?(?=[,;])/)
          while (this.#peek(",")) {
            this.#consume(",")
            this.#identifiers.push(this.#identifier({ value: /^[\s\S]*?(?=[,;])/ }))
          }
          this.#consume(/;[\s\S]*;[\s\S]*$/)
        } // Handle `for..of` and `for..in`
        else {
          this.#consume(/^(?:of|in) /)
        }
      }
    }
    return this.#identifiers
  }

  /** Consume identifier. */
  #identifier({ assignment = true, value = undefined as Optional<RegExp> } = {}) {
    const identifier = this.#consume(/^([\p{L}$_][\p{L}\p{N}$_]*)/u)
    if (assignment) {
      this.#value(value)
    }
    return identifier
  }

  /** Consume array. */
  #array() {
    this.#consume("[")
    while (!this.#peek("]")) {
      this.#consume(",", { optional: true })
      if (this.#spreading()) {
        break
      }
      if (this.#nested()) {
        continue
      }
      this.#identifiers.push(this.#identifier())
    }
    this.#consume("]")
    return true
  }

  /** Consume object. */
  #object() {
    this.#consume("{")
    while (!this.#peek("}")) {
      this.#consume(",", { optional: true })
      if (this.#spreading()) {
        break
      }
      // Handle computed properties
      if (this.#peek("[")) {
        this.#group()
        this.#consume(":")
        if (!this.#nested()) {
          this.#identifiers.push(this.#identifier())
        }
      } // Handle regular properties
      else {
        let identifier = this.#identifier()
        if (this.#peek(":")) {
          this.#consume(":")
          if (this.#nested()) {
            continue
          }
          identifier = this.#identifier()
        }
        this.#identifiers.push(identifier)
      }
    }
    this.#consume("}")
    return true
  }

  /** Consume nested element. */
  #nested() {
    if (this.#peek("[")) {
      return this.#array()
    }
    if (this.#peek("{")) {
      return this.#object()
    }
    return false
  }

  /** Consume value. */
  #value(value = /^[\s\S]*?(?=[,\]}])/) {
    if (!this.#peek("=")) {
      return false
    }
    this.#consume("=")
    let f = false
    // Handle regular functions
    if (this.#peek(/^(?:async\s+)?function(?:\s*\*)?\s*\(/)) {
      this.#consume(/^(?:async\s+)?function(?:\s*\*)?/)
      f = true
      this.#group(/^(\()/)
      this.#group(/^(\{)/)
    } // Handle rrow functions
    else if (this.#peek(/^async\s+\(/)) {
      this.#consume("async")
      f = true
    }
    if (this.#peek("(")) {
      this.#group(/^(\()/)
      if (this.#peek("=>")) {
        this.#consume("=>")
        this.#group()
        f = true
      }
    }
    while ((!f) && (this.#group())) {
      // Continue capturing groups to match case like {foo:"bar"}[i], (x => y)(), etc.
    }
    this.#consume(value)
    return true
  }

  /** Consume spreading. */
  #spreading() {
    if (this.#peek("...")) {
      this.#consume("...")
      this.#identifiers.push(this.#identifier({ assignment: false }))
      return true
    }
    return false
  }

  /** Consume group. */
  #group(opener = /^([({[])/) {
    if (!this.#peek(opener)) {
      return false
    }
    const open = this.#consume(opener)
    const close = { "(": ")", "{": "}", "[": "]" }[open] as string
    for (let i = 0; (i < this.#expression.length) && (close !== this.#expression[i]); i++) {
      if (opener.test(this.#expression[i])) {
        this.#expression = this.#expression.slice(i)
        this.#group()
        break
      }
    }
    this.#expression = this.#expression.slice(this.#expression.indexOf(close) + 1).trim()
    return true
  }

  /** Peek at next token. */
  #peek(token: RegExp | string) {
    return typeof token === "string" ? this.#expression.startsWith(token) : token.test(this.#expression)
  }

  /** Consume token. */
  #consume(token: RegExp | string, { optional = false } = {}) {
    let captured = null
    if (typeof token === "string") {
      if (this.#expression.startsWith(token)) {
        captured = token
      }
    } else {
      const match = this.#expression.match(token)
      if (match) {
        captured = match[1]
        token = match[0]
      }
    }
    if (captured === null) {
      if (optional) {
        return ""
      }
      throw new SyntaxError(`Expected ${token} at ${this.#expression}`)
    }
    this.#expression = this.#expression.replace(token, "").trim()
    return captured
  }
}
