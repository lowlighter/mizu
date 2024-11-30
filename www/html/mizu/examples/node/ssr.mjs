// Server-Side Rendering (SSR) with Mizu
import Mizu from "@mizu/render/server"
import { createServer } from "node:http"

createServer(async (_, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
  response.end(await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } }))
}).listen(8000, "0.0.0.0", () => console.log("Server is listening"))
