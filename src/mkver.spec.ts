import { expect } from "chai"
import { ChildProcess, execFile, execSync, fork, spawn } from "child_process"
import { mkdirSync, writeFileSync } from "fs"
import { platform, tmpdir } from "os"
import { join, parse } from "path"
import * as semver from "semver"
import { fmtYMDHMS } from "./mkver"

describe("mkver", function () {
  this.retries(2)
  this.slow(1)

  it("./ver.js", async () => {
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/ver.js")
  })

  it("./version.mjs", async function () {
    if (!semver.satisfies(process.version, ">=13")) {
      return this.skip()
    }
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/version.mjs")
  })

  it("./ver.ts", async function () {
    if (platform().startsWith("win")) {
      return this.skip()
    }
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/ver.ts")
  })

  it("./testdir/version.js", async () => {
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/testdir/version.js")
  })

  it("fails for ./ver.go", async () => {
    const { gitSha, dir } = mkTestRepo()
    try {
      await assertResult(gitSha, dir + "/ver.go")
      expect.fail("unsupported format should have thrown")
    } catch (err) {
      expect(err).to.match(/Unsupported file extension/i)
    }
  })

  describe("fmtYMDHMS", () => {
    for (const iso of [
      "2021-02-16T18:51:48",
      "2000-01-02T03:04:05",
      "1999-10-11T12:13:14",
    ]) {
      it(`round-trips ${iso}`, () => {
        const expected = iso.replace(/\D/g, "").substring(0, 14)
        const d = new Date(iso)
        expect(fmtYMDHMS(d)).to.eql(expected)
      })
    }
  })
})

const expVer = `${getRandomInt(15)}.${getRandomInt(15)}.${getRandomInt(15)}`

function mkTestRepo() {
  const dir = join(tmpdir(), randomChars())
  mkdirSync(dir)
  writeFileSync(dir + "/package.json", JSON.stringify({ version: expVer }))
  execSync("git init", { cwd: dir })
  execSync("git add package.json", { cwd: dir })
  execSync("git config user.name anonymous", { cwd: dir })
  execSync("git config user.email anon@example.com", { cwd: dir })
  execSync("git commit --no-gpg-sign -m test-commit", { cwd: dir })
  const gitSha = execSync("git rev-parse -q HEAD", { cwd: dir })
    .toString()
    .trim()
  return { gitSha, dir }
}

function _exec(cp: ChildProcess): Promise<string> {
  const buf: (string | Buffer)[] = []
  return new Promise<string>((res, rej) => {
    cp.stderr?.on("data", (ea) => {
      // console.error("cp.stderr.on(data)", ea)
      rej(String(ea))
    })
    cp.stderr?.on("error", rej)
    cp.stdout?.on("error", rej)
    cp.stdout?.on("data", (ea) => buf.push(ea))
    cp.on("error", (ea) => {
      // console.error("cp.on(error)", ea)
      rej(ea)
    })
    cp.on("close", (code) => {
      // console.error("cp.on(close)", { code })
      code == 0 ? res(buf.join("")) : rej("bad exit code " + code)
    })
    cp.on("exit", (code) => {
      // console.error("cp.on(exit)", { code })
      code == 0 ? res(buf.join("")) : rej("bad exit code " + code)
    })
  })
}

async function maybeCompile(pathToVersionFile: string): Promise<string> {
  const parsed = parse(pathToVersionFile)
  const dest = join(parsed.dir, "test" + parsed.ext)

  if (parsed.ext === ".js") {
    writeFileSync(
      dest,
      [
        `const { version, release, gitSha, gitDate } = require("./${parsed.name}");`,
        `console.log(JSON.stringify({ version, release, gitSha, gitDate }));`,
        "",
      ].join("\n")
    )
    return dest
  }

  if (parsed.ext === ".mjs") {
    writeFileSync(
      dest,
      [
        // HUH: .mjs imports require the file extension (!?)
        `import { version, release, gitSha, gitDate } from "./${parsed.base}";`,
        `console.log(JSON.stringify({ version, release, gitSha, gitDate }));`,
        "",
      ].join("\n")
    )
    return dest
  } else {
    writeFileSync(
      dest,
      [
        `import { version, release, gitSha, gitDate } from "./${parsed.name}";`,
        `console.log(JSON.stringify({ version, release, gitSha, gitDate }));`,
        "",
      ].join("\n")
    )
    const args = ["--module", "commonjs", "--rootDir", parsed.dir, dest]
    await _exec(spawn("node_modules/.bin/tsc", args))
    return dest.replace(/\.ts$/, ".js")
  }
}

async function assertResult(gitSha: string, pathToVersionFile: string) {
  await _exec(
    fork("bin/mkver", [pathToVersionFile], { detached: false, stdio: "pipe" })
  )
  const dest = await maybeCompile(pathToVersionFile)
  const output = await _exec(execFile("node", [dest], { cwd: parse(dest).dir }))
  // console.log("assertResult", { dest, output })
  const result = JSON.parse(output)

  expect(result.gitSha).to.eql(gitSha)

  const d =
    result.gitDate instanceof Date ? result.gitDate : new Date(result.gitDate)
  expect(d).to.be.within(
    new Date(Date.now() - 15000) as any, // CI can take more than 10s to complete
    new Date() as any
  )

  expect(result.version).to.eql(expVer)

  // If we run the test right at a minute boundary, the timestamp might be more
  // than 2 digits wrong (hence the retries)

  const ymdhm = trimEnd(fmtYMDHMS(new Date()), 2)
  const expectedRelease = `${expVer}+${ymdhm}`
  const releaseWithoutSeconds = trimEnd(result.release, 2)
  expect(releaseWithoutSeconds).to.eql(expectedRelease)
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

function trimEnd(s: string, chars: number): string {
  return s.substring(0, s.length - chars)
}

function randomChars(length = 10) {
  let s = ""
  while (s.length < length) {
    s += Math.random().toString(36).slice(2)
  }
  return s.slice(0, length)
}
