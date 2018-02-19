import { expect } from "chai"
import { execSync } from "child_process"
import { outputJsonSync } from "fs-extra"
import { cwd } from "process"
import { directory } from "tempy"

import { mkver } from "./mkver"

require("source-map-support").install()

describe("mkver", () => {
  it("version.js", () => {
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
    expect(result.gitSha).to.eql(gitSha)
    expect(result.version).to.eql("1.2.3")
    expect(result.release).to.eql("1.2.3+" + gitSha.substr(0, 7))
  })
})
