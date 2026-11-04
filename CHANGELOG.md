# Changelog

This module follows semver.

**The `MAJOR` or `API` version** is incremented for

- 💔 Non-backwards-compatible API changes

**The `MINOR` or `UPDATE` version** is incremented for

- ✨ Backwards-compatible features

**The `PATCH` version** is incremented for

- 🐞 Backwards-compatible bug fixes
- 📦 Minor packaging changes

## [Unreleased]

## [5.0.3] - 2026-08-05

- 🐞 Pass the staged package tarball as an explicit local path so npm does not parse it as GitHub shorthand

## [5.0.2] - 2026-08-05

- 📦 Replace direct npm publishing with a least-privilege, tag-bound release flow that verifies signed commits and tags, retests and packs the exact release source, stages the tarball through npm Trusted Publishing, and creates an immutable GitHub release
- 📦 Isolate publisher dispatch from release signing so transient dispatch failures can be retried without recreating the release commit or tag
- 📦 Add workflow auditing and tighten GitHub Actions token permissions, checkout credentials, dependency installation, and concurrency controls
- 📦 Add 14-day cooldowns for npm-check-updates and pinact, and apply the same minimum age when npm resolves dependencies

## [5.0.1] - 2026-06-04

- 📦 Upgrade dev toolchain to TypeScript 6.0 and ESLint 10, and refresh dev dependencies
- 📦 Migrate `tsconfig.json` to `moduleResolution: "bundler"` with an explicit `types` list (TypeScript 6.0 no longer auto-discovers `@types`)
- 📦 Pass `--ignoreConfig` when compiling generated `.ts` fixtures in tests (TypeScript 6.0 now errors with TS5112 when files are given on the command line alongside a `tsconfig.json`)

## [5.0.0] - 2026-06-03

- 💔 Drop support for Node.js v20 (EOL). `mkver` now requires Node.js v22 or later.
- 📦 Security hardening: add `.npmrc` to disable npm lifecycle scripts and add `SECURITY.md` with vulnerability reporting guidelines
- 📦 Update CI Node.js matrix to v22, v24, and v26
- 📦 Switch from the abandoned `npm-run-all` to `npm-run-all2` and update dev dependencies
- 📦 Update GitHub Actions (`checkout`, `setup-node`) and pin them via `pinact`; remove the deprecated dependabot config

## [4.3.0] - 2025-09-16

- ✨ Added `--version` and `-v` CLI flags to display version number

## [4.2.0] - 2025-09-16

- ✨ Enhanced git error handling with user-friendly, actionable error messages for common failure scenarios:
  - `git` not available
  - Running outside a git repository
  - Running in a git repository with no commits
- 📦 Added comprehensive test coverage for git prerequisite failure modes and CLI flags
- 📦 Support for `GIT` environment variable to override git command (useful for testing)

## [4.1.0] - 2025-09-15

- 🐞 Fix [#49](https://github.com/photostructure/mkver/issues/49), which required `semver` to be added as a proper dependency, and the path to `mkver` to be fixed. Thanks, [Rob van der Leek](https://github.com/robvanderleek)!

## [4.0.3] - 2025-08-27

- 📦 Update GitHub Actions to publish via OIDC

## [4.0.2] - 2025-05-31

- ✨ Add ESLint configuration for JavaScript and TypeScript linting
- 📦 Fix cross-platform TypeScript compilation in tests using npx
- 📦 Update GitHub Actions workflows to use numeric Node.js versions

## [4.0.1] - 2025-05-23

- 💔 Drop Node.js v18 and v21 support

- ✨ Add `.cjs` file extension support for explicit CommonJS output
- 📦 add Node.js v22, v23, and v24 support
- 📦 Switch CI workflow from yarn to npm
- 🐞 Enhance error handling for file creation and TypeScript compilation in tests
- 🐞 Fix Windows test compatibility issues (reverted ESM migration due to test breakage)

## [3.0.2] - 2024-03-28

- 🐞 Remove console.log with `headSha` metadata

## [3.0.1] - 2024-03-28

- 🐞 Fix `mkver` shebang

## [3.0.0] - 2024-03-28

- 💔 Drop support for obsolete versions of Node.js

- ✨ Support non-CLI programmatic `mkver` calls. Include typings.

- 📦 Merge code from bin/mkver.js into mkver.ts

- 📦 Replace sync calls with async calls

- 📦 Added eslint.

- 📦 Added prettier and import reordering.

- 📦 Upgrade all dev dependencies.

## [2.1.0] - 2022-11-27

- 📦 Upgrade all dev dependencies.

- 📦 Remove unused internal `map` function

## [2.0.0] - 2022-07-15

- ✨ If the version is parseable by
  [semver](https://github.com/npm/node-semver), `mkver` will export
  `versionMajor`, `versionMinor`, `versionPatch`, and `versionPrerelease`
  fields. Examples are now in the README.

- 📦 Improved test coverage with several different version flavors (including prerelease suffixes)

- 📦 Upgrade all dev dependencies.

- 💔/📦 Dropped Node 12 and added Node 18 to the CI matrix (12 is EOL)

## [1.6.0] - 2021-09-22

- 📦 Upgrade all dev dependencies

## [1.5.0] - 2021-03-14

- 📦 Add default exports (so `import v from "./Versions"` works, if you want namespaced access).
- 📦 Upgrade all dev dependencies

## [1.4.0] - 2021-02-16

- ✨ Support ECMAScript module formats (`.mjs`)
- 📦 Upgrade all dev dependencies

## [1.3.6] - 2020-11-20

- 📦 Upgrade all dev dependencies (including TypeScript 4.1)

## [1.3.5] - 2020-08-25

- 📦 Upgrade all dev dependencies

## [1.3.4] - 2020-07-14

- 📦 Upgrade all dev dependencies

## [1.3.3] - 2020-03-30

- 📦 `Version.js` and `Version.ts` both use semicolons now
- 📦 version.ts has test coverage
- 📦 Upgrade all dev dependencies
- 📦 Prettier 2.0.0 diffs

## [1.3.2] - 2020-03-15

- 📦 Upgrade all dev dependencies, migrate mocha opts

## [1.3.1] - 2019-11-05

- 📦 Upgrade all dev dependencies

## [1.3.0] - 2019-08-23

- ✨ Support arbitrarily deep subpackages (if running on node 10.13+)
- 📦 Add better integration tests (by spawning the binfile)
- 📦 prettier .js
- 📦 Upgrade all dev dependencies

## [1.2.0] - 2019-06-11

- ✨ Remove runtime dependency on `fs-extra`
- 📦 Upgrade all dev dependencies

## [1.1.2] - 2019-02-09

- 📦 Support for `mkver --help`

## [1.1.1] - 2019-02-09

- 📦 Upgrade all dev dependencies
- 📦 Add node 11 to the build matrix

## [1.1.0] - 2018-09-19

- ✨ The release suffix is now the YYYYMMDDhhmmss for better human readability.
  The base64 of the minute unixtime was, uh, "clever," but I kept wanting to
  know _when_ the build was, and I don't (yet) think in b64.
- 📦 Upgrade all dev deps, including TS 3.0.3.

## [1.0.0] - 2018-05-26

- ✨ release values use the git commit date rather than the SHA, so the same
  version will have monotonically increasing releases for subsequent commits.

## [0.0.4] - 2018-02-19

- 📦 Publish on linux to chmod bin/mkver

## [0.0.2] - 2018-02-19

- 📦 Whitespace between comment and exports

## [0.0.1] - 2018-02-19

- 🎉 First release

[5.0.3]: https://github.com/photostructure/mkver/releases/tag/v5.0.3
[5.0.2]: https://github.com/photostructure/mkver/releases/tag/v5.0.2
[5.0.1]: https://github.com/photostructure/mkver/releases/tag/v5.0.1
[5.0.0]: https://github.com/photostructure/mkver/releases/tag/v5.0.0
[4.3.0]: https://github.com/photostructure/mkver/releases/tag/v4.3.0
[4.2.0]: https://github.com/photostructure/mkver/releases/tag/v4.2.0
[4.1.0]: https://github.com/photostructure/mkver/releases/tag/v4.1.0
[4.0.3]: https://github.com/photostructure/mkver/releases/tag/v4.0.3
[4.0.2]: https://github.com/photostructure/mkver/releases/tag/v4.0.2
[4.0.1]: https://github.com/photostructure/mkver/releases/tag/v4.0.1
[3.0.2]: https://github.com/photostructure/mkver/releases/tag/v3.0.2
[3.0.1]: https://github.com/photostructure/mkver/releases/tag/v3.0.1
[3.0.0]: https://github.com/photostructure/mkver/releases/tag/v3.0.0
[2.1.0]: https://github.com/photostructure/mkver/releases/tag/v2.1.0
[2.0.0]: https://github.com/photostructure/mkver/releases/tag/v2.0.0
[1.6.0]: https://github.com/photostructure/mkver/releases/tag/v1.6.0
[1.5.0]: https://github.com/photostructure/mkver/releases/tag/v1.5.0
[1.4.0]: https://github.com/photostructure/mkver/releases/tag/v1.4.0
[1.3.6]: https://github.com/photostructure/mkver/releases/tag/v1.3.6
[1.3.5]: https://github.com/photostructure/mkver/releases/tag/v1.3.5
[1.3.4]: https://github.com/photostructure/mkver/releases/tag/v1.3.4
[1.3.3]: https://github.com/photostructure/mkver/releases/tag/v1.3.3
[1.3.2]: https://github.com/photostructure/mkver/releases/tag/v1.3.2
[1.3.1]: https://github.com/photostructure/mkver/releases/tag/v1.3.1
[1.3.0]: https://github.com/photostructure/mkver/releases/tag/v1.3.0
[1.2.0]: https://github.com/photostructure/mkver/releases/tag/v1.2.0
[1.1.2]: https://github.com/photostructure/mkver/releases/tag/v1.1.2
[1.1.1]: https://github.com/photostructure/mkver/releases/tag/v1.1.1
[1.1.0]: https://github.com/photostructure/mkver/releases/tag/v1.1.0
[1.0.0]: https://github.com/photostructure/mkver/releases/tag/v1.0.0
[0.0.4]: https://github.com/photostructure/mkver/releases/tag/v0.0.4
[0.0.2]: https://github.com/photostructure/mkver/releases/tag/v0.0.2
[0.0.1]: https://github.com/photostructure/mkver/releases/tag/v0.0.1
