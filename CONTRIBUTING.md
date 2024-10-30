# 💪 Interested in contributing?

Fantastic! We're always excited to welcome new contributors to help us enhance _mizu.js_!

Maintaining a large project like _mizu.js_ requires significant effort, so we kindly ask contributors to follow the guidelines below.

By contributing, you agree to the [Contributor License Agreement](/.github/CLA.md).

## ✅ Accepted contributions

Feel free to send feedback, answer questions, and participate in [discussions](https://github.com/lowlighter/mizu/discussions/new/choose). Please be respectful and constructive.

We accept the following types of contributions:

- **Bug Fixes**
  - If a [`bug` issue](https://github.com/lowlighter/mizu/issues/new?assignees=&labels=bug&projects=&template=bug.yml) has been opened and confirmed by a maintainer.
- **New Features**
  - If a [`spec` issue](https://github.com/lowlighter/mizu/issues/new?assignees=&labels=spec&projects=&template=spec.yml) has been opened and approved by a maintainer.

We may also accept:

- **Documentation Improvements**
  - For typos, grammar, or clarity issues.
  - ⚠️ Do **NOT** submit spam requests just to get a contributor badge; they will be closed immediately, and you may be banned from further contributions.
- **Performance Improvements**
  - If they are significant and properly benchmarked.
  - They must not introduce regressions.

All contributions must be reasonable in size and scope, as your pull request needs to be reviewed by a human!

### 🧪 Implementations

Use `deno task qa` to:

- Run tests
- Check coverage
- Lint code
- Lint documentation
- Verify publishing requirements
- Format code
- Generate the `README.md` from the `mod.html` file (if applicable)

Tests must be relevant and cover the new code. A coverage close to 100% is expected; if not, it means that some of your code is either not tested or unnecessary.

Ensure your code is consistent with the existing codebase:

- **Lexically and Stylistically Consistent**
  - Reuse existing naming conventions.
  - Use single descriptive non-abbreviated words for identifiers.
    - If necessary, create objects and use « dot.case ».
    - If absolutely necessary, functions may be « camelCased ».
    - Shadowing is allowed but should be avoided if possible.
  - Use TypeScript's type inference as much as possible.
- **Lightweight and Independent**
  - Factorize code as much as possible.
  - Avoid using external dependencies.
    - If absolutely necessary, prefer [`@std`](https://jsr.io/@std) and [`@libs`](https://jsr.io/@libs).

See the [Developer API](https://mizu.sh/#api-dev) to get started and the full documentation published at [`jsr.io/@mizu`](https://jsr.io/@mizu).

## 📜 About spec definitions

To ensure the project scope remains well-defined, new features must be discussed and approved before implementation.

The process is as follows:

1. A new [`spec` issue](https://github.com/lowlighter/mizu/issues/new?assignees=&labels=spec&projects=&template=spec.yml) is opened to discuss the motivation, design, and possible implementations.
2. Community and maintainers feedback is collected.
3. A maintainer approves the spec for implementation.
4. An initial implementation is submitted as a pull request to be published in the [`@mizu/unstable`](https://jsr.io/@mizu/unstable) namespace.
5. The feature is reviewed and eventually merged.
6. Community feedback is collected from the experimental implementation.
7. A maintainer approves the feature for inclusion in the official library.
8. The feature is moved to the official namespace.

In some cases, a feature may not need to be fully defined in its first iteration. When this happens, any undefined behaviors must be clearly documented to ensure end users are aware of the limitations.
