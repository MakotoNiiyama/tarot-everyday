import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("時刻を指定したら、時刻を入力するまで保存できず、その旨を表示すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    const input = screen.getByLabelText("出生時刻");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("出生時刻を入力してください");
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    await user.type(input, "14:35");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("出生時刻を入力してください")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
  });

  it("分まで入力して保存すると kind minute で保存すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    await user.type(screen.getByLabelText("出生時刻"), "09:05");
    expect(screen.getByRole("checkbox", { name: "分は分からない(9時台として計算)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(JSON.parse(store["tarot-birth-profile"]).time).toEqual({ kind: "minute", hour: 9, minute: 5 });
  });

  it("「分は分からない」を付けると kind hour で保存し、外すと分を戻すこと", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    const input = screen.getByLabelText("出生時刻");
    expect(screen.getByRole("checkbox", { name: "分は分からない(その時台として計算)" })).toBeInTheDocument();
    await user.type(input, "14:35");
    const checkbox = screen.getByRole("checkbox", { name: "分は分からない(14時台として計算)" });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/14時30分の生まれとして計算します/)).toBeInTheDocument();
    // チェックを入れると時刻入力の分も30分にそろえる
    expect(input).toHaveValue("14:30");
    // 時を変えると見出しの時台も変わる(分が30のままならチェックは外れない)
    // 時刻入力は完成した値でだけ変わる(ピッカーと同じ)ので、値をまとめて入れる
    fireEvent.change(input, { target: { value: "07:30" } });
    expect(screen.getByRole("checkbox", { name: "分は分からない(7時台として計算)" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(JSON.parse(store["tarot-birth-profile"]).time).toEqual({ kind: "hour", hour: 7 });
  });

  it("時台で登録済みなら「分は分からない」を付けた状態で HH:30 を表示すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } }} />);
    expect(screen.getByRole("radio", { name: "時刻を指定" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("出生時刻")).toHaveValue("14:30");
    const checkbox = screen.getByRole("checkbox", { name: "分は分からない(14時台として計算)" });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(JSON.parse(store["tarot-birth-profile"]).time).toEqual({ kind: "minute", hour: 14, minute: 30 });
  });

  it("分まで登録済みならその時刻を表示し、「分は分からない」は外れていること", () => {
    render(<ProfileForm initial={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "minute", hour: 9, minute: 5 } }} />);
    expect(screen.getByLabelText("出生時刻")).toHaveValue("09:05");
    expect(screen.getByRole("checkbox", { name: /分は分からない/ })).not.toBeChecked();
  });

  it("入力して保存すると localStorage に保存し、運勢ページへ移動すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    await user.type(screen.getByLabelText("出生時刻"), "14:00");
    await user.click(screen.getByRole("checkbox", { name: /分は分からない/ }));
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
