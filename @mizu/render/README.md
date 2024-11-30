# 🌊 mizu.js

[![mizu.sh](https://img.shields.io/badge/%F0%9F%8C%8A-mizu.sh-black?labelColor=black)](https://mizu.sh)

<p align="center"><a href="https://mizu.sh"><img src="https://mizu.sh/logo.png" width="300"></a></p>

Full documentation is available at [mizu.sh](https://mizu.sh).

<!-- @mizu/www/html/mizu/usage.html -->

# Usage

## Client-side

Set up _**mizu.js**_ in your browser environment using one of two methods:

- Immediately Invoked Function Expression (IIFE)
- EcmaScript Module (ESM)

> [!NOTE]
>
> On the client-side...
>
> - **Rendering is explicit**, requiring the `*mizu` attribute to enable _**mizu.js**_ on a subtree.
> - **Reactivity is enabled**, so changes to contexts will trigger a re-render.

### IIFE _( `.js`)_

This setup automatically starts rendering the page once the script is loaded. It's the simplest way to get started but limited to the default configuration.

```html
<script src="https://mizu.sh/client.js" defer></script>
```

### ESM _( `.mjs`)_

This setup requires you to import and start _**mizu.js**_ manually, allowing customization of the rendering process, such as setting the initial context and loading additional directives.

```html
<script type="module">
  import Mizu from "https://mizu.sh/client.mjs"
  await Mizu.render(document.body, { context: { foo: "🌊 Yaa, mizu!" } })
</script>
```

## Server-side

To set up _**mizu.js**_ in a server environment, install it locally. _**mizu.js**_ packages are hosted on ![jsr.io/@mizu](https://jsr.io/@mizu).

> [!NOTE]
>
> On the server side...
>
> - **Rendering is implicit**, so the `*mizu` attribute is not required.
> - **Reactivity is disabled**, meaning changes to contexts are not tracked and will not trigger a re-render.

### Deno

Deno supports the `jsr:` specifier natively, allowing you to import _**mizu.js**_ directly.

```ts
import Mizu from "jsr:@mizu/render/server"
await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } })
```

Alternatively, add it to your project using the Deno CLI.

```bash
deno add jsr:@mizu/render
```

### Other runtimes (NodeJS, Bun, etc.)

Add _**mizu.js**_ to your project using the JSR npm compatibility layer.

```bash
# NodeJS
npx jsr add @mizu/render
```

```bash
# Bun
bunx jsr add @mizu/render
```

Once installed, use it in your project.

```ts
import Mizu from "@mizu/render/server"
await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } })
```

<!-- @mizu/www/html/mizu/usage.html -->

# 📜 License

```
This project is dual-licensed.

You may use this project under the terms of the MIT License for non-commercial
projects OR as long as you are sponsoring this project through GitHub sponsors
with a monthly minimum donation of 1 (one) dollar using the link below:

    GitHub sponsors, Simon Lecoq: <https://github.com/sponsors/lowlighter>

You may use this project free of charge under the terms of the GNU Affero v3.
```
