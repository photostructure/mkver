import { expect } from "chai"
import { ChildProcess, execSync, fork, spawn } from "child_process"
import { writeFileSync, writeFile } from "fs"
import { parse } from "path"
import * as semver from "semver"
import { directory } from "tempy"
import { ymdhms } from "./mkver"

describe("mkver", function () {
  this.retries(2)

  it("./ver.js", async () => {
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/ver.js")
  })

  it("./ver.ts", async () => {
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/ver.ts")
  })

  if (semver.satisfies(process.version, ">=10.12.0")) {
    it("./testdir/version.js", async () => {
      const { gitSha, dir } = mkTestRepo()
      return assertResult(gitSha, dir + "/testdir/version.js")
    })
  }
})

const expVer = `${getRandomInt(15)}.${getRandomInt(15)}.${getRandomInt(15)}`

function mkTestRepo() {
  const dir = directory().replace(/\\/g, "/")
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

function cp2promise(cp: ChildProcess) {
  return new Promise((res, rej) => {
    cp.stderr?.on("data", rej)
    cp.stderr?.on("error", rej)
    cp.stdout?.on("error", rej)
    cp.stdout?.on("data", (b) => console.log(b.toString()))
    cp.on("error", rej)
    cp.on("exit", (code) => (code == 0 ? res() : rej("bad exit code " + code)))
  })
}

async function maybeCompile(pathToVersionFile: string): Promise<string> {
  if (pathToVersionFile.endsWith(".ts")) {
    const result = pathToVersionFile.replace(/\.ts$/, ".js")
    const parsed = parse(result)
    const rootDir = parsed.dir
    const destTs = rootDir + "/test.ts"
    writeFileSync(
      destTs,
      [
        `import { version, release, gitSha, gitDate } from "./${parsed.name}";`,
        `console.dir({ version, release, gitSha, gitDate });`,
      ].join("\n")
    )
    const args = ["--module", "commonjs", "--rootDir", rootDir, destTs]
    await cp2promise(spawn("node_modules/.bin/tsc", args))
    return result
  } else return pathToVersionFile
}

async function assertResult(gitSha: string, pathToVersionFile: string) {
  await cp2promise(fork("bin/mkver", [pathToVersionFile]))
  const pathToRequire = await maybeCompile(pathToVersionFile)
  const result = require(pathToRequire)
  expect(result.gitSha).to.eql(gitSha)
  expect(result.gitDate).to.be.within(
    new Date(Date.now() - 5000) as any,
    new Date() as any
  )
  expect(result.version).to.eql(expVer)

  // If we run the test right at a minute boundary, the timestamp might be more
  // than 2 digits wrong (hence the retries)

  const ymdhm = trimEnd(ymdhms(new Date()), 2)
  const expectedRelease = `${expVer}+${ymdhm}`
  const releaseWithoutSeconds = trimEnd(result.release, 2)
  expect(releaseWithoutSeconds).to.eql(expectedRelease)
}

function lazy<T>(thunk: () => T): () => T {
  let invoked = false
  let result: T
  return () => {
    if (!invoked) {
      invoked = true
      try {
        result = thunk()
      } catch (_) {}
    }
    return result
  }
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

function trimEnd(s: string, chars: number): string {
  return s.substring(0, s.length - chars)
}
