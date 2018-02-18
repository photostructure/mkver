# mkver

**Easy access to your version and build metadata from within
[Node.js](https://nodejs.org/)**

<!-- [![npm version](https://badge.fury.io/js/mkver.svg)](https://badge.fury.io/js/mkver)
[![Build status](https://travis-ci.org/mceachen/mkver.svg?branch=master)](https://travis-ci.org/mceachen/mkver) -->

<!-- [![Build status](https://ci.appveyor.com/api/projects/status/g5pfma7owvtsrrkm/branch/master?svg=true)](https://ci.appveyor.com/project/mceachen/mkver/branch/master) -->

## What? Why?

I needed simple, reliable access to my version and build information within my
node and electron apps. Even if I pushed git SHAs into my `package.json`, after
minification, `asar`ification and installation into who-knows-where
platform-specific directory structures, I didn't want to (continue to) fight
`__dirname` bugs trying to find where my `package.json` went. I'm not getting any
younger here, people, I just want something that works. So what works?

In the TypeScript and ES6 Module worlds, there's a super simple,
compatible-with-minification solution to importing information from outside your
current file. It's called `import`. For old-skool kids, `require`.

So instead of parsing `package.json` or dropping a `version.json` file into a
directory, which then needs to be included in your electron manifests and
battled with on all the different OS fronts, why not make the data be code? I
read that on HN so it's got to be a great well-researched idea.

`mkver`, to be run automatically as a prerequisite to your build pipeline,
drops a `Version.ts` (or `Version.js` if you're one of _those_ people) with
your git SHA and version information exported as constants. For extra credit,
it also creates a [SemVer-compatible `release`
tag](https://semver.org/#spec-item-10) that looks like
`${version}+${gitSha.substr(0, 7)}`.

`import { release } from "./Version"` and you're done.

## Installation

`yarn add -D mkver` then add a `precompile` script that runs `mkver`. If you
don't compile your code, add it as a pre script for your test script and/or your
webpack/gulp/grunt/brunch/browserify/broccoli/parcel/babel/uglify pipeline in
your `package.json`:

```json
  "scripts": {
    ...
    "precompile": "mkver",
    "compile": "tsc",
    ...
  }
```

This will

* look for a `package.json` in `.`, then `..`, then `../..`, etc, and extract
  the `version` value.
* [exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
  `git rev-parse HEAD` (so having `git` available to the calling shell is a
  prerequisite. Please don't file a bug report for this.)
* write the contents to `Version.ts` by default. If you want to output an es6-compatible file, use `mkver version.js`. The file suffix will switch to rendering es6 automatically.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
