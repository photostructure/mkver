import { expect } from "chai";
import { fmtYMDHMS } from "./date";

describe("date", () => {
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
});
