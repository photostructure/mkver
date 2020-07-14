# Changelog

This module follows semver.

**The `MAJOR` or `API` version** is incremented for

- 💔 Non-backwards-compatible API changes

**The `MINOR` or `UPDATE` version** is incremented for

- ✨ Backwards-compatible features

**The `PATCH` version** is incremented for

- 🐞 Backwards-compatible bug fixes
- 📦 Minor packaging changes

## v1.3.4

- 📦 Upgrade all deps

## v1.3.3

- 📦 `Version.js` and `Version.ts` both use semicolons now
- 📦 version.ts has test coverage
- 📦 Upgrade all deps
- 📦 Prettier 2.0.0 diffs

## v1.3.2

- 📦 Upgrade all deps, migrate mocha opts

## v1.3.1

- 📦 Upgrade all deps

## v1.3.0

- ✨ Support arbitrarily deep subpackages (if running on node 10.13+)
- 📦 Add better integration tests (by spawning the binfile)
- 📦 prettier .js
- 📦 Upgrade all deps

## v1.2.0

- ✨ Remove runtime dependency on `fs-extra`
- 📦 Upgrade all deps

## v1.1.2

- 📦 Support for `mkver --help`

## v1.1.1

- 📦 Upgrade all deps
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
