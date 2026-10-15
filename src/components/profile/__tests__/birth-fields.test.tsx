import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  BirthFields,
  birthFieldsFromProfile,
  isFutureBirth,
  profileFromBirthFields,
  type BirthFieldsValue,
} from "../birth-fields";
import type { BirthProfile } from "@/lib/fortune/types";

const TODAY = { year: 2026, month: 10, day: 14 };

/** 値を持つ呼び出し側の代わり。いまの値から作ったプロフィールを JSON で出す */
function Harness({ initial = null }: { initial?: BirthProfile | null }) {
  const [value, setValue] = useState<BirthFieldsValue>(() => birthFieldsFromProfile(initial));
  return (
    <>
      <BirthFields value={value} onChange={setValue} today={TODAY} />
      <output data-testid="profile">{JSON.stringify(profileFromBirthFields(value))}</output>
    </>
  );
}

const currentProfile = () => JSON.parse(screen.getByTestId("profile").textContent ?? "null");
const HOUR_PROFILE: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };

describe("BirthFields", () => {
  it("時刻の入力方式を切り替えられること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText(/時刻が不明の場合/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "午前・午後" }));
    expect(within(screen.getByRole("radiogroup", { name: "午前・午後" })).getByRole("radio", { name: /午後/ })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    expect(screen.getByLabelText("出生時刻")).toHaveAttribute("type", "time");
    expect(screen.getByRole("checkbox", { name: /分は分からない/ })).not.toBeChecked();
  });

  it("「分は分からない」を付けると分を30分にそろえ、30分以外を選ぶとチェックを外すこと", async () => {
    const user = userEvent.setup();
    render(<Harness initial={HOUR_PROFILE} />);
    const input = screen.getByLabelText("出生時刻");
    expect(input).toHaveValue("14:30");
    const checkbox = screen.getByRole("checkbox", { name: "分は分からない(14時台として計算)" });
    expect(checkbox).toBeChecked();
    fireEvent.change(input, { target: { value: "14:45" } });
    expect(checkbox).not.toBeChecked();
    // チェックを外しているときに30分を選んでもチェックは入れない
    fireEvent.change(input, { target: { value: "14:30" } });
    expect(checkbox).not.toBeChecked();
    fireEvent.change(input, { target: { value: "09:10" } });
    await user.click(checkbox);
    expect(input).toHaveValue("09:30");
    expect(currentProfile().time).toEqual({ kind: "hour", hour: 9 });
  });

  it("2月の日数は年に合わせること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2023");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "2");
    const days = within(screen.getByRole("combobox", { name: "日" })).getAllByRole("option");
    expect(days.at(-1)?.textContent).toBe("28日");
  });

  it("2月29日を選んだあとうるう年でない年にすると日をリセットすること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2024");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "2");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "29");
    expect(currentProfile()).not.toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2023");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
    expect(currentProfile()).toBeNull();
    // 年を戻しても日は空のまま(消えた値が復活しない)
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2024");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
  });

  it("31日を選んだあと30日までの月にすると日をリセットすること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "1990");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "1");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "31");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "4");
    expect(screen.getByRole("combobox", { name: "日" })).toHaveValue("");
  });

  it("今年の未来の月・日は選べず、未来の日付になったらその旨を表示すること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "12");
    await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "1");
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2026");
    expect(screen.getByRole("alert")).toHaveTextContent("未来の日付は選べません");
    const month = (m: string) => within(screen.getByRole("combobox", { name: "月" })).getByRole("option", { name: m });
    expect(month("10月")).toBeEnabled();
    expect(month("11月")).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "10");
    const day = (d: string) => within(screen.getByRole("combobox", { name: "日" })).getByRole("option", { name: d });
    expect(day("14日")).toBeEnabled();
    expect(day("15日")).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ラジオボタンは選択中の1つだけがタブ移動の対象になること", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "出生時刻の入力方式" });
    expect(within(group).getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it("矢印キーで前後のラジオボタンを選び、端では反対側に回ること", async () => {
    const user = userEvent.setup();
    render(<Harness />);
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
    render(<Harness />);
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
    expect(currentProfile()).toBeNull();
  });
});

describe("birthFieldsFromProfile / profileFromBirthFields", () => {
  it("登録済みの値を入力欄の値にし、元のプロフィールに戻せること", () => {
    const profiles: BirthProfile[] = [
      { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } },
      { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "half", half: "pm" }, prefecture: "13", gender: "female" },
      HOUR_PROFILE,
      { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "minute", hour: 9, minute: 5 }, gender: "male" },
    ];
    for (const p of profiles) expect(profileFromBirthFields(birthFieldsFromProfile(p))).toEqual(p);
  });

  it("未入力の項目があれば null を返すこと", () => {
    expect(profileFromBirthFields(birthFieldsFromProfile(null))).toBeNull();
    const v = birthFieldsFromProfile(HOUR_PROFILE);
    expect(profileFromBirthFields({ ...v, clock: "" })).toBeNull();
  });

  it("今日より後の生年月日を未来と判定すること", () => {
    const at = (day: number): BirthProfile => ({ version: 1, date: { year: 2026, month: 10, day }, time: { kind: "unknown" } });
    expect(isFutureBirth(at(14), TODAY)).toBe(false);
    expect(isFutureBirth(at(15), TODAY)).toBe(true);
    expect(isFutureBirth(null, TODAY)).toBe(false);
  });
});
