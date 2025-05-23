# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mkver is a Node.js CLI tool that generates version metadata files from package.json and git information. It outputs TypeScript (.ts), ES modules (.mjs), or CommonJS (.js) files containing version, git SHA, git date, and semver-compatible release tags.

## Core Architecture

- **Single-file CLI**: `src/mkver.ts` contains the entire implementation
- **Key functions**:
  - `findPackageVersion()`: Recursively searches for package.json starting from target directory
  - `headSha()` & `headUnixtime()`: Extract git commit information using `git rev-parse` and `git log`
  - `renderVersionInfo()`: Generates output in TypeScript, ES module, or CommonJS format based on file extension
  - `mkver()`: Main function coordinating the version file generation

## Development Commands

```bash
# Build the project (compiles TypeScript and makes executable)
npm run make

# Run tests (builds first, then lints, then runs mocha)
npm test

# Lint and format
npm run lint
npm run prettier

# Clean build artifacts
npm run premake
```

## Testing

- Uses Mocha with Chai assertions
- Tests create temporary git repositories with random version numbers
- Tests verify output for .js, .mjs, and .ts formats
- Run single test: `mocha dist/**/*.spec.js --grep "pattern"`

## Output Format Logic

The tool determines output format by file extension:
- `.ts`: TypeScript with `export const` declarations and default export
- `.mjs`: ES modules with `export const` declarations and default export
- `.js`: CommonJS with `exports.field = value` assignments (no default export)
- `.cjs`: CommonJS with `exports.field = value` assignments (no default export)

All ESM formats include a default export object and semver parsing for major/minor/patch/prerelease fields.

## ESM Migration Notes

This package is now ESM-first but maintains backward compatibility:
- The CLI tool itself runs as ESM 
- Generated files still support both CJS and ESM based on user's chosen file extension
- Tests use `spawn("node", ["dist/mkver.js"])` instead of `fork("dist/mkver")` for ESM compatibility

## Git Requirements

The tool requires `git` to be available in PATH and expects to run in a git repository with at least one commit.