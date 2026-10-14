import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useToday } from "../use-today";

function Probe() {
  const today = useToday();
  return <p>{today ? `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}` : "none"}</p>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useToday", () => {
  it("今日の0時の Date を返すこと", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 15, 30));
    render(<Probe />);
    expect(screen.getByText("2026-10-14 0")).toBeInTheDocument();
  });
});
