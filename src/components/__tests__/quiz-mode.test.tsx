import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizMode } from "../quiz-mode";

// framer-motion のアニメーションを無効化
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy(actual.motion, {
      get: (_target, prop: string) => {
        return (props: Record<string, unknown>) => {
          const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
          const Tag = prop as React.ElementType;
          return <Tag {...rest} />;
        };
      },
    }),
  };
});

describe("QuizMode", () => {
  it("タイトルが表示されること", () => {
    render(<QuizMode />);
    expect(
      screen.getByRole("heading", { level: 1, name: "キーワードクイズ" })
    ).toBeInTheDocument();
  });

  it("初期状態で開始ボタンが表示されること", () => {
    render(<QuizMode />);
    expect(screen.getByText("クイズを始める")).toBeInTheDocument();
  });

  it("開始ボタンを押すと出題画面に遷移すること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));
    expect(screen.getByText(/1 \/ 10/)).toBeInTheDocument();
    expect(
      screen.getByText("このカードのキーワードはどれ？")
    ).toBeInTheDocument();
  });

  it("4択が表示されること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));

    // 4つの選択肢ボタン
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => !b.textContent?.includes("クイズ"));
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("選択肢を押すと正解/不正解が表示されること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));

    // 4択のうち最初のボタンを押す
    const choiceButtons = screen
      .getAllByRole("button")
      .filter(
        (b) =>
          !b.textContent?.includes("クイズ") &&
          b.textContent?.trim()
      );
    await user.click(choiceButtons[0]);

    // 正解 or 不正解のフィードバック
    const feedback =
      screen.queryByText("✦ 正解！") || screen.queryByText("✧ 不正解…");
    expect(feedback).toBeInTheDocument();
  });

  it("10問完了すると結果画面が表示されること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));

    for (let i = 0; i < 10; i++) {
      // 4択から最初を選ぶ
      const choices = screen
        .getAllByRole("button")
        .filter(
          (b) =>
            !b.textContent?.includes("クイズ") &&
            !b.textContent?.includes("次へ") &&
            !b.textContent?.includes("もう一度") &&
            b.textContent?.trim()
        );
      await user.click(choices[0]);

      // 「次へ」を押す
      await user.click(screen.getByText("次へ"));
    }

    // 結果画面
    expect(screen.getByText("結果")).toBeInTheDocument();
    expect(screen.getByText("もう一度挑戦する")).toBeInTheDocument();
  });

  it("リトライボタンで再開できること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));

    for (let i = 0; i < 10; i++) {
      const choices = screen
        .getAllByRole("button")
        .filter(
          (b) =>
            !b.textContent?.includes("クイズ") &&
            !b.textContent?.includes("次へ") &&
            !b.textContent?.includes("もう一度") &&
            b.textContent?.trim()
        );
      await user.click(choices[0]);
      await user.click(screen.getByText("次へ"));
    }

    // リトライ
    await user.click(screen.getByText("もう一度挑戦する"));

    // 出題画面が再表示される
    expect(
      screen.getByText("このカードのキーワードはどれ？")
    ).toBeInTheDocument();
  });

  it("進捗バーが表示されること", async () => {
    const user = userEvent.setup();
    render(<QuizMode />);
    await user.click(screen.getByText("クイズを始める"));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
