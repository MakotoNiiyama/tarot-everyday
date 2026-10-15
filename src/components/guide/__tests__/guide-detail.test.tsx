import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GuideEntryPage, { generateStaticParams } from "@/app/guide/[system]/[id]/page";
import { ELEMENT_IDS } from "@/lib/fortune/element-ids";

describe("早見表の項目の詳細ページ", () => {
  it("タロット以外の全項目を静的生成すること", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(
      ELEMENT_IDS.numerology.length +
        ELEMENT_IDS.kyusei.length +
        ELEMENT_IDS.maya.length +
        ELEMENT_IDS.shichu.length +
        ELEMENT_IDS.sanmei.length +
        ELEMENT_IDS.sukuyo.length +
        ELEMENT_IDS.horoscope.length,
    );
    expect(params.some((p) => p.system === "tarot")).toBe(false);
  });

  it("名前・読み・キーワード・説明・関連項目・パンくずを表示すること", async () => {
    render(await GuideEntryPage({ params: Promise.resolve({ system: "maya", id: "seal-14" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "白い魔法使い" })).toBeInTheDocument();
    expect(screen.getByText("しろいまほうつかい")).toBeInTheDocument();
    expect(screen.getByText("White Wizard")).toBeInTheDocument();
    const crumbs = screen.getByRole("navigation", { name: "パンくずリスト" });
    expect(crumbs).toHaveTextContent("早見表");
    expect(crumbs).toHaveTextContent("マヤ暦");
    expect(crumbs).toHaveTextContent("太陽の紋章");
    expect(screen.getByRole("link", { name: "早見表に戻る" })).toHaveAttribute("href", "/guide?tab=maya");
    expect(screen.getByRole("heading", { name: "関連項目" })).toBeInTheDocument();
  });
});
