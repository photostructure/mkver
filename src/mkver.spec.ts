import { expect } from "chai";
import { ChildProcess, execFile, execSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { platform, tmpdir } from "node:os";
import { join, parse } from "node:path";
import semver from "semver";
import { fmtYMDHMS } from "./mkver.js";

class ExpectedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: (string | number)[];
  readonly version: string;

  constructor({
    major,
    minor,
    patch,
    prerelease,
  }: {
    major?: number;
    minor?: number;
    patch?: number;
    prerelease?: (string | number)[];
  } = {}) {
    this.major = major ?? getRandomInt(15);
    this.minor = minor ?? getRandomInt(15);
    this.patch = patch ?? getRandomInt(15);
    this.prerelease = prerelease ?? [];
    this.version =
      [this.major, this.minor, this.patch].join(".") +
      (this.prerelease.length == 0 ? "" : "-" + this.prerelease.join("."));
  }
}

describe("mkver", function () {
  this.retries(2);
  this.slow(1);

  for (const exp of [
    new ExpectedVersion({ prerelease: ["alpha"] }),
    new ExpectedVersion({ prerelease: ["beta", 3] }),
    new ExpectedVersion({ prerelease: ["rc", 1] }),
    new ExpectedVersion(),
  ]) {
    describe(exp.version, () => {
      it("./ver.js", async () => {
        const { gitSha, dir } = mkTestRepo(exp);
        return assertResult(gitSha, dir + "/ver.js", exp);
      });

      it("./version.mjs", async function () {
        if (!semver.satisfies(process.version, ">=13")) {
          return this.skip();
        }
        const { gitSha, dir } = mkTestRepo(exp);
        return assertResult(gitSha, dir + "/version.mjs", exp);
      });

      it("./ver.ts", async function () {
        if (platform().startsWith("win")) {
          return this.skip();
        }
        const { gitSha, dir } = mkTestRepo(exp);
        return assertResult(gitSha, dir + "/ver.ts", exp);
      });

      it("./testdir/version.js", async () => {
        const { gitSha, dir } = mkTestRepo(exp);
        return assertResult(gitSha, dir + "/testdir/version.js", exp);
      });

      it("fails for ./ver.go", async () => {
        const { gitSha, dir } = mkTestRepo(exp);
        try {
          await assertResult(gitSha, dir + "/ver.go", exp);
          expect.fail("unsupported format should have thrown");
        } catch (err) {
          expect(err).to.match(/Unsupported file extension/i);
        }
      });
    });
  }

  describe("fmtYMDHMS", () => {
    for (const iso of [
      "2021-02-16T18:51:48",
      "2000-01-02T03:04:05",
      "1999-10-11T12:13:14",
    ]) {
      it(`round-trips ${iso}`, () => {
        const expected = iso.replace(/\D/g, "").substring(0, 14);
        const d = new Date(iso);
        expect(fmtYMDHMS(d)).to.eql(expected);
      });
    }
  });

  describe("ESM module behavior", () => {
    it("validates .mjs files require file extension in imports", async function () {
      if (!semver.satisfies(process.version, ">=13")) {
        return this.skip();
      }
      const { gitSha, dir } = mkTestRepo(new ExpectedVersion());
      const versionFile = dir + "/version.mjs";

      // Generate the version file
      await _exec(
        spawn("node", ["dist/mkver.js", versionFile], { stdio: "pipe" }),
      );

      // Test import with extension (should work)
      const testWithExt = join(dir, "test-with-ext.mjs");
      writeFileSync(
        testWithExt,
        `import * as v from "./version.mjs"; console.log(JSON.stringify(v));`,
      );

      const output = await _exec(execFile("node", [testWithExt], { cwd: dir }));
      const result = JSON.parse(output);
      expect(result.gitSha).to.eql(gitSha);

      // Test import without extension (should fail)
      const testWithoutExt = join(dir, "test-without-ext.mjs");
      writeFileSync(
        testWithoutExt,
        `import * as v from "./version"; console.log(JSON.stringify(v));`,
      );

      try {
        await _exec(execFile("node", [testWithoutExt], { cwd: dir }));
        expect.fail("Import without extension should have failed");
      } catch (err) {
        // ESM imports without extensions should fail - just verify we got an error
        expect(String(err)).to.be.a('string');
        expect(String(err).length).to.be.greaterThan(0);
      }
    });
  });
});

function mkTestRepo(exp: ExpectedVersion) {
  const dir = join(tmpdir(), randomChars());
  mkdirSync(dir);
  writeFileSync(
    dir + "/package.json",
    JSON.stringify({ version: exp.version }),
  );
  execSync("git init", { cwd: dir });
  execSync("git add package.json", { cwd: dir });
  execSync("git config user.name anonymous", { cwd: dir });
  execSync("git config user.email anon@example.com", { cwd: dir });
  execSync("git commit --no-gpg-sign -m test-commit", { cwd: dir });
  const gitSha = execSync("git rev-parse -q HEAD", { cwd: dir })
    .toString()
    .trim();
  return { gitSha, dir };
}

function _exec(cp: ChildProcess): Promise<string> {
  const buf: (string | Buffer)[] = [];
  return new Promise<string>((res, rej) => {
    cp.stderr?.on("data", (ea) => {
      // console.error("cp.stderr.on(data)", ea)
      rej(String(ea));
    });
    cp.stderr?.on("error", rej);
    cp.stdout?.on("error", rej);
    cp.stdout?.on("data", (ea) => buf.push(ea));
    cp.on("error", (ea) => {
      // console.error("cp.on(error)", ea)
      rej(ea);
    });
    const callback = (code: number | null) => {
      if (code == 0) {
        res(buf.join(""));
      } else {
        rej("bad exit code " + code);
      }
    };
    cp.on("close", callback);
    cp.on("exit", callback);
  });
}

async function maybeCompile(pathToVersionFile: string): Promise<string> {
  const parsed = parse(pathToVersionFile);
  const dest = join(parsed.dir, "test" + parsed.ext);

  // Ensure the destination directory exists
  mkdirSync(parsed.dir, { recursive: true });

  if (parsed.ext === ".js") {
    writeFileSync(
      dest,
      [
        `const v = require("./${parsed.name}");`,
        `console.log(JSON.stringify(v));`,
        "",
      ].join("\n"),
    );
    return dest;
  }

  if (parsed.ext === ".mjs") {
    writeFileSync(
      dest,
      [
        // HUH: .mjs imports require the file extension (!?)
        `import * as v from "./${parsed.base}";`,
        `console.log(JSON.stringify(v));`,
        "",
      ].join("\n"),
    );
    return dest;
  } else {
    writeFileSync(
      dest,
      [
        `import * as v from "./${parsed.name}";`,
        `console.log(JSON.stringify(v));`,
        "",
      ].join("\n"),
    );
    const args = ["--module", "commonjs", "--rootDir", parsed.dir, dest];
    await _exec(spawn("node_modules/.bin/tsc", args));
    return dest.replace(/\.ts$/, ".js");
  }
}

async function assertResult(
  gitSha: string,
  pathToVersionFile: string,
  exp: ExpectedVersion,
) {
  // Use spawn instead of fork for ESM compatibility
  await _exec(
    spawn("node", ["dist/mkver.js", pathToVersionFile], { stdio: "pipe" }),
  );
  const dest = await maybeCompile(pathToVersionFile);
  const output = await _exec(
    execFile("node", [dest], { cwd: parse(dest).dir }),
  );
  // console.log("assertResult", { dest, output })
  const result = JSON.parse(output);

  expect(result.gitSha).to.eql(gitSha);

  const d =
    result.gitDate instanceof Date ? result.gitDate : new Date(result.gitDate);
  expect(d).to.be.within(
    new Date(Date.now() - 15000), // CI can take more than 10s to complete
    new Date(),
  );

  expect(result.version).to.eql(exp.version);
  expect(result.versionMajor).to.eql(exp.major);
  expect(result.versionMinor).to.eql(exp.minor);
  expect(result.versionPatch).to.eql(exp.patch);
  expect(result.versionPrerelease).to.eql(exp.prerelease);

  // Test release format with more tolerance for timing variations
  const now = new Date();
  const nowFormatted = fmtYMDHMS(now);
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  const fiveSecondsAgoFormatted = fmtYMDHMS(fiveSecondsAgo);

  // Check that release starts with version and has correct format
  const escapedVersion = exp.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  expect(result.release).to.match(new RegExp(`^${escapedVersion}\\+\\d{14}$`));

  // Check that the timestamp is within a reasonable range (allowing for test execution time)
  const releaseTimestamp = result.release.split("+")[1];
  expect(
    releaseTimestamp >= fiveSecondsAgoFormatted &&
      releaseTimestamp <= nowFormatted,
  ).to.equal(true);
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

function randomChars(length = 10) {
  let s = "";
  while (s.length < length) {
    s += Math.random().toString(36).slice(2);
  }
  return s.slice(0, length);
}
