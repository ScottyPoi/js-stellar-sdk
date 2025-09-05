import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as StellarSdk from '../../lib'

const { SERVER_TIME_MAP, getCurrentServerTime } = StellarSdk.Horizon;

describe("getCurrentServerTime", () => {
  let clock: ReturnType<typeof vi.useFakeTimers>;

  beforeEach(() => {
    // set it to 50 seconds
    clock = vi.useFakeTimers({
      now: 5050000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when the hostname hasn't been hit", () => {
    expect(getCurrentServerTime("host")).to.be.null;
  });

  it("returns null when no time is available", () => {
    SERVER_TIME_MAP.host = {} as any;
    expect(getCurrentServerTime("host")).to.be.null;
  });

  it("returns null when the old time is too old", () => {
    SERVER_TIME_MAP.host = {
      serverTime: 10,
      localTimeRecorded: 5,
    };
    expect(getCurrentServerTime("host")).to.be.null;
  });

  it("returns the delta between then and now", () => {
    SERVER_TIME_MAP.host = {
      serverTime: 10,
      localTimeRecorded: 5005,
    };
    expect(getCurrentServerTime("host")).to.equal(55);
  });
});
