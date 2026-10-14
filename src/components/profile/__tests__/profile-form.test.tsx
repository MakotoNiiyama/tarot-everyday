import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "../profile-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/dynamic", async () => {
  const m = await import("../profile-preview");
  return { default: () => m.ProfilePreview };
});

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  push.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
    writable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/** 日本時間 2026-10-14 12:00 に固定する(userEvent のタイマーは動かしたままにする) */
function fixToday() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T03:00:00Z"));
}

async function fillDate(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "1990");
  await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "3");
  await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "29");
}

describe("ProfileForm", () => {
  it("生年月日が未選択なら保存できないこと", () => {
    render(<ProfileForm initial={null} />);
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("時刻の入力方式を切り替えられること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    expect(screen.getByText(/時刻が不明の場合/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "午前・午後" }));
    expect(within(screen.getByRole("radiogroup", { name: "午前・午後" })).getByRole("radio", { name: /午後/ })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    expect(screen.getByRole("combobox", { name: "出生時刻" })).toBeInTheDocument();
  });

  it("入力して保存すると localStorage に保存し、運勢ページへ移動すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "出生時刻" }), "14");
    await user.selectOptions(screen.getByRole("combobox", { name: "出生地" }), "13");
    await user.click(within(screen.getByRole("radiogroup", { name: "性別" })).getByRole("radio", { name: "女性" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(JSON.parse(store["tarot-birth-profile"])).toEqual({
      version: 1,
      date: { year: 1990, month: 3, day: 29 },
      time: { kind: "hour", hour: 14 },
      prefecture: "13",
      gender: "female",
    });
    expect(push).toHaveBeenCalledWith("/fortune");
  });

  it("2月の日数は年に合わせること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2023");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "2");
    const days = within(screen.getByRole("combobox", { name: "日" })).getAllByRole("option");
    expect(days.at(-1)?.textContent).toBe("28日");
  });

  it("登録済みなら初期値を表示し、確認のうえで削除できること", async () => {
    const user = userEvent.setup();
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    render(<ProfileForm initial={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }} />);
    expect(screen.getByRole("combobox", { name: "年" })).toHaveValue("1990");
    await user.click(screen.getByRole("button", { name: "登録情報を削除" }));
    expect(store["tarot-birth-profile"]).toBeDefined();
    await user.click(screen.getByRole("button", { name: "削除する" }));
    expect(store["tarot-birth-profile"]).toBeUndefined();
    expect(push).toHaveBeenCalledWith("/fortune");
  });

  it("ラジオボタンは選択中の1つだけがタブ移動の対象になること", () => {
    render(<ProfileForm initial={null} />);
    const group = screen.getByRole("radiogroup", { name: "出生時刻の入力方式" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it("矢印キーで前後のラジオボタンを選び、端では反対側に回ること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    const group = screen.getByRole("radiogroup", { name: "性別" });
    const radio = (name: string) => within(group).getByRole("radio", { name });
    radio("回答しない").focus();
    await user.keyboard("{ArrowRight}");
    expect(radio("男性")).toHaveAttribute("aria-checked", "true");
    expect(radio("男性")).toHaveFocus();
    expect(radio("男性").tabIndex).toBe(0);
    expect(radio("回答しない").tabIndex).toBe(-1);
    await user.keyboard("{ArrowDown}");
    expect(radio("女性")).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowUp}");
    expect(radio("男性")).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowLeft}");
    expect(radio("回答しない")).toHaveAttribute("aria-checked", "true");
    expect(radio("回答しない")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(radio("男性")).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{End}");
    expect(radio("回答しない")).toHaveAttribute("aria-checked", "true");
  });

  it("午前・午後も矢印キーで切り替えられること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.click(screen.getByRole("radio", { name: "午前・午後" }));
    const group = screen.getByRole("radiogroup", { name: "午前・午後" });
    const am = within(group).getByRole("radio", { name: /午前/ });
    const pm = within(group).getByRole("radio", { name: /午後/ });
    expect([am.tabIndex, pm.tabIndex]).toEqual([0, -1]);
    am.focus();
    await user.keyboard("{ArrowRight}");
    expect(pm).toHaveAttribute("aria-checked", "true");
    expect(pm).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(am).toHaveAttribute("aria-checked", "true");
  });

  it("今年の未来の月・日は選べないこと", async () => {
    fixToday();
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2026");
    const month = (m: string) => within(screen.getByRole("combobox", { name: "月" })).getByRole("option", { name: m });
    expect(month("10月")).toBeEnabled();
    expect(month("11月")).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "10");
    const day = (d: string) => within(screen.getByRole("combobox", { name: "日" })).getByRole("option", { name: d });
    expect(day("14日")).toBeEnabled();
    expect(day("15日")).toBeDisabled();
  });

  it("未来の日付になったら保存できず、その旨を表示すること", async () => {
    fixToday();
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "12");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "1");
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2026");
    expect(screen.getByText("未来の日付は選べません")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2025");
    expect(screen.queryByText("未来の日付は選べません")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
  });

  it("2月29日を選んだあとうるう年でない年にすると日をリセットすること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2024");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "2");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "29");
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2023");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    // 年を戻しても日は空のまま(消えた値が復活しない)
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2024");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
  });

  it("31日を選んだあと30日までの月にすると日をリセットすること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "1990");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "1");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "31");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "4");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
  });

  it("保存に失敗したときのエラーは入力を変えると消えること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    // 保存できない状況(書き込みで例外)を作る
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceeded");
        },
        removeItem: () => {},
      },
      writable: true,
    });
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByRole("alert")).toHaveTextContent("保存できませんでした");
    await user.selectOptions(screen.getByRole("combobox", { name: "出生地" }), "13");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("削除の確認を出すと「キャンセル」にフォーカスし、キャンセルすると削除ボタンに戻ること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }} />);
    await user.click(screen.getByRole("button", { name: "登録情報を削除" }));
    expect(screen.getByRole("group", { name: "本当に削除しますか?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.getByRole("button", { name: "登録情報を削除" })).toHaveFocus();
  });

  it("データが端末内にのみ保存される旨を表示すること", () => {
    render(<ProfileForm initial={null} />);
    expect(screen.getByText("データは端末内にのみ保存されます")).toBeInTheDocument();
  });
});
