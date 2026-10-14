// src/lib/fortune/__tests__/profile-storage.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  BIRTH_PROFILE_STORAGE_KEY,
  clearBirthProfile,
  parseBirthProfile,
  saveBirthProfile,
  useBirthProfile,
} from "../profile-storage";
import type { BirthProfile } from "../types";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((k: string) => store[k] ?? null),
  setItem: vi.fn((k: string, v: string) => {
    store[k] = v;
  }),
  removeItem: vi.fn((k: string) => {
    delete store[k];
  }),
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(store)) delete store[k];
  localStorageMock.getItem.mockImplementation((k: string) => store[k] ?? null);
  localStorageMock.setItem.mockImplementation((k: string, v: string) => {
    store[k] = v;
  });
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

const valid: BirthProfile = {
  version: 1,
  date: { year: 1990, month: 3, day: 29 },
  time: { kind: "hour", hour: 14 },
  prefecture: "13",
  gender: "female",
};

describe("parseBirthProfile", () => {
  it("正しいデータを読み込めること", () => {
    expect(parseBirthProfile(JSON.stringify(valid))).toEqual(valid);
    expect(parseBirthProfile(JSON.stringify({ ...valid, prefecture: undefined, gender: undefined }))).toEqual({
      version: 1,
      date: valid.date,
      time: valid.time,
    });
  });

  it("不正なデータは null にすること", () => {
    expect(parseBirthProfile(null)).toBeNull();
    expect(parseBirthProfile("not json")).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, version: 2 }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: 2025, month: 2, day: 29 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: 1899, month: 1, day: 1 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, time: { kind: "hour", hour: 24 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, time: { kind: "half", half: "noon" } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, prefecture: "48" }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, gender: "other" }))).toBeNull();
  });

  it("未来の日付は null にすること", () => {
    const y = new Date().getFullYear() + 1;
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: y, month: 1, day: 1 } }))).toBeNull();
  });
});

function Probe() {
  const { ready, profile } = useBirthProfile();
  return <p>{ready ? (profile ? `${profile.date.year}` : "none") : "loading"}</p>;
}

describe("useBirthProfile", () => {
  it("保存・削除に追従すること", () => {
    render(<Probe />);
    expect(screen.getByText("none")).toBeInTheDocument();
    act(() => {
      expect(saveBirthProfile(valid)).toBe(true);
    });
    expect(screen.getByText("1990")).toBeInTheDocument();
    expect(store[BIRTH_PROFILE_STORAGE_KEY]).toBeDefined();
    act(() => clearBirthProfile());
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("不正なプロフィールは保存せず false を返すこと", () => {
    const invalid = { ...valid, time: { kind: "hour", hour: 24 } } as BirthProfile;
    expect(saveBirthProfile(invalid)).toBe(false);
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(BIRTH_PROFILE_STORAGE_KEY, expect.anything());
    expect(store[BIRTH_PROFILE_STORAGE_KEY]).toBeUndefined();
  });

  it("localStorage が使えなくても落ちないこと", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<Probe />);
    expect(screen.getByText("none")).toBeInTheDocument();
    act(() => {
      expect(saveBirthProfile(valid)).toBe(false);
    });
  });
});
