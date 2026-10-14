import { describe, it, expect, vi, beforeEach } from "vitest";
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

  it("データが端末内にのみ保存される旨を表示すること", () => {
    render(<ProfileForm initial={null} />);
    expect(screen.getByText("データは端末内にのみ保存されます")).toBeInTheDocument();
  });
});
