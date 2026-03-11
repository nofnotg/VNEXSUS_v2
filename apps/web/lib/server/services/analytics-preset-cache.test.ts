import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOwnedPresetCache,
  getPresetCacheStatsSnapshot,
  getSharedPresetCache,
  invalidatePresetCaches,
  resetPresetCacheStateForTests,
  setOwnedPresetCache,
  setSharedPresetCache
} from "./analytics-preset-cache";

describe("analytics preset cache", () => {
  beforeEach(() => {
    resetPresetCacheStateForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetPresetCacheStateForTests();
  });

  it("tracks cache hits and misses for owned presets", () => {
    expect(getOwnedPresetCache("user-1")).toBeNull();
    setOwnedPresetCache("user-1", [{ presetId: "preset-1" }]);
    expect(getOwnedPresetCache("user-1")).toEqual([{ presetId: "preset-1" }]);

    const snapshot = getPresetCacheStatsSnapshot();
    expect(snapshot.owned.misses).toBe(1);
    expect(snapshot.owned.hits).toBe(1);
    expect(snapshot.owned.size).toBe(1);
  });

  it("invalidates owned and shared cache entries", () => {
    setOwnedPresetCache("user-1", [{ presetId: "preset-1" }]);
    setSharedPresetCache("reviewer@example.com", [{ presetId: "preset-2" }]);

    invalidatePresetCaches({
      ownerUserId: "user-1",
      sharedEmails: ["reviewer@example.com"]
    });

    expect(getOwnedPresetCache("user-1")).toBeNull();
    expect(getSharedPresetCache("reviewer@example.com")).toBeNull();
  });

  it("expires stale cache entries based on ttl", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);
    setSharedPresetCache("reviewer@example.com", [{ presetId: "preset-2" }]);

    nowSpy.mockReturnValue(62_000);
    expect(getSharedPresetCache("reviewer@example.com")).toBeNull();

    const snapshot = getPresetCacheStatsSnapshot();
    expect(snapshot.shared.misses).toBe(1);
    expect(snapshot.shared.size).toBe(0);
  });
});
