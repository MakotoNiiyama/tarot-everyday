"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpreadDefinition, SpreadReading } from "@/lib/spread";
import { spreadList } from "@/lib/spread";
import { allCards } from "@/data/cards";
import { shuffleDeck, cutDeck, drawCards, generatePrompt } from "@/lib/spread-reading";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { SpreadLayout } from "@/components/spread-layout";

type Phase =
  | "select"
  | "question"
  | "shuffle"
  | "cut"
  | "deal"
  | "result";

export function SpreadReadingFlow() {
  const [phase, setPhase] = useState<Phase>("select");
  const [spread, setSpread] = useState<SpreadDefinition | null>(null);
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState<SpreadReading | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectSpread = useCallback((s: SpreadDefinition) => {
    setSpread(s);
    setPhase("question");
  }, []);

  const handleStartReading = useCallback(() => {
    if (!question.trim()) return;
    setPhase("shuffle");
  }, [question]);

  const handleShuffleComplete = useCallback(() => {
    setPhase("cut");
  }, []);

  const handleCut = useCallback(
    (chosen: 0 | 1 | 2) => {
      if (!spread) return;
      const shuffled = shuffleDeck(allCards);
      const deck = cutDeck(shuffled, chosen);
      const cards = drawCards(deck, spread.cardCount);
      setReading({
        spread,
        question,
        cards,
        timestamp: Date.now(),
      });
      setPhase("deal");
    },
    [spread, question],
  );

  const handleDealComplete = useCallback(() => {
    setPhase("result");
  }, []);

  const handleCopyPrompt = useCallback(async () => {
    if (!reading) return;
    const prompt = generatePrompt(reading);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reading]);

  const handleReset = useCallback(() => {
    setPhase("select");
    setSpread(null);
    setQuestion("");
    setReading(null);
    setCopied(false);
  }, []);

  return (
    <div className="flex flex-col items-center px-4 py-6 pb-20 gap-4 max-w-lg mx-auto">
      <header className="text-center">
        <h1 className="font-heading text-2xl font-bold text-gold">
          タロット占い
        </h1>
        {spread && phase !== "select" && (
          <p className="text-gold-dim text-xs mt-1">{spread.name}</p>
        )}
      </header>

      <AnimatePresence mode="wait">
        {phase === "select" && (
          <SelectPhase key="select" onSelect={handleSelectSpread} />
        )}

        {phase === "question" && spread && (
          <QuestionPhase
            key="question"
            spread={spread}
            question={question}
            onChange={setQuestion}
            onStart={handleStartReading}
            onBack={() => setPhase("select")}
          />
        )}

        {phase === "shuffle" && (
          <ShufflePhase key="shuffle" onComplete={handleShuffleComplete} />
        )}

        {phase === "cut" && (
          <CutPhase key="cut" onCut={handleCut} />
        )}

        {phase === "deal" && reading && (
          <DealPhase
            key="deal"
            reading={reading}
            onComplete={handleDealComplete}
          />
        )}

        {phase === "result" && reading && (
          <ResultPhase
            key="result"
            reading={reading}
            copied={copied}
            onCopy={handleCopyPrompt}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──── スプレッド選択 ──── */

function SelectPhase({
  onSelect,
}: {
  onSelect: (s: SpreadDefinition) => void;
}) {
  const icons: Record<string, string> = {
    "three-card": "☆☆☆",
    choice: "⟨A|B⟩",
    hexagram: "✡",
    "celtic-cross": "✚",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col gap-4"
    >
      <p className="text-cream text-sm text-center">
        スプレッドを選択してください
      </p>
      <div className="flex flex-col gap-3">
        {spreadList.map((s) => (
          <motion.button
            key={s.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(s)}
            className="bg-surface/60 border border-gold/25 rounded-xl p-4 text-left
              hover:border-gold/50 hover:bg-surface/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-gold text-lg w-12 text-center font-accent">
                {icons[s.id]}
              </span>
              <div className="flex-1">
                <p className="text-gold font-heading font-bold">
                  {s.name}
                  <span className="text-gold-dim text-xs font-normal ml-2">
                    {s.cardCount}枚
                  </span>
                </p>
                <p className="text-cream/70 text-xs mt-0.5">
                  {s.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ──── 質問入力 ──── */

function QuestionPhase({
  spread,
  question,
  onChange,
  onStart,
  onBack,
}: {
  spread: SpreadDefinition;
  question: string;
  onChange: (v: string) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col gap-5"
    >
      <div className="text-center">
        <p className="text-gold font-heading font-bold">{spread.name}</p>
        <p className="text-cream/70 text-xs mt-1">{spread.description}</p>
      </div>

      <ScratchDivider className="text-gold" />

      <div className="flex flex-col gap-2">
        <label htmlFor="question-input" className="text-cream text-sm">
          占いたい内容を入力してください
        </label>
        <textarea
          id="question-input"
          value={question}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例: 転職すべきかどうか悩んでいます…"
          rows={3}
          maxLength={500}
          className="w-full bg-surface/60 border border-gold/25 rounded-xl px-4 py-3
            text-cream text-sm placeholder:text-cream/30 resize-none
            focus:outline-none focus:border-gold/60 transition-colors"
        />
        <p className="text-gold-dim/50 text-xs text-right">
          {question.length}/500
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-gold/25 rounded-xl py-3
            text-gold-dim text-sm font-heading cursor-pointer
            hover:border-gold/50 transition-colors"
        >
          戻る
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          disabled={!question.trim()}
          className="flex-1 bg-gold text-background font-heading font-bold
            py-3 rounded-xl text-sm cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          占いを始める
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──── シャッフル演出 ──── */

function ShufflePhase({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6 mt-8"
    >
      <p className="text-cream text-sm">カードをシャッフルしています…</p>
      <div className="relative w-32 h-44">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * 15, 0],
              y: [0, -8 + i * 3, 0],
              rotate: [0, (i % 2 === 0 ? 1 : -1) * 5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: 3,
              delay: i * 0.08,
              ease: "easeInOut",
            }}
            onAnimationComplete={i === 4 ? onComplete : undefined}
          >
            <div
              className="w-full h-full rounded-xl border border-gold/40 bg-[#130C06]"
              style={{ boxShadow: `0 ${i}px ${i * 2}px rgba(0,0,0,0.3)` }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ──── 3山カット ──── */

function CutPhase({ onCut }: { onCut: (chosen: 0 | 1 | 2) => void }) {
  const pileLabels = ["左の山", "中央の山", "右の山"] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6 mt-8"
    >
      <p className="text-cream text-sm">3つの山から1つを選んでください</p>
      <div className="flex gap-4">
        {pileLabels.map((label, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCut(i as 0 | 1 | 2)}
            className="flex flex-col items-center gap-2 cursor-pointer"
            aria-label={label}
          >
            <div className="w-20 h-28 rounded-xl border-2 border-gold/40 bg-[#130C06] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gold/50 text-2xl font-accent">
                  {i + 1}
                </span>
              </div>
              {/* 重なった感じの装飾線 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-full h-full rounded-xl border border-gold/20" />
              <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl border border-gold/10" />
            </div>
            <span className="text-gold-dim text-xs">{label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ──── 展開演出 ──── */

function DealPhase({
  reading,
  onComplete,
}: {
  reading: SpreadReading;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6 mt-4 w-full"
    >
      <p className="text-cream text-sm">カードを展開しています…</p>
      <motion.div
        className="w-full"
        onAnimationComplete={onComplete}
      >
        <SpreadLayout
          reading={reading}
          animateIn
          onAnimationComplete={onComplete}
        />
      </motion.div>
    </motion.div>
  );
}

/* ──── 結果・プロンプト表示 ──── */

function ResultPhase({
  reading,
  copied,
  onCopy,
  onReset,
}: {
  reading: SpreadReading;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}) {
  const prompt = generatePrompt(reading);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col gap-5"
    >
      {/* スプレッド表示 */}
      <SpreadLayout reading={reading} />

      <ScratchDivider className="text-gold" />

      {/* カード詳細リスト */}
      <div className="flex flex-col gap-3">
        {reading.cards.map((dc) => {
          const pos = reading.spread.positions[dc.positionIndex];
          return (
            <div
              key={dc.positionIndex}
              className="bg-surface/40 border border-gold/15 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold text-xs font-heading font-bold bg-gold/15 px-2 py-0.5 rounded">
                  {pos.label}
                </span>
                <span
                  className={`text-xs ${dc.isReversed ? "text-terracotta" : "text-gold-dim"}`}
                >
                  {dc.isReversed ? "☽ 逆位置" : "☀ 正位置"}
                </span>
              </div>
              <p className="text-cream text-sm font-heading">
                {dc.card.name.ja}
                <span className="text-cream/50 text-xs ml-1">
                  {dc.card.name.en}
                </span>
              </p>
              <p className="text-cream/60 text-xs mt-1">
                {(dc.isReversed
                  ? dc.card.keywords.reversed
                  : dc.card.keywords.upright
                ).join("・")}
              </p>
            </div>
          );
        })}
      </div>

      <ScratchDivider className="text-gold" />

      {/* AIプロンプト */}
      <div className="flex flex-col gap-2">
        <h2 className="text-gold text-sm font-heading font-bold">
          🤖 AI分析用プロンプト
        </h2>
        <p className="text-cream/50 text-xs">
          タップでコピー → ChatGPTなどに貼り付けて分析してもらえます
        </p>
        <button
          onClick={onCopy}
          className="relative bg-surface/60 border border-gold/25 rounded-xl p-4
            text-left cursor-pointer hover:border-gold/50 transition-colors"
          aria-label="プロンプトをクリップボードにコピー"
        >
          <pre className="text-cream/70 text-xs whitespace-pre-wrap break-words font-sans leading-relaxed max-h-48 overflow-y-auto">
            {prompt}
          </pre>
          {copied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center
                bg-background/80 rounded-xl"
            >
              <span className="text-gold font-heading font-bold text-lg">
                ✓ コピーしました
              </span>
            </motion.div>
          )}
        </button>
      </div>

      {/* リセット */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="border border-gold/25 rounded-xl py-3
          text-gold text-sm font-heading cursor-pointer
          hover:border-gold/50 transition-colors"
      >
        別のスプレッドで占う
      </motion.button>
    </motion.div>
  );
}
