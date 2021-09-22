import { execSync } from "child_process"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, normalize, parse, resolve } from "path"
import { argv, cwd, exit } from "process"

function notBlank(s: string | undefined): boolean {
  return s != null && String(s).trim().length > 0
}

function findPackageVersion(
  dir: string
): undefined | { version: string; dir: string } {
  const path = resolve(join(dir, "package.json"))
  try {
    const json = JSON.parse(readFileSync(path).toString())
    if (json != null) {
      if (notBlank(json.version)) {
        return { version: json.version, dir }
      } else {
        throw new Error("No `version` field was found in " + path)
      }
    }
  } catch (err) {
    const parent = resolve(join(dir, ".."))
    if (resolve(dir) !== parent) {
      return findPackageVersion(parent)
    } else {
      throw err
    }
  }
}

function headSha(cwd: string): string {
  const gitSha = execSync("git rev-parse -q HEAD", { cwd }).toString().trim()
  if (gitSha.length < 40) {
    throw new Error("Unexpected git SHA: " + gitSha)
  } else {
    return gitSha
  }
}

function headUnixtime(cwd: string): Date {
  const unixtimeStr = execSync("git log -1 --pretty=format:%ct", {
    cwd,
  }).toString()
  const unixtime = parseInt(unixtimeStr)
  const date = new Date(unixtime * 1000)
  if (date > new Date() || date < new Date(2000, 0, 1)) {
    throw new Error("Unexpected unixtime for commit: " + unixtime)
  }
  return date
}

export interface VersionInfo {
  output: string
  version: string
  release: string
  gitSha: string
  gitDate: Date
}

// NOT FOR GENERAL USE. Only works for positive values.
function pad2(i: number) {
  const s = String(i)
  return s.length >= 2 ? s : ("0" + s).slice(-2)
}

/**
 * Appropriate for filenames: yMMddHHmmss
 */
export function fmtYMDHMS(d: Date): string {
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  )
}

function renderVersionInfo(o: VersionInfo): string {
  const msg = []
  const cjs = o.output.endsWith(".js")
  const mjs = o.output.endsWith(".mjs")
  const ts = o.output.endsWith(".ts")
  if (!cjs && !mjs && !ts) {
    throw new Error("Unsupported file extension")
  }

  if (cjs) {
    msg.push(
      `"use strict";`,
      `Object.defineProperty(exports, "__esModule", { value: true });`
    )
  }

  for (const ea of [
    `version = "${o.version}"`,
    `release = "${o.release}"`,
    `gitSha = "${o.gitSha}"`,
    `gitDate = new Date(${o.gitDate.getTime()})`,
  ]) {
    msg.push(cjs ? `exports.${ea};` : `export const ${ea};`)
  }

  if (ts || mjs) {
    msg.push("export default { version, release, gitSha, gitDate };")
  }
  return msg.join("\n") + "\n"
}

export function mkver(output: string = join(cwd(), "Version.ts")): void {
  const file = resolve(normalize(output))
  const parsed = parse(file)
  try {
    const v = findPackageVersion(parsed.dir)
    if (v == null) {
      throw new Error(
        "No package.json was found in " + parsed.dir + " or parent directories."
      )
    }
    const gitSha = headSha(v.dir)
    const gitDate = headUnixtime(v.dir)
    const msg = renderVersionInfo({
      output,
      version: v.version,
      release: `${v.version}+${fmtYMDHMS(gitDate)}`,
      gitSha,
      gitDate,
    })

    try {
      mkdirSync(parsed.dir, { recursive: true })
    } catch (err: any) {
      if (err.code !== "EEXIST") throw err
    }

    writeFileSync(file, msg)
  } catch (err: any) {
    console.error(
      argv[1] + ": Failed to produce " + output + ": " + err.message
    )
    exit(1)
  }
}
