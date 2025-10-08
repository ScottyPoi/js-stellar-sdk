import { describe, it, expect } from 'vitest'
import _ from 'lodash'

describe("Browser version tests",  () => {
  it("lodash is not exported globally", () => {
    if (typeof window !== "undefined") {
      expect(typeof _ === "undefined").toBeTruthy();
    }
  });
});
