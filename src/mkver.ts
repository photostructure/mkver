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

function headSha(cwd: string): string {
  const gitSha = execSync("git rev-parse -q HEAD", { cwd })
    .toString()
    .trim()
  if (gitSha.length < 40) {
    throw new Error("Unexpected git SHA: " + gitSha)
  } else {
    return gitSha
  }
}

function headUnixtime(cwd: string): number {
  const unixtimeStr = execSync("git log -1 --pretty=format:%ct", {
    cwd
  }).toString()
  const unixtime = parseInt(unixtimeStr)
  const date = new Date(unixtime * 1000)
  if (date > new Date() || date < new Date(2000, 0, 1)) {
    throw new Error("Unexpected unixtime for commit: " + unixtime)
  }
  return unixtime
}

interface VersionInfo {
  output: string
  version: string
  gitSha: string
  /** unixtime */
  gitDate: number
}

function renderVersionInfo(o: VersionInfo): string {
  const msg = []
  const ts = o.output.endsWith(".ts")
  if (!ts) {
    msg.push(`"use strict";`, `exports.__esModule = true;`)
  }
  msg.push(
    `// ${o.output} built ${new Date().toISOString()}`,
    ``,
    ...[
      `version = "${o.version}"`,
      `gitSha = "${o.gitSha}"`,
      `gitDate = new Date(${o.gitDate * 1000})`,
      // Assume there won't be more than one build a minute:
      `release = "${o.version}+${o.gitDate.toString(36)}"`
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
    const gitSha = headSha(cwd)
    const gitDate = headUnixtime(cwd)
    const msg = renderVersionInfo({ output, version, gitSha, gitDate })
    outputFileSync(cwd + "/" + output, msg)
  } catch (err) {
    throw new Error(
      argv[1] + ": Failed to produce " + output + ":\n  " + err.message
    )
  }
}
