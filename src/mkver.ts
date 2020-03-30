import { execSync } from "child_process"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, normalize, parse, resolve } from "path"
import { argv, cwd } from "process"

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

export function ymdhms(d: Date): string {
  // NOTE: I thought about only including the hour, or the hour and minute, but
  // this value is still < Javascript's max integer (2^53), so the whole thing
  // is fine (and probably a bit more defensible to the Engineers of Tomorrow).
  // Math.log2(20180919202444) = 44.1

  return d
    .toISOString()
    .replace(/[^0-9]/g, "")
    .substring(0, 14)
}

function renderVersionInfo(o: VersionInfo): string {
  const msg = []
  const ts = o.output.endsWith(".ts")
  if (!ts) {
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
    msg.push(ts ? `export const ${ea};` : `exports.${ea};`)
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
      release: `${v.version}+${ymdhms(gitDate)}`,
      gitSha,
      gitDate,
    })

    try {
      mkdirSync(parsed.dir, { recursive: true })
    } catch (err) {
      if (err.code !== "EEXIST") throw err
    }

    writeFileSync(file, msg)
  } catch (err) {
    throw new Error(
      argv[1] + ": Failed to produce " + output + ":\n  " + err.message
    )
  }
}
