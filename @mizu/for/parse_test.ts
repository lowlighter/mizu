import { expect, test } from "@libs/testing"
import { Expression } from "./parse.ts"

for (
  const [expression, expected] of [
    // Basic syntax
    ["invalid", SyntaxError],
    [`let a of []`, ["a"]],
    [`var a of []`, ["a"]],
    [`const a of []`, ["a"]],
    [`const a, b, c of []`, SyntaxError],

    // Initialization, condition and afterthought
    [`let i = 0; i < x; i++`, ["i"]],
    [`let i = 0, j = 0;;`, ["i", "j"]],
    [`let i = {}, j = [], k = "";;`, ["i", "j", "k"]],
    [`let i = () => {}, j = async function() {}, k = i+1;;`, ["i", "j", "k"]],
    [`let i = 0;;`, ["i"]],
    [`let i`, SyntaxError],
    [`let i = 0;`, SyntaxError],
    [`;;`, []],

    // Array
    // Destructuring
    [`const [a, b, c] of []`, ["a", "b", "c"]],
    [`const [a, [b, [c]]] of []`, ["a", "b", "c"]],
    [`const [a, b, c of []`, SyntaxError],
    [`const [a, [b, c] of []`, SyntaxError],
    // Spreading
    [`const [a, b, ...c] of []`, ["a", "b", "c"]],
    [`const [a, ...b, c] of []`, SyntaxError],
    // Default values
    [`const [a = 1, b = [], c = {x:1}, d] of []`, ["a", "b", "c", "d"]],
    [`const [a = Math.random() > .5 ? 1 : 0, b] of []`, ["a", "b"]],
    [`const [a = (async () => await ([]))(), b] of []`, ["a", "b"]],
    [`const [a = "string", b = c] of []`, ["a", "b"]],

    // Object
    // Destructuring
    [`const {a, b, c} of []`, ["a", "b", "c"]],
    [`const {a, x: {b, y:{c}}} of []`, ["a", "b", "c"]],
    [`const {a, b, c of []`, SyntaxError],
    [`const {a, {b, c} of []`, SyntaxError],
    // Spreading syntax
    [`const {a, b, ...c} of []`, ["a", "b", "c"]],
    [`const {a, ...b, c} of []`, SyntaxError],
    // Default values
    [`const {a = 1, b = [], c = {x:1}, d} of []`, ["a", "b", "c", "d"]],
    [`const {a = Math.random() > .5 ? 1 : 0, b} of []`, ["a", "b"]],
    [`const {a = (async () => await ([]))(), b} of []`, ["a", "b"]],
    [`const {a = "string", b = c} of []`, ["a", "b"]],
    [`const {a = () => ({}), b} of []`, ["a", "b"]],
    [`const {a = async () => ({}), b} of []`, ["a", "b"]],
    [`const {a = async function*(){}, b} of []`, ["a", "b"]],

    // Alias syntax
    [`const {a, b:c} of []`, ["a", "c"]],
    [`const {a, b:c = 1} of []`, ["a", "c"]],
    [`const {a, [b]:c = 1} of []`, ["a", "c"]],

    // Complex syntax
    [`const {a = ([{a:1}, [{a:(true)}]]), b} of []`, ["a", "b"]],
    [`const {a = ({a = 1} = {}) => [a + 1], b = Math.random(), [Symbol.for("@")]:{d = 1}} of []`, ["a", "b", "d"]],
  ] as const
) {
  test(`\`Expression.parse()\` parses \`${expression} => ${expected === SyntaxError ? "new SyntaxError()" : expected}\``, () => {
    if (expected === SyntaxError) {
      expect(() => Expression.parse(expression)).toThrow()
    } else {
      expect(Expression.parse(expression)).toEqual(expected)
    }
  })
}
