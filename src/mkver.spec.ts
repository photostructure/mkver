import { expect } from "chai"
import { execSync } from "child_process"
import { outputJsonSync } from "fs-extra"
import { directory } from "tempy"

import { mkver, ymdhms } from "./mkver"

require("source-map-support").install()

describe("mkver", () => {
  it("version.js", function() {
    // If we run the test right at a minute boundary, the timestamp might be
    // more than 2 digits wrong, so let's retry:
    this.retries(2)
    const d = directory()
    const version = "1.2.3"
    outputJsonSync(d + "/package.json", { version: "1.2.3" })
    execSync("git init", { cwd: d })
    execSync("git add package.json", { cwd: d })
    execSync("git config user.name anonymous", { cwd: d })
    execSync("git config user.email anon@example.com", { cwd: d })
    execSync("git commit --no-gpg-sign -m tst", { cwd: d })
    const gitSha = execSync("git rev-parse -q HEAD", { cwd: d })
      .toString()
      .trim()
    mkver(d, "version.js")

    const result = require(d + "/version.js")
    console.dir({ result })
    expect(result.gitSha).to.eql(gitSha)
    expect(result.gitDate).to.be.within(
      new Date(Date.now() - 2000) as any,
      new Date() as any
    )
    expect(result.version).to.eql("1.2.3")
    const expectedRelease = trimEnd("1.2.3+" + ymdhms(new Date()), 2)
    expect(trimEnd(result.release, 2)).to.eql(expectedRelease)
  })
})

function trimEnd(s: string, chars: number): string {
  return s.substring(0, s.length - chars)
}
