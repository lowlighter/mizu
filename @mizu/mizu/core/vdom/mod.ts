/**
 * Virtual {@linkcode https://developer.mozilla.org/docs/Web/API/Window | Window} implementations.
 *
 * They are used to render HTML content in server-side environments.
 *
 * > [!IMPORTANT]
 * > All implementations must closely follow the {@link https://html.spec.whatwg.org/ | HTML specification} to ensure compatibility with different environments.
 *
 * @module
 */
export * from "./jsdom.ts"
