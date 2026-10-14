import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalSection } from "../natal-section";
import { PromptCard } from "../prompt-card";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };
const today = { year: 2026, month: 10, day: 14 };
const readings = readAll(profile, today);

describe("NatalSection", () => {
  it("見出しと占術ごとのアコーディオンを表示すること", async () => {
    const user = userEvent.setup();
    render(<NatalSection readings={readings} />);
    expect(screen.getByRole("heading", { name: "あなたについて" })).toBeInTheDocument();
    for (const r of readings) expect(screen.getByRole("button", { name: r.name })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "マヤ暦" }));
    const maya = readings.find((r) => r.id === "maya")!;
    expect(screen.getByText(maya.natal[0].value)).toBeInTheDocument();
  });

  it("候補がある事実を候補として表示すること", async () => {
    const user = userEvent.setup();
    const amb = readAll({ version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } }, today);
    render(<NatalSection readings={amb} />);
    await user.click(screen.getByRole("button", { name: "九星気学" }));
    expect(screen.getAllByText(/候補/).length).toBeGreaterThan(0);
  });
});

describe("PromptCard", () => {
  it("相談内容を含めたプロンプトをクリップボードにコピーすること", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<PromptCard profile={profile} readings={readings} period="month" today={today} tarot={null} />);
    await user.type(screen.getByRole("textbox", { name: "相談したいこと(任意)" }), "仕事のこと");
    await user.click(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("■ 相談内容: 仕事のこと");
    expect(writeText.mock.calls[0][0]).toContain("── 今月の運勢 ──");
    expect(await screen.findByText("コピーしました")).toBeInTheDocument();
  });
});
