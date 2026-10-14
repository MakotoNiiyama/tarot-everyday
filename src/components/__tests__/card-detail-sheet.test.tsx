import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDetailSheet } from "../card-detail-sheet";
import { allCards } from "@/data/cards";

describe("CardDetailSheet", () => {
  it("カードの早見表ページへのリンクを表示すること", async () => {
    const card = allCards[0];
    const user = userEvent.setup();
    render(
      <CardDetailSheet card={card}>
        <span>開く</span>
      </CardDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("link", { name: "早見表で見る" })).toHaveAttribute(
      "href",
      `/guide/tarot/${card.id}`,
    );
  });
});
