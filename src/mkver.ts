import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ParsedPath } from "node:path";
import { join, normalize, parse, resolve } from "node:path";
import { argv, exit } from "node:process";
import { promisify } from "node:util";
import * as semver from "semver";

const execFileP = promisify(execFile);

function notBlank(s: string | undefined): boolean {
  return s != null && String(s).trim().length > 0;
}

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
        throw new Error("No `version` field was found in " + path);
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

async function headSha(cwd: string): Promise<string> {
  const gitSha = (
    await execFileP("git", ["rev-parse", "-q", "HEAD"], { cwd })
  ).stdout
    .toString()
    .trim();
  console.log("headSha", { gitSha });
  if (gitSha.length < 40) {
    throw new Error("Unexpected git SHA: " + gitSha);
  } else {
    return gitSha;
  }
}

async function headUnixtime(cwd: string): Promise<Date> {
  const unixtimeStr = (
    await execFileP("git", ["log", "-1", "--pretty=format:%ct"], {
      cwd,
    })
  ).stdout.toString();
  const unixtime = parseInt(unixtimeStr);
  const date = new Date(unixtime * 1000);
  if (date > new Date() || date < new Date(2000, 0, 1)) {
    throw new Error("Unexpected unixtime for commit: " + unixtime);
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

// NOT FOR GENERAL USE. Only works for positive values.
function pad2(i: number) {
  const s = String(i);
  return s.length >= 2 ? s : ("0" + s).slice(-2);
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
  );
}

function renderVersionInfo(o: VersionInfo): string {
  const msg = [];
  const ext = o.path.ext.toLowerCase();
  const cjs = ext === ".js";
  const mjs = ext === ".mjs";
  const ts = ext === ".ts";
  if (!cjs && !mjs && !ts) {
    throw new Error(
      `Unsupported file extension (expected output, ${JSON.stringify(o.path)}, to end in .ts, .js, or .mjs)`,
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
 * and ".mjs".
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
      "No package.json was found in " + parsed.dir + " or parent directories.",
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

  try {
    await mkdir(parsed.dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }

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

if (require.main === module) {
  void main().catch((error) => {
    console.error("Failed: " + error);
    exit(1);
  });
}
