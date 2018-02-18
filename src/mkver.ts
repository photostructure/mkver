import { execSync } from "child_process"
import { readJsonSync, outputFileSync } from "fs-extra"
import { join, resolve } from "path"
import { argv, cwd, exit } from "process"

function notBlank(s: string | undefined): boolean {
  return s != null && String(s).trim().length > 0
}

function findPackageVersion(dir: string): string | undefined {
  const path = resolve(join(dir, "package.json"))
  const json = readJsonSync(path, { throws: false })
  if (json != null) {
    if (notBlank(json.version)) {
      return json.version
    } else {
      throw new Error("No `version` field was found in " + path)
    }
  }
  const parent = resolve(join(dir, "../"))
  if (resolve(dir) !== parent) {
    return findPackageVersion(parent)
  }
}

export function mkver(cwd: string, output: string): void {
  try {
    const version = findPackageVersion(cwd)
    if (version == null)
      throw new Error(
        "No package.json was found in " + cwd + " or parent directories."
      )
    const gitSha = execSync("git rev-parse -q HEAD", { cwd })
      .toString()
      .trim()
    if (gitSha.length < 40) {
      throw new Error("Unexpected git SHA: " + gitSha)
    }
    const msg = []
    const ts = output.endsWith(".ts")
    if (!ts) {
      msg.push(`"use strict";`)
      msg.push(`exports.__esModule = true;`)
    }
    msg.push(
      ``,
      `// ${output} built ${new Date().toISOString()}`,
      ...[
        `version = "${version}"`,
        `gitSha = "${gitSha}"`,
        `builtAtMs = ${Date.now()}`,
        // https://semver.org/#spec-item-10 : Build metadata MAY be denoted by
        // appending a plus sign and a series of dot separated identifiers
        // immediately following the patch or pre-release version.
        `release = "${version}+${gitSha.substr(0, 7)}"`
      ].map(ea => (ts ? `export const ${ea};` : `exports.${ea};`)),
      ``
    )
    outputFileSync(cwd + "/" + output, msg.join("\n"))
  } catch (err) {
    throw new Error(
      argv[1] + ": Failed to produce " + output + ":\n  " + err.message
    )
  }
}
