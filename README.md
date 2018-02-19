# mkver

**Easy access to your version and build metadata from within
[Node.js](https://nodejs.org/)**

[![npm version](https://badge.fury.io/js/mkver.svg)](https://badge.fury.io/js/mkver)
[![Build Status](https://travis-ci.org/mceachen/mkver.svg?branch=master)](https://travis-ci.org/mceachen/mkver)
[![Build status](https://ci.appveyor.com/api/projects/status/6kw1acvoeuw02d4g/branch/master?svg=true)](https://ci.appveyor.com/project/mceachen/mkver/branch/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/38d56ded57ad1f352ce5/maintainability)](https://codeclimate.com/github/mceachen/mkver/maintainability)

## What? Why?

I needed simple, reliable access to my version and build information within my
node and electron apps. Even if I pushed git SHAs into my `package.json`, after
minification, `asar`ification and installation into who-knows-where
platform-specific directory structures, I didn't want to (continue to) fight
`__dirname` bugs trying to find where my `package.json` went. I'm not getting
any younger here, people, I just want something that works. So what works?

In the TypeScript and ES6 Module worlds, there's a super simple,
compatible-with-minification solution to importing information from outside your
current file. It's called `import`. For old-skool kids, `require`.

So instead of parsing `package.json` or dropping a `version.json` file into a
directory, which then needs to be included in your electron manifests and
battled with on all the different OS fronts, why not make the data be code? I
read that on HN so it's got to be a thoughtful, well-researched archetype for
quality code.

`mkver` should be run automatically as a prerequisite to your build pipeline. It
drops a `Version.ts` (or `Version.js` if you're one of _those_ people) with your
git SHA and version information exported as constants. For extra credit, it also
creates a [SemVer-compatible `release` tag](https://semver.org/#spec-item-10)
that looks like `${version}+${gitSha.substr(0, 7)}`.

## Installation

1. `npm i --save-dev mkver` or `yarn add -D mkver`
2. add a `precompile` or `prebuild` npm script to your `package.json` that runs
   `mkver`.
3. I recommend adding the output file to `.gitignore`, but that isn't a
   requirement.

If you don't compile your code, add `mkver` as a `pre` script for your test
script and/or your webpack/gulp/grunt/browserify pipeline in your
`package.json`.

```json
  "scripts": {
    ...
    "precompile": "mkver",
    "compile": "tsc",
    ...
  }
```

or

```json
  "scripts": {
    ...
    "prebuild": "mkver ./lib/version.js",
    "build": "webpack",
    ...
  }
```

## What `mkver` does

`mkver` is a pretty simple three-step, one-trick pony:

1. `mkver` first looks for a `package.json` in `.`, then `..`, then `../..`,
   etc, and extract the `version` value.
2. `mkver` then
   [execs](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
   `git rev-parse HEAD` to get the last commit SHA. Having `git` available to
   the calling shell is a prerequisite. Please don't file a bug report for this.
3. Finally, `mkver` writes the contents to the first argument given to `mkver`,
   which can include a subdirectory. The default output is `./Version.ts`.
   Existing files with that name will be overwritten. `mkver` uses the file
   extension to determine what format (TypeScript or es6) to render the output.

If anything goes wrong, expect output on `stderr`, and a non-zero exit code.

## Usage

Version files will have the following fields exported:

```ts
// from package.json:
export const version: string = "1.0.0"

// from `git rev-parse HEAD`:
export const gitSha: string = "bfed72637e3bb3b1f5d4c677909fce85e9258b3a"

// Date.now():
export const builtAtMs: number = 1519003153587

// Pleasing melange of version and short git SHA:
export const release: string = "1.0.0+cc5f1ac"
```

### With TypeScript or MJS Modules

```ts
import { release } from "./Version"
```

### With <= ES6 javascript

```js
const { release } = require("./version") // < mind the case matches whatever you give mkver
```

Remember to `mkver version.js` in your npm script!

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
