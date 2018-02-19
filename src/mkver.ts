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

function revParseHead(cwd: string): string {
  const gitSha = execSync("git rev-parse -q HEAD", { cwd })
    .toString()
    .trim()
  if (gitSha.length < 40) {
    throw new Error("Unexpected git SHA: " + gitSha)
  } else {
    return gitSha
  }
}

interface VersionInfo {
  output: string
  version: string
  gitSha: string
}

function renderVersionInfo(o: VersionInfo): string {
  const msg = []
  const ts = o.output.endsWith(".ts")
  if (!ts) {
    msg.push(`"use strict";`, `exports.__esModule = true;`)
  }
  msg.push(
    ``,
    `// ${o.output} built ${new Date().toISOString()}`,
    ...[
      `version = "${o.version}"`,
      `gitSha = "${o.gitSha}"`,
      `builtAtMs = ${Date.now()}`,
      `release = "${o.version}+${o.gitSha.substr(0, 7)}"`
    ].map(ea => (ts ? `export const ${ea};` : `exports.${ea};`)),
    ``
  )
  return msg.join("\n")
}

export function mkver(cwd: string, output: string): void {
  try {
    const version = findPackageVersion(cwd)
    if (version == null) {
      throw new Error(
        "No package.json was found in " + cwd + " or parent directories."
      )
    }
    const gitSha = revParseHead(cwd)
    const msg = renderVersionInfo({ output, version, gitSha })
    outputFileSync(cwd + "/" + output, msg)
  } catch (err) {
    throw new Error(
      argv[1] + ": Failed to produce " + output + ":\n  " + err.message
    )
  }
}
