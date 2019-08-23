import { expect } from "chai"
import { execSync, fork } from "child_process"
import { writeFileSync } from "fs"
import { version } from "process"
import { directory } from "tempy"

import { ymdhms } from "./mkver"

const semver = require("semver")

describe("mkver", () => {
  before(function() {
    this.retries(2)
  })

  it("./ver.js", async () => {
    const { gitSha, dir } = mkTestRepo()
    return assertResult(gitSha, dir + "/ver.js")
  })

  if (semver.satisfies(process.version, ">=10.12.0")) {
    it("./testdir/version.js", async () => {
      const { gitSha, dir } = mkTestRepo()
      return assertResult(gitSha, dir +  "/testdir/version.js")
    })
  }
})

const expVer = `${getRandomInt(15)}.${getRandomInt(15)}.${getRandomInt(15)}`

const mkTestRepo = lazy(() => {
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
})

async function assertResult(gitSha: string, pathToVersionJs: string) {
  const cp = fork("bin/mkver", [pathToVersionJs])
  await new Promise(res => cp.on("close", res))
  const result = require(pathToVersionJs)
  expect(result.gitSha).to.eql(gitSha)
  expect(result.gitDate).to.be.within(
    new Date(Date.now() - 2000) as any,
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
