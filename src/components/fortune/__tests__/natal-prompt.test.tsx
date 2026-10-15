import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalSection } from "../natal-section";
import { PromptCard } from "../prompt-card";
import { BLACK_KIN_NOTE } from "@/lib/fortune/natal-notes";
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

  it("特殊な配置に当たるときは、説明文に「また、…」の一文を続けること", async () => {
    const user = userEvent.setup();
    // 1988/3/29 は KIN 20(黒KIN)
    const black = readAll({ version: 1, date: { year: 1988, month: 3, day: 29 }, time: { kind: "unknown" } }, today);
    render(<NatalSection readings={black} />);
    await user.click(screen.getByRole("button", { name: "マヤ暦" }));
    expect(screen.getByText((text) => text.endsWith(BLACK_KIN_NOTE))).toBeInTheDocument();
  });
});

describe("PromptCard", () => {
  it("相談内容を含めたプロンプトをクリップボードにコピーすること", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<PromptCard profile={profile} readings={readings} today={today} tarot={null} />);
    await user.type(screen.getByRole("textbox", { name: "相談したいこと(任意)" }), "仕事のこと");
    await user.click(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("■ 相談内容: 仕事のこと");
    expect(writeText.mock.calls[0][0]).toContain("── 今月の要素 ──");
    expect(await screen.findByText("コピーしました")).toBeInTheDocument();
  });

  it("コピーされる内容を省略表示し、相談内容の入力に合わせて変わり、全文を表示できること", async () => {
    const user = userEvent.setup();
    render(<PromptCard profile={profile} readings={readings} today={today} tarot={null} />);
    const preview = screen.getByLabelText("コピーされる内容");
    expect(preview).toHaveTextContent(/^あなたはプロの占い師です。/);
    expect(preview).toHaveTextContent("■ 相談内容: 特になし(総合的な鑑定)");
    await user.type(screen.getByRole("textbox", { name: "相談したいこと(任意)" }), "転職のこと");
    expect(preview).toHaveTextContent("■ 相談内容: 転職のこと");
    const toggle = screen.getByRole("button", { name: "全文を表示" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", preview.id);
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "折りたたむ" })).toHaveAttribute("aria-expanded", "true");
  });

  it("コピーに失敗したら「コピーできませんでした」と表示し、しばらくすると消すこと", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      render(<PromptCard profile={profile} readings={readings} today={today} tarot={null} />);
      await user.click(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" }));
      expect(await screen.findByText("コピーできませんでした")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText("コピーできませんでした")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("続けてコピーしても、前のタイマーで表示が早く消えないこと", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      render(<PromptCard profile={profile} readings={readings} today={today} tarot={null} />);
      const button = screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" });
      await user.click(button);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      await user.click(button);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // 1回目から2.5秒たっているが、2回目からは1秒なので表示は残る
      expect(screen.getByText("コピーしました")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("表示を消す前にアンマウントしてもタイマーが残らないこと", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
      const { unmount } = render(<PromptCard profile={profile} readings={readings} today={today} tarot={null} />);
      await user.click(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" }));
      await screen.findByText("コピーしました");
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
