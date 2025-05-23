# mkver

**Easy access to your version and build metadata from within
[Node.js](https://nodejs.org/)**

[![npm version](https://img.shields.io/npm/v/mkver.svg)](https://www.npmjs.com/package/mkver)
[![Node.js CI](https://github.com/photostructure/mkver/actions/workflows/node.js.yml/badge.svg)](https://github.com/photostructure/mkver/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/photostructure/mkver/actions/workflows/codeql.yml/badge.svg)](https://github.com/photostructure/mkver/actions/workflows/codeql.yml)

## Why?

Simple, reliable, no-runtime-dependency access to version and build
information from within node and Electron apps should be easy.

Even if you push git SHAs into your `package.json`, after
minification, `asar`ification and installation into who-knows-where
platform-specific directory structures, you'll still be fighting
`__dirname` bugs trying to find where your `package.json` went.

In TypeScript and ES6 Module worlds, there's a super simple,
minification-compatible and asar-compatible solution to importing information
from outside your current file, and it's great.

It's called `import`. Or for you [old-skool
kids](https://en.wikipedia.org/wiki/CommonJS), `require`.

If we can write build-specific information as constants **as code**, living in
our codebase, consumption of this metadata becomes trivial. Add it to your build
pipeline, import the thing, and then solve the Big Problems.

## What?

`mkver` produces either:

- a `Version.ts` (the default, for [TypeScript](https://www.typescriptlang.org/)
  users),
- a `version.mjs` (for [JavaScript
  module
  users](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)),
  or
- a `version.js` (if you're using
  [CommonJS](https://en.wikipedia.org/wiki/CommonJS)), or
- a `version.cjs` (for explicit [CommonJS](https://en.wikipedia.org/wiki/CommonJS) 
  in ESM projects) with your git SHA and version information exported as constants.

## Example output

```typescript
// Version.ts

export const version = "1.2.3-beta.4"
export const versionMajor = 1
export const versionMinor = 2
export const versionPatch = 3
export const versionPrerelease = ["beta", 4]
export const release = "1.2.3-beta.4+20220101105815"
export const gitSha = "dc336bc8e1ea6b4e2f393f98233839b6c23cb812"
export const gitDate = new Date(1641063495000)
export default {
  version,
  versionMajor,
  versionMinor,
  versionPatch,
  versionPrerelease,
  release,
  gitSha,
  gitDate,
}
```

The filename can be anything you want, but the file extension must be `.ts`,
`.mjs`, `.js`, or `.cjs`.

For extra credit, it also creates a [SemVer-compatible `release`
tag](https://semver.org/#spec-item-10) that looks like
`${version}+${YYYYMMDDhhmmss of gitDate}`, and a `gitDate`, which is a `Date`
instance of when that last git commit happened.

## Installation

### Step 1: add `mkver` to your package.json

`npm i --save-dev mkver`

### Step 2: For TypeScript users

Add a `pre...` npm script to your `package.json` that runs
`mkver`:

```json
  "scripts": {
    ...
    "precompile": "mkver",
    "compile": "tsc",
    ...
  }
```

### Step 2: For JavaScript module or CommonJS users

Add `mkver` as a `pre...` script for your test script and/or your
webpack/gulp/grunt/browserify pipeline in your `package.json`:

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

`mkver` is a pretty simple, no-dependencies, three-step, one-trick pony:

1. `mkver` first looks for a `package.json` in `.`, then `..`, then `../..`,
   etc, and extracts the `version` value.
2. `mkver` then
   [execs](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
   `git rev-parse HEAD` to get the last commit SHA. Having `git` available to
   the calling shell is a prerequisite. Please don't file a bug report for this.
3. Finally, `mkver` writes the contents to the first argument given to `mkver`,
   which can include a subdirectory. The default output is `./Version.ts`.
   Existing files with that name will be overwritten. `mkver` uses the file
   extension to determine what format (TypeScript, ESM, or CommonJS) to render the
   output.

If anything goes wrong, expect output on `stderr`, and a non-zero exit code.

### Use with TypeScript or MJS modules

```ts
import { version, release } from "./Version"
```

### Use with CommonJS

```js
const { version, release } = require("./version") // < mind the case matches whatever you give mkver
```

Remember to `mkver version.js` (or `version.cjs`) in your npm script (see the Installation's "Step 2" above!)

## Bash access to your version info

Need access to your `release` from, say, your deploy script written in `bash`?

```sh
  # For CommonJS (.js or .cjs files):
  release=$(node -e "console.log(require('./path/to/version.js').release)")
  
  # For ESM (.mjs or .ts files):
  release=$(node -e "import('./path/to/version.mjs').then(m => console.log(m.release))")
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
