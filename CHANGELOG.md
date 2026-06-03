# Changelog

This module follows semver.

**The `MAJOR` or `API` version** is incremented for

- 💔 Non-backwards-compatible API changes

**The `MINOR` or `UPDATE` version** is incremented for

- ✨ Backwards-compatible features

**The `PATCH` version** is incremented for

- 🐞 Backwards-compatible bug fixes
- 📦 Minor packaging changes

## v5.0.0

- 💔 Drop support for Node.js v20 (EOL). `mkver` now requires Node.js v22 or later.
- 📦 Security hardening: add `.npmrc` to disable npm lifecycle scripts and add `SECURITY.md` with vulnerability reporting guidelines
- 📦 Update CI Node.js matrix to v22, v24, and v26
- 📦 Switch from the abandoned `npm-run-all` to `npm-run-all2` and update dev dependencies
- 📦 Update GitHub Actions (`checkout`, `setup-node`) and pin them via `pinact`; remove the deprecated dependabot config

## v4.3.0

- ✨ Added `--version` and `-v` CLI flags to display version number

## v4.2.0

- ✨ Enhanced git error handling with user-friendly, actionable error messages for common failure scenarios:
  - `git` not available
  - Running outside a git repository
  - Running in a git repository with no commits
- 📦 Added comprehensive test coverage for git prerequisite failure modes and CLI flags
- 📦 Support for `GIT` environment variable to override git command (useful for testing)

## v4.1.0

- 🐞 Fix [#49](https://github.com/photostructure/mkver/issues/49), which required `semver` to be added as a proper dependency, and the path to `mkver` to be fixed. Thanks, [Rob van der Leek](https://github.com/robvanderleek)!

## v4.0.3

- 📦 Update GitHub Actions to publish via OIDC

## v4.0.2

- ✨ Add ESLint configuration for JavaScript and TypeScript linting
- 📦 Fix cross-platform TypeScript compilation in tests using npx
- 📦 Update GitHub Actions workflows to use numeric Node.js versions

## v4.0.1

- 💔 Drop Node.js v18 and v21 support

- ✨ Add `.cjs` file extension support for explicit CommonJS output
- 📦 add Node.js v22, v23, and v24 support
- 📦 Switch CI workflow from yarn to npm
- 🐞 Enhance error handling for file creation and TypeScript compilation in tests
- 🐞 Fix Windows test compatibility issues (reverted ESM migration due to test breakage)

## v3.0.2

- 🐞 Remove console.log with `headSha` metadata

## v3.0.1

- 🐞 Fix `mkver` shebang

## v3.0.0

- 💔 Drop support for obsolete versions of Node.js

- ✨ Support non-CLI programmatic `mkver` calls. Include typings.

- 📦 Merge code from bin/mkver.js into mkver.ts

- 📦 Replace sync calls with async calls

- 📦 Added eslint.

- 📦 Added prettier and import reordering.

- 📦 Upgrade all dev dependencies.

## v2.1.0

- 📦 Upgrade all dev dependencies.

- 📦 Remove unused internal `map` function

## v2.0.0

- ✨ If the version is parseable by
  [semver](https://github.com/npm/node-semver), `mkver` will export
  `versionMajor`, `versionMinor`, `versionPatch`, and `versionPrerelease`
  fields. Examples are now in the README.

- 📦 Improved test coverage with several different version flavors (including prerelease suffixes)

- 📦 Upgrade all dev dependencies.

- 💔/📦 Dropped Node 12 and added Node 18 to the CI matrix (12 is EOL)

## v1.6.0

- 📦 Upgrade all dev dependencies

## v1.5.0

- 📦 Add default exports (so `import v from "./Versions"` works, if you want namespaced access).
- 📦 Upgrade all dev dependencies

## v1.4.0

- ✨ Support ECMAScript module formats (`.mjs`)
- 📦 Upgrade all dev dependencies

## v1.3.6

- 📦 Upgrade all dev dependencies (including TypeScript 4.1)

## v1.3.5

- 📦 Upgrade all dev dependencies

## v1.3.4

- 📦 Upgrade all dev dependencies

## v1.3.3

- 📦 `Version.js` and `Version.ts` both use semicolons now
- 📦 version.ts has test coverage
- 📦 Upgrade all dev dependencies
- 📦 Prettier 2.0.0 diffs

## v1.3.2

- 📦 Upgrade all dev dependencies, migrate mocha opts

## v1.3.1

- 📦 Upgrade all dev dependencies

## v1.3.0

- ✨ Support arbitrarily deep subpackages (if running on node 10.13+)
- 📦 Add better integration tests (by spawning the binfile)
- 📦 prettier .js
- 📦 Upgrade all dev dependencies

## v1.2.0

- ✨ Remove runtime dependency on `fs-extra`
- 📦 Upgrade all dev dependencies

## v1.1.2

- 📦 Support for `mkver --help`

## v1.1.1

- 📦 Upgrade all dev dependencies
- 📦 Add node 11 to the build matrix

## v1.1.0

- ✨ The release suffix is now the YYYYMMDDhhmmss for better human readability.
  The base64 of the minute unixtime was, uh, "clever," but I kept wanting to
  know _when_ the build was, and I don't (yet) think in b64.
- 📦 Upgrade all dev deps, including TS 3.0.3.

## v1.0.0

- ✨ release values use the git commit date rather than the SHA, so the same
  version will have monotonically increasing releases for subsequent commits.

## v0.0.4

- 📦 Publish on linux to chmod bin/mkver

## v0.0.2

- 📦 Whitespace between comment and exports

## v0.0.1

- 🎉 First release
