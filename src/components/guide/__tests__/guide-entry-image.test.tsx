import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GuideEntryPage from "@/app/guide/[system]/[id]/page";
import { getGuideEntry } from "@/data/guide";
import { GuideDetailImage, GuideEntryImage } from "../guide-entry-image";
import { GuideEntryBody } from "../guide-entry-body";
import { GuideTile } from "../guide-tile";

const pisces = getGuideEntry("horoscope", "sign-pisces")!;
const ox = getGuideEntry("shichu", "branch-2")!;
const chiron = getGuideEntry("horoscope", "body-chiron")!;
const fool = getGuideEntry("tarot", "major-00")!;

/** テストでは next.config の images.unoptimized が効かないので、src に元のパスが含まれることで確かめる */
const srcOf = (img: Element | null) => decodeURIComponent(img?.getAttribute("src") ?? "");

describe("GuideEntryImage", () => {
  it("photo があれば切り抜きの位置を付けて枠いっぱいに描くこと", () => {
    render(<GuideEntryImage entry={pisces} size="tile" />);
    const img = screen.getByRole("img", { name: pisces.photo!.alt });
    expect(srcOf(img)).toContain("/guide-images/horoscope/sign-pisces.jpg");
    expect(img.className).toContain("object-cover");
    expect(img).toHaveStyle({ objectPosition: pisces.photo!.focus });
  });

  it("読み込みに失敗したら元の記号・文字に戻すこと", () => {
    const { container } = render(<GuideEntryImage entry={pisces} size="tile" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();

    render(<GuideEntryImage entry={ox} size="sheet" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("丑")).toBeInTheDocument();
  });

  it("photo がない項目は今の画像のまま(記号・カード)であること", () => {
    const { container } = render(<GuideEntryImage entry={chiron} size="tile" />);
    expect(container.querySelector("svg")).not.toBeNull();
    render(<GuideEntryImage entry={fool} size="tile" />);
    expect(screen.getByRole("img", { name: "愚者" })).toBeInTheDocument();
  });

  it("タイル・詳細シートでも photo を出し、タイルは正方形の枠のままであること", () => {
    const { container } = render(<GuideTile entry={pisces} />);
    expect(container.querySelector("[data-shape]")).toHaveAttribute("data-shape", "square");
    expect(srcOf(container.querySelector("img"))).toContain(pisces.photo!.path);
    const body = render(<GuideEntryBody entry={ox} />);
    expect(srcOf(body.container.querySelector("img"))).toContain(ox.photo!.path);
  });
});

describe("GuideDetailImage", () => {
  it("photo を描き、下に出典を書くこと", () => {
    const { container } = render(<GuideDetailImage entry={ox} />);
    expect(screen.getByRole("img", { name: ox.photo!.alt })).toBeInTheDocument();
    expect(container.querySelector("figcaption")).toHaveTextContent(
      "画像: 歌川国芳『道化十二支』(1855)・パブリックドメイン(Wikimedia Commons)",
    );
  });

  it("読み込みに失敗したら元の文字に戻し、出典を消すこと", () => {
    render(<GuideDetailImage entry={ox} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("丑")).toBeInTheDocument();
    expect(screen.queryByText(/パブリックドメイン/)).toBeNull();
  });

  it("詳細ページで使われること", async () => {
    const { container } = render(
      await GuideEntryPage({ params: Promise.resolve({ system: "horoscope", id: "body-venus" }) }),
    );
    expect(container.querySelector("figcaption")).toHaveTextContent(
      "画像: Sebald Beham『The Seven Planets』(1539ごろ)・パブリックドメイン(Wikimedia Commons)",
    );
  });

  it("photo がない項目は出典を書かないこと", () => {
    render(<GuideDetailImage entry={chiron} />);
    expect(screen.queryByText(/パブリックドメイン/)).toBeNull();
  });
});
