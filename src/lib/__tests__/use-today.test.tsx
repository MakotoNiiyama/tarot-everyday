import { describe, it, expect, vi, afterEach } from "vitest";
import { render, renderHook, screen } from "@testing-library/react";
import { useToday, useTodayKey, useTodayLocalDate } from "../use-today";

function Probe() {
  const today = useToday();
  return <p>{today ? `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}` : "none"}</p>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useToday", () => {
  it("日本時間の今日の0時の Date を返すこと", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 日本時間 2026-10-14 15:30
    vi.setSystemTime(new Date("2026-10-14T06:30:00Z"));
    render(<Probe />);
    expect(screen.getByText("2026-10-14 0")).toBeInTheDocument();
  });

  it("日付が同じなら再描画しても同じ参照を返すこと", () => {
    const { result, rerender } = renderHook(() => useToday());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useTodayKey", () => {
  it("日本時間の日付を YYYY-MM-DD で返すこと", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // UTC では 10/14 だが日本時間では 10/15
    vi.setSystemTime(new Date("2026-10-14T16:00:00Z"));
    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe("2026-10-15");
  });
});

describe("useTodayLocalDate", () => {
  it("日本時間の今日を LocalDate で返し、再描画しても同じ参照を返すこと", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T16:00:00Z"));
    const { result, rerender } = renderHook(() => useTodayLocalDate());
    expect(result.current).toEqual({ year: 2026, month: 10, day: 15 });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
