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
const dragon = getGuideEntry("maya", "seal-1")!;
const sun = getGuideEntry("maya", "seal-20")!;

/** 線画の読み込みを確かめる隠した画像 */
const probeOf = (container: HTMLElement) => container.querySelector("img[hidden]")!;

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

describe("十二支のタイル(tileOverlay)", () => {
  it("タイルでは絵を暗くし、上に元の色の漢字を重ねること", () => {
    const { container } = render(<GuideEntryImage entry={ox} size="tile" />);
    const img = screen.getByRole("img", { name: ox.photo!.alt });
    expect(img.style.filter).toBe("brightness(0.42) saturate(0.85)");
    const overlay = container.querySelector("[data-overlay]")!;
    expect(overlay).toHaveTextContent("丑");
    expect(overlay.querySelector("span")).toHaveStyle({ color: ox.image.kind === "glyph" ? ox.image.color : "" });
  });

  it("シート・詳細では暗くせず、文字を重ねないこと", () => {
    const { container } = render(<GuideEntryImage entry={ox} size="sheet" />);
    expect(screen.getByRole("img").style.filter).toBe("");
    expect(container.querySelector("[data-overlay]")).toBeNull();
    const detail = render(<GuideDetailImage entry={ox} />);
    expect(detail.container.querySelector("[data-overlay]")).toBeNull();
  });

  it("tileOverlay のない項目(星座)のタイルは暗くしないこと", () => {
    const { container } = render(<GuideEntryImage entry={pisces} size="tile" />);
    expect(screen.getByRole("img").style.filter).toBe("");
    expect(container.querySelector("[data-overlay]")).toBeNull();
  });

  it("絵を読み込めなければ、暗い枠を残さず普通の文字のタイルに戻すこと", () => {
    const { container } = render(<GuideTile entry={ox} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[data-overlay]")).toBeNull();
    expect(container.querySelector("[data-shape]")).toHaveTextContent("丑");
  });
});

describe("太陽の紋章の線画(lineArt)", () => {
  it("線画を mask-image にし、紋章の色で塗ること(タイル・シート)", () => {
    for (const size of ["tile", "sheet"] as const) {
      const { container, unmount } = render(<GuideEntryImage entry={dragon} size={size} />);
      const art = container.querySelector<HTMLElement>("[data-line-art]")!;
      expect(art.style.maskImage).toMatch(/^url\("?\/guide-images\/maya\/seal-1\.svg"?\)$/);
      expect(art).toHaveStyle({ backgroundColor: "#C75B39" });
      expect(art).toHaveAttribute("aria-hidden", "true");
      expect(probeOf(container)).toHaveAttribute("src", "/guide-images/maya/seal-1.svg");
      expect(screen.queryByText("赤い竜")).toBeNull();
      unmount();
    }
  });

  it("確認用の画像が読み込めなければ、紋章の名前の文字に戻すこと", () => {
    const { container } = render(<GuideTile entry={sun} />);
    fireEvent.error(probeOf(container));
    expect(container.querySelector("[data-line-art]")).toBeNull();
    expect(container.querySelector("[data-shape]")).toHaveTextContent(/黄色い\s*太陽/);
  });

  it("詳細ページでは線画を描き、下に出典を書くこと。読み込めなければ文字に戻して出典を消すこと", () => {
    const { container } = render(<GuideDetailImage entry={sun} />);
    expect(container.querySelector("[data-line-art]")).not.toBeNull();
    expect(container.querySelector("figcaption")).toHaveTextContent(
      "画像: 古代マヤの日の文字(Wikimedia Commons の DaySign シリーズ)・パブリックドメイン",
    );
    fireEvent.error(probeOf(container));
    expect(container.querySelector("[data-line-art]")).toBeNull();
    expect(container.querySelector("figcaption")).toBeNull();
    expect(screen.getByText(/黄色い\s*太陽/)).toBeInTheDocument();
  });
});
