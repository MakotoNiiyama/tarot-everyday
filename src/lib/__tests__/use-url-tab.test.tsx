import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useUrlTab } from "../use-url-tab";

beforeEach(() => {
  window.history.replaceState(null, "", "/guide");
});

describe("useUrlTab", () => {
  it("URL の ?tab= を読むこと。なければ空文字", () => {
    const { result } = renderHook(() => useUrlTab());
    expect(result.current[0]).toBe("");
    window.history.replaceState(null, "", "/guide?tab=maya");
    const { result: r2 } = renderHook(() => useUrlTab());
    expect(r2.current[0]).toBe("maya");
  });

  it("設定するとパスを保ったまま URL を置き換え、値が更新されること", () => {
    const { result } = renderHook(() => useUrlTab());
    act(() => result.current[1]("kyusei"));
    expect(window.location.pathname).toBe("/guide");
    expect(window.location.search).toBe("?tab=kyusei");
    expect(result.current[0]).toBe("kyusei");
  });

  it("ブラウザの戻る・進む(popstate)に追従すること", () => {
    const { result } = renderHook(() => useUrlTab());
    act(() => {
      window.history.replaceState(null, "", "/guide?tab=numerology");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current[0]).toBe("numerology");
  });

  it("サーバー描画では null(まだ URL がわからない)", () => {
    function Probe() {
      const [tab] = useUrlTab();
      return <span>{tab === null ? "null" : tab}</span>;
    }
    window.history.replaceState(null, "", "/guide?tab=maya");
    expect(renderToString(<Probe />)).toContain("null");
  });
});
