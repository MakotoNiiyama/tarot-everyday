"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TarotCard } from "@/data/types";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import type { LocalDate } from "@/lib/fortune/local-date";
import { generateFortunePrompt } from "@/lib/fortune/prompt";
import type { BirthProfile, Period, SystemReading } from "@/lib/fortune/types";

/** 総合鑑定プロンプトのカード(相談内容の入力欄とコピー) */
export function PromptCard({
  profile,
  readings,
  period,
  today,
  tarot,
}: {
  profile: BirthProfile;
  readings: SystemReading[];
  period: Period;
  today: LocalDate;
  tarot: { card: TarotCard; isReversed: boolean } | null;
}) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const inputId = useId();
  /** 「コピーしました」などを消すタイマー。続けて押したら前のタイマーは取り消す */
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウントしたらタイマーを止める(ここでは状態を変えない)
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    const prompt = generateFortunePrompt({ profile, readings, period, today, question, tarot });
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      setStatus("idle");
    }, 2000);
  };

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="flex flex-col gap-2.5 rounded-[20px] border border-dashed border-gold/40 bg-popover p-4 lg:p-[18px]"
    >
      <h2 id={`${inputId}-heading`} className="font-heading text-base">
        総合鑑定プロンプト
      </h2>
      <p className="text-xs leading-relaxed text-gold-dim">
        占術の結果と1dayタロットをまとめた鑑定用プロンプトを作成します。ChatGPT や Claude などに貼り付けて使えます。
      </p>
      <label htmlFor={inputId} className="sr-only">
        相談したいこと(任意)
      </label>
      <textarea
        id={inputId}
        placeholder="相談したいこと(任意)"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[72px] w-full resize-none rounded-xl border border-gold/30 bg-background px-3 py-2.5 text-sm text-cream placeholder:text-gold-dim/70 focus:border-gold/60 focus:outline-none lg:min-h-20"
      />
      <button type="button" onClick={copy} className={primaryButton}>
        <Icon name={status === "copied" ? "check" : "copy"} size={18} strokeWidth={1.8} />
        総合鑑定プロンプトをコピー
      </button>
      <p role="status" className="min-h-4 text-center text-xs text-gold-light">
        {status === "copied" ? "コピーしました" : status === "failed" ? "コピーできませんでした" : ""}
      </p>
    </section>
  );
}
