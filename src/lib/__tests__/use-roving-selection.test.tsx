import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRovingSelection } from "../use-roving-selection";

const VALUES = ["a", "b", "c"] as const;

function Group({ value, onChange, axis }: { value: string | null; onChange: (v: string) => void; axis?: "horizontal" | "both" }) {
  const { itemProps } = useRovingSelection({ values: VALUES, value, onChange, axis });
  return (
    <div role="radiogroup" aria-label="テスト">
      {VALUES.map((v, i) => (
        <button key={v} {...itemProps(i)} type="button" role="radio" aria-checked={v === value}>
          {v}
        </button>
      ))}
    </div>
  );
}

describe("useRovingSelection", () => {
  it("どれも選ばれていなければ先頭だけをタブ移動の対象にすること", () => {
    render(<Group value={null} onChange={() => {}} />);
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it("axis が horizontal なら上下の矢印キーでは動かないこと", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Group value="a" onChange={onChange} axis="horizontal" />);
    screen.getByRole("radio", { name: "a" }).focus();
    await user.keyboard("{ArrowDown}{ArrowUp}");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("b");
  });

  it("先頭で左矢印を押すと末尾を選ぶこと", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Group value="a" onChange={onChange} />);
    screen.getByRole("radio", { name: "a" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("c");
    expect(screen.getByRole("radio", { name: "c" })).toHaveFocus();
  });
});
