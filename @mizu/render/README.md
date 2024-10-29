# 🌊 mizu.js

[![mizu.sh](https://img.shields.io/badge/%F0%9F%8C%8A-mizu.sh-black?labelColor=black)](https://mizu.sh)

<p align="center"><a href="https://mizu.sh"><img src="https://mizu.sh/logo.png" width="300"></a></p>

Full documentation is available at [mizu.sh](https://mizu.sh).

<!-- @mizu/www/html/mizu/features.html -->

# [Features](#features)

## 🍜 Plug-and-play

Simply [include the library](#usage) and start building amazing things instantly with vanilla JavaScript and HTML.

## 🍤 Cross-platform

Compatible across a wide range of JavaScript and TypeScript runtimes, including all major browsers.

## 🍣 Any-side

Render your content wherever you need it and however you want it with [user-friendly APIs](#api-user).

## 🍱 Hackable

Cherry-pick features and craft your own setup easily with [developer-friendly APIs](#api-dev) and our [custom builder](/build).

## 🥡 Community-driven

Build, [share and reuse](/community) custom elements and directives to supercharge your development.

Want to effortlessly theme your page? Check out [matcha.css](https://matcha.mizu.sh)!

## 🍙 Open-core

Licensed under the [AGPLv3 License](https://github.com/lowlighter/mizu/blob/main/LICENSE#L13-L658), source code fully available on [github.com](https://github.com/lowlighter/mizu).

Use [MIT License](https://github.com/lowlighter/mizu/blob/main/LICENSE#L662-L685) terms for non-commercial projects or with an active [$1+ monthly sponsorship](https://github.com/sponsors/lowlighter).

<!-- @mizu/www/html/mizu/features.html -->

<!-- @mizu/www/html/mizu/usage.html -->

# [Usage](#usage)

> [!WARNING]
>
> _**mizu.js**_ is still in active development.
>
> See [github.com/lowlighter/mizu/issues/34](https://github.com/lowlighter/mizu/issues/34) for more information.

## [Client-side](#usage-client)

Set up _**mizu.js**_ in your browser environment using one of two methods:

- [Immediately Invoked Function Expression (IIFE)](https://developer.mozilla.org/docs/Glossary/IIFE)
- [EcmaScript Module (ESM)](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules)

> [!NOTE]
>
> On the client-side...
>
> - **Rendering is explicit**, requiring the [`*mizu`](#mizu) attribute to enable _**mizu.js**_ on a subtree.
> - **Reactivity is enabled**, so changes to [contexts](#concept-context) will trigger a re-render.

### [IIFE _( `.js`)_](#usage-client-iife)

This setup automatically starts rendering the page once the script is loaded. It's the simplest way to get started but limited to the default configuration.

```html
<script src="https://mizu.sh/client.js" defer></script>
```

### [ESM _( `.mjs`)_](#usage-client-esm)

This setup requires you to import and start _**mizu.js**_ manually, allowing customization of the rendering process, such as setting the initial context and loading additional directives.

```
<script type="module">
  import Mizu from "https://mizu.sh/client.mjs"
  await Mizu.render(document.body, { context: { foo: "🌊 Yaa, mizu!" } })
</script>
```

## [Server-side](#usage-server)

To set up _**mizu.js**_ in a server environment, install it locally. _**mizu.js**_ packages are hosted on [![](https://jsr.io/badges/@mizu)](https://jsr.io/@mizu).

> [!NOTE]
>
> On the server side...
>
> - **Rendering is implicit**, so the [`*mizu`](#mizu) attribute is not required.
> - **Reactivity is disabled**, meaning changes to [contexts](#concept-context) are not tracked and will not trigger a re-render.

### [Deno](#usage-server-deno)

Deno supports the `jsr:` specifier natively, allowing you to import _**mizu.js**_ directly.

```ts
import Mizu from "jsr:@mizu/render/server"
await Mizu.render(`<div *text="foo"></div>`, { context: { foo: "🌊 Yaa, mizu!" } })
```

Alternatively, add it to your project using the Deno CLI.

```bash
deno add jsr:@mizu/render
```

### [Other runtimes (NodeJS, Bun, etc.)](#usage-server-others-runtimes)

Add _**mizu.js**_ to your project using the [JSR npm compatibility layer](https://jsr.io/docs/npm-compatibility).

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
