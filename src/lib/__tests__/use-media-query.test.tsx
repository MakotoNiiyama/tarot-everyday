import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

function Probe({ query }: { query: string }) {
  return <p>{useMediaQuery(query) ? "match" : "no-match"}</p>;
}

type Listener = () => void;

function installMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }));
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((l) => l());
    },
  };
}

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

describe("useMediaQuery", () => {
  it("matchMedia が無い環境では false を返すこと", () => {
    // jsdom には matchMedia が実装されていない
    // @ts-expect-error テストのため削除する
    delete window.matchMedia;
    render(<Probe query="(min-width: 1280px)" />);
    expect(screen.getByText("no-match")).toBeInTheDocument();
  });

  it("一致状態を返し、変化に追従すること", () => {
    const mql = installMatchMedia(true);
    render(<Probe query="(min-width: 1280px)" />);
    expect(screen.getByText("match")).toBeInTheDocument();
    act(() => mql.set(false));
    expect(screen.getByText("no-match")).toBeInTheDocument();
  });
});
