#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ParsedPath } from "node:path";
import { join, normalize, parse, resolve } from "node:path";
import { argv, exit } from "node:process";
import { promisify } from "node:util";
import semver from "semver";
import { fmtYMDHMS } from "./date";

const execFileP = promisify(execFile);

function notBlank(s: string | undefined): boolean {
  return s != null && String(s).trim().length > 0;
}

/**
 * Recursively searches for package.json starting from the given directory,
 * moving up the directory tree until found or reaching the filesystem root.
 *
 * @param dir - The directory to start searching from
 * @returns Promise resolving to version and directory info, or undefined if not found
 * @throws Error if package.json is found but has no version field
 */

async function findPackageVersion(
  dir: string,
): Promise<undefined | { version: string; dir: string }> {
  const path = resolve(join(dir, "package.json"));
  try {
    const json = JSON.parse((await readFile(path)).toString());
    if (json != null) {
      if (notBlank(json.version)) {
        return { version: json.version, dir };
      } else {
        throw new Error("No version field found in " + path);
      }
    }
  } catch (err) {
    const parent = resolve(join(dir, ".."));
    if (resolve(dir) !== parent) {
      return findPackageVersion(parent);
    } else {
      throw err;
    }
  }
}

/**
 * Retrieves the current git commit SHA from the specified directory.
 *
 * @param cwd - The working directory to run git command in
 * @returns Promise resolving to the 40-character commit SHA
 * @throws Error if git command fails or returns invalid SHA
 */
async function headSha(cwd: string): Promise<string> {
  const gitSha = (
    await execFileP("git", ["rev-parse", "-q", "HEAD"], { cwd })
  ).stdout
    .toString()
    .trim();
  if (gitSha.length !== 40 || !/^[a-f0-9]{40}$/i.test(gitSha)) {
    throw new Error("Invalid git SHA: " + gitSha);
  } else {
    return gitSha;
  }
}

/**
 * Retrieves the commit date of the current git HEAD as a Date object.
 *
 * @param cwd - The working directory to run git command in
 * @returns Promise resolving to the Date of the commit
 * @throws Error if git command fails or returns invalid timestamp
 */
async function headUnixtime(cwd: string): Promise<Date> {
  const unixtimeStr = (
    await execFileP("git", ["log", "-1", "--pretty=format:%ct"], {
      cwd,
    })
  ).stdout.toString();
  const unixtime = parseInt(unixtimeStr);
  const date = new Date(unixtime * 1000);
  if (date > new Date() || date < new Date(2000, 0, 1)) {
    throw new Error("Invalid commit timestamp: " + unixtime);
  }
  return date;
}

export interface VersionInfo {
  path: ParsedPath;
  version: string;
  release: string;
  gitSha: string;
  gitDate: Date;
}

/**
 * Renders version information into the appropriate format based on file extension.
 * Supports TypeScript (.ts), ES modules (.mjs), and CommonJS (.js/.cjs) formats.
 *
 * @param o - The version information object to render
 * @returns The formatted code as a string
 * @throws Error if the file extension is not supported
 */
function renderVersionInfo(o: VersionInfo): string {
  const msg = [];
  const ext = o.path.ext.toLowerCase();
  // .js maintains CommonJS for backward compatibility, .cjs is explicit CommonJS
  const cjs = ext === ".js" || ext === ".cjs";
  const mjs = ext === ".mjs";
  const ts = ext === ".ts";
  if (!cjs && !mjs && !ts) {
    throw new Error(
      `Unsupported file extension: expected ${JSON.stringify(o.path)} to end in .ts, .js, .mjs, or .cjs`,
    );
  }

  if (cjs) {
    msg.push(
      `"use strict";`,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
    );
  }

  const parsed = semver.parse(o.version);

  const fields: string[] = [];

  for (const { field, value } of [
    { field: "version", value: o.version },
    { field: "versionMajor", value: parsed?.major },
    { field: "versionMinor", value: parsed?.minor },
    { field: "versionPatch", value: parsed?.patch },
    { field: "versionPrerelease", value: parsed?.prerelease },
    { field: "release", value: o.release },
    { field: "gitSha", value: o.gitSha },
    { field: "gitDate", value: o.gitDate },
  ]) {
    if (value != null) {
      fields.push(field);
      const strVal =
        value instanceof Date
          ? `new Date(${value.getTime()})`
          : JSON.stringify(value);
      const ea = `${field} = ${strVal}`;
      msg.push(cjs ? `exports.${ea};` : `export const ${ea};`);
    }
  }

  if (ts || mjs) {
    msg.push(`export default {${fields.join(",")}};`);
  }
  return msg.join("\n") + "\n";
}

/**
 * Writes a file with version and release metadata to `output`
 *
 * @param output - The file to write to. Defaults to "./Version.ts". File format
 * is determined by the file extension. Supported extensions are ".ts", ".js",
 * ".mjs", and ".cjs".
 * @returns The version and release metadata written to the file.
 */
export async function mkver(output?: string): Promise<VersionInfo> {
  if (output == null || output.trim().length === 0) {
    output = "./Version.ts";
  }
  const file = resolve(normalize(output));
  const parsed = parse(file);
  const v = await findPackageVersion(parsed.dir);
  if (v == null) {
    throw new Error(
      "No package.json found in " + parsed.dir + " or parent directories",
    );
  }
  const gitSha = await headSha(v.dir);
  const gitDate = await headUnixtime(v.dir);
  const versionInfo = {
    path: parsed,
    version: v.version,
    release: `${v.version}+${fmtYMDHMS(gitDate)}`,
    gitSha,
    gitDate,
  };
  const buf = renderVersionInfo(versionInfo);

  await mkdir(parsed.dir, { recursive: true });

  await writeFile(file, buf);

  return versionInfo;
}

async function main() {
  const arg = argv[2] ?? "";

  if (["--help", "-h"].includes(arg)) {
    // Show them usage instructions:
    console.log(`Usage: mkver [FILE] 
Provides Node.js access to your app's version and release metadata.

With no FILE, default output is "./Version.ts".

See <https://github.com/photostructure/mkver> for more information.`);
  } else {
    return mkver(arg);
  }
}

// CommonJS entry point check
if (require.main === module) {
  main().catch((error) => {
    console.error("Failed: " + error);
    exit(1);
  });
}
