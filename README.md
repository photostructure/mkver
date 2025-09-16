**Easy access to your version and build metadata from within
[Node.js](https://nodejs.org/)**

[![npm version](https://img.shields.io/npm/v/mkver.svg)](https://www.npmjs.com/package/mkver)
[![Build & Release](https://github.com/photostructure/mkver/actions/workflows/build.yml/badge.svg)](https://github.com/photostructure/mkver/actions/workflows/build.yml)
[![CodeQL](https://github.com/photostructure/mkver/actions/workflows/codeql.yml/badge.svg)](https://github.com/photostructure/mkver/actions/workflows/codeql.yml)

## Why?

Simple, reliable access to version and build information from within Node.js and Electron apps should be easy, without runtime dependencies.

Even if you push git SHAs into your `package.json`, after minification, `asar`ification, and installation into platform-specific directory structures, you'll still be fighting `__dirname` bugs trying to find where your `package.json` went.

In TypeScript and ES6 module environments, there's a simple, minification-compatible and asar-compatible solution for importing information from outside your current file.

It's called `import`. Or for [CommonJS](https://en.wikipedia.org/wiki/CommonJS) users, `require`.

By writing build-specific information as constants **in code** within our codebase, consuming this metadata becomes trivial. Add it to your build pipeline, import it, and focus on the big problems.

## What?

`mkver` produces either:

- `Version.ts` (the default, for [TypeScript](https://www.typescriptlang.org/) users)
- `version.mjs` (for [JavaScript module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) users)
- `version.js` (for [CommonJS](https://en.wikipedia.org/wiki/CommonJS) users)
- `version.cjs` (for explicit [CommonJS](https://en.wikipedia.org/wiki/CommonJS) in ESM projects)

Each file contains your git SHA and version information exported as constants.

## Example output

```typescript
// Version.ts

export const version = "1.2.3-beta.4";
export const versionMajor = 1;
export const versionMinor = 2;
export const versionPatch = 3;
export const versionPrerelease = ["beta", 4];
export const release = "1.2.3-beta.4+20220101105815";
export const gitSha = "dc336bc8e1ea6b4e2f393f98233839b6c23cb812";
export const gitDate = new Date(1641063495000);
export default {
  version,
  versionMajor,
  versionMinor,
  versionPatch,
  versionPrerelease,
  release,
  gitSha,
  gitDate,
};
```

The filename can be anything you want as long as the file extension is:

- `.ts`,
- `.mjs`,
- `.js`, or
- `.cjs`.

It also creates a [SemVer-compatible `release` field](https://semver.org/#spec-item-10) in the format `${version}+${YYYYMMDDhhmmss of gitDate}`, and a `gitDate` `Date` instance representing when the last git commit occurred.

## Module Format

`mkver` itself is distributed as a CommonJS package to ensure maximum compatibility across different Node.js environments and platforms. While the tool internally uses ES modules during development, the distributed package uses CommonJS to avoid compatibility issues that can arise with ESM on certain platforms (particularly Windows).

However, `mkver` generates output files in whatever format you need:

- TypeScript (`.ts`) with ES module exports
- ES modules (`.mjs`) with ES module exports
- CommonJS (`.js` or `.cjs`) with CommonJS exports

The output format is determined solely by the file extension you specify.

## Installation

### Step 1: Add `mkver` to your package.json

`npm i --save-dev mkver`

### Step 2: For TypeScript users

Add a `pre...` npm script to your `package.json` that runs `mkver`:

```json
  "scripts": {
    ...
    "precompile": "mkver",
    "compile": "tsc",
    ...
  }
```

### Step 2: For JavaScript module or CommonJS users

Add `mkver` as a `pre...` script for your test script and/or build pipeline in your `package.json`:

```js
  "scripts": {
    ...
    "prebuild": "mkver ./lib/version.mjs", // or ./lib/version.js or ./lib/version.cjs
    "build": "webpack", // or whatever you use
    ...
  }
```

### Step 3: Add to .gitignore

You should add your `Version.ts`, `version.mjs`, `version.js`, or `version.cjs` file to
your project's `.gitignore`.

## How

`mkver` is a simple, dependency-free, three-step tool:

1. `mkver` recursively searches for a `package.json` starting from the current directory and extracts the `version` value.
2. `mkver` executes `git rev-parse HEAD` to get the last commit SHA. Git must be available in your PATH.
3. `mkver` writes the output to the specified file (default: `./Version.ts`). The file extension determines the output format (TypeScript, ESM, or CommonJS). Existing files will be overwritten.

If anything goes wrong, `mkver` will output errors to `stderr` and exit with a non-zero code.

### Use with TypeScript or MJS modules

```ts
import { version, release } from "./Version";
```

### Use with CommonJS

```js
const { version, release } = require("./version"); // Ensure the case matches your mkver output filename
```

Remember to specify `mkver version.js` (or `version.cjs`) in your npm script (see Installation Step 2 above).

## Bash access to your version info

Need access to your `release` from a bash deploy script?

```sh
  # For CommonJS (.js or .cjs files):
  release=$(node -e "console.log(require('./path/to/version.js').release)")

  # For ESM (.mjs or .ts files):
  release=$(node -e "import('./path/to/version.mjs').then(m => console.log(m.release))")
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
