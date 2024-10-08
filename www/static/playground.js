// Setup code editor
const editor = document.querySelector(".editor")
const textarea = editor.querySelector("textarea")
const highlight = editor.querySelector(".highlight")
textarea.addEventListener("input", () => coloration(textarea.value))
textarea.addEventListener("scroll", function () {
  highlight.scrollTop = this.scrollTop
  highlight.scrollLeft = this.scrollLeft
})
function coloration(value) {
  highlight.innerHTML = hljs.highlight(value, { language: "xml" }).value
}
coloration(textarea.value)

// Setup mizu renderer
const iframe = document.querySelector("iframe")
document.querySelector("#render").addEventListener("click", () => {
  const frame = iframe.contentDocument
  frame.open()
  frame.write(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/matcha.css">
  </head>
  <body *mizu class="pt-1">
    ${textarea.value}
    <script src="/mizu.csr.js"><\/script>
  </body>
</html>`.trim())
  frame.close()
})
