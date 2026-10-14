import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ProfilePage } from "../profile-page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("ProfilePage", () => {
  it("登録情報を読み込むまでは「読み込み中」を status として表示すること", () => {
    // サーバー描画(ハイドレーション前)では localStorage を読まないので読み込み中になる
    const html = renderToString(<ProfilePage />);
    expect(html).toContain('role="status"');
    expect(html).toContain("読み込み中");
  });
});
