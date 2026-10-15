"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { TarotCard } from "@/data/types";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import type { LocalDate } from "@/lib/fortune/local-date";
import { generateFortunePrompt } from "@/lib/fortune/prompt";
import type { BirthProfile, Period, SystemReading } from "@/lib/fortune/types";

/** 総合鑑定プロンプトのカード(相談内容の入力欄、コピーされる内容のプレビュー、コピー) */
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
  /** プレビューを全文表示しているか(既定は冒頭だけの省略表示) */
  const [expanded, setExpanded] = useState(false);
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

  // プレビューとコピーで同じ文を使う(相談内容を入力するとプレビューもすぐ変わる)
  const prompt = useMemo(
    () => generateFortunePrompt({ profile, readings, period, today, question, tarot }),
    [profile, readings, period, today, question, tarot],
  );
  const previewId = `${inputId}-preview`;

  const copy = async () => {
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
      <div className="flex flex-col gap-1.5">
        <p id={`${previewId}-label`} className="text-[11px] tracking-[0.08em] text-gold-dim">
          コピーされる内容
        </p>
        <div className="relative">
          <pre
            id={previewId}
            aria-labelledby={`${previewId}-label`}
            tabIndex={0}
            className={`whitespace-pre-wrap break-words rounded-xl border border-gold/20 bg-background px-3 py-2.5 font-sans text-[11px] leading-relaxed text-cream/80 focus:border-gold/50 focus:outline-none ${
              expanded ? "max-h-[60vh] overflow-y-auto" : "max-h-32 overflow-hidden"
            }`}
          >
            {prompt}
          </pre>
          {!expanded && (
            // 省略表示の下端をぼかして、続きがあることを示す
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-px bottom-px h-10 rounded-b-xl bg-gradient-to-t from-background to-transparent"
            />
          )}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={previewId}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-9 items-center gap-1 self-end rounded-full px-2 text-xs text-gold-light hover:text-cream"
        >
          {expanded ? "折りたたむ" : "全文を表示"}
          <Icon name="chev" size={14} className={expanded ? "rotate-180" : ""} />
        </button>
      </div>
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
