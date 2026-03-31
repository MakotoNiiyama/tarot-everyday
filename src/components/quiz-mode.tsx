"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { allCards } from "@/data/cards";
import {
  generateQuiz,
  QUIZ_COUNT,
  type QuizQuestion,
  type QuizAnswer,
} from "@/lib/quiz";
import { ScratchDivider } from "@/components/svg/scratch-decorations";

type Phase = "start" | "question" | "feedback" | "result";

export function QuizMode() {
  const [phase, setPhase] = useState<Phase>("start");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const correctCount = useMemo(
    () => answers.filter((a) => a.isCorrect).length,
    [answers]
  );

  const startQuiz = useCallback(() => {
    setQuestions(generateQuiz(allCards, QUIZ_COUNT));
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedKeyword(null);
    setPhase("question");
  }, []);

  const handleAnswer = useCallback(
    (keyword: string) => {
      if (!currentQuestion || selectedKeyword) return;
      setSelectedKeyword(keyword);
      const isCorrect = keyword === currentQuestion.correctKeyword;
      setAnswers((prev) => [
        ...prev,
        { question: currentQuestion, selectedKeyword: keyword, isCorrect },
      ]);
      setPhase("feedback");
    },
    [currentQuestion, selectedKeyword]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= QUIZ_COUNT) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedKeyword(null);
      setPhase("question");
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col items-center px-4 py-6 pb-20 gap-4 max-w-lg mx-auto">
      {/* ヘッダー */}
      <header className="text-center">
        <h1 className="font-heading text-2xl font-bold text-gold">
          キーワードクイズ
        </h1>
        {phase !== "start" && phase !== "result" && (
          <p className="text-gold-dim text-sm mt-1">
            {currentIndex + 1} / {QUIZ_COUNT}
          </p>
        )}
      </header>

      {/* 進捗バー */}
      {phase !== "start" && phase !== "result" && (
        <ProgressBar current={currentIndex} total={QUIZ_COUNT} />
      )}

      <AnimatePresence mode="wait">
        {phase === "start" && <StartScreen key="start" onStart={startQuiz} />}

        {phase === "question" && currentQuestion && (
          <QuestionPhase
            key={`q-${currentIndex}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        )}

        {phase === "feedback" && currentQuestion && selectedKeyword && (
          <FeedbackPhase
            key={`fb-${currentIndex}`}
            question={currentQuestion}
            selectedKeyword={selectedKeyword}
            isCorrect={selectedKeyword === currentQuestion.correctKeyword}
            onNext={handleNext}
          />
        )}

        {phase === "result" && (
          <ResultScreen
            key="result"
            answers={answers}
            correctCount={correctCount}
            onRetry={startQuiz}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──── 進捗バー ──── */

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="w-full flex gap-1" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i < current
              ? "bg-gold"
              : i === current
                ? "bg-gold/60"
                : "bg-surface"
          }`}
        />
      ))}
    </div>
  );
}

/* ──── スタート画面 ──── */

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 mt-8"
    >
      {/* 装飾アイコン */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        className="w-24 h-24 text-gold"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <path
          d="M60 20 L66 45 L90 45 L70 60 L78 85 L60 70 L42 85 L50 60 L30 45 L54 45 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <text x="60" y="108" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="serif" opacity="0.6">
          ？
        </text>
      </svg>

      <div className="text-center space-y-2">
        <p className="text-cream text-sm">
          ランダムに引かれた{QUIZ_COUNT}枚のカードについて
        </p>
        <p className="text-cream text-sm">
          正しいキーワードを4択から選びましょう
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="bg-gold text-background font-heading font-bold px-8 py-3 rounded-xl text-lg cursor-pointer"
      >
        クイズを始める
      </motion.button>
    </motion.div>
  );
}

/* ──── 出題フェーズ ──── */

function QuestionPhase({
  question,
  onAnswer,
}: {
  question: QuizQuestion;
  onAnswer: (keyword: string) => void;
}) {
  const { card, isReversed, choices } = question;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 mt-2 w-full"
    >
      {/* 正位置/逆位置バッジ */}
      <span
        className={`text-xs font-heading px-3 py-1 rounded-full border ${
          isReversed
            ? "text-terracotta border-terracotta/40"
            : "text-gold border-gold/40"
        }`}
      >
        {isReversed ? "☽ 逆位置" : "☀ 正位置"}
      </span>

      {/* カード画像フリップアニメーション */}
      <div className="relative w-36 h-[216px]">
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-full h-full"
        >
          <div
            className={`w-full h-full rounded-xl overflow-hidden border-2 ${
              isReversed ? "border-terracotta" : "border-gold"
            }`}
            role="img"
            aria-label={`${card.name.ja} ${isReversed ? "逆位置" : "正位置"}`}
            style={isReversed ? { transform: "rotate(180deg)" } : undefined}
          >
            <Image
              src={card.imagePath}
              alt={card.name.ja}
              width={144}
              height={216}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </motion.div>
      </div>

      {/* カード名 */}
      <p className="font-heading text-lg text-gold font-bold">{card.name.ja}</p>

      <ScratchDivider className="text-gold" />

      {/* 4択ボタン */}
      <p className="text-cream text-sm">このカードのキーワードはどれ？</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {choices.map((choice) => (
          <motion.button
            key={choice}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAnswer(choice)}
            className="bg-surface/60 border border-gold/25 rounded-xl px-4 py-3
              text-cream text-sm font-heading text-center cursor-pointer
              hover:border-gold/50 hover:bg-surface/80 transition-colors"
          >
            {choice}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ──── フィードバックフェーズ ──── */

function FeedbackPhase({
  question,
  selectedKeyword,
  isCorrect,
  onNext,
}: {
  question: QuizQuestion;
  selectedKeyword: string;
  isCorrect: boolean;
  onNext: () => void;
}) {
  const { card, isReversed, correctKeyword } = question;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 mt-2 w-full"
    >
      {/* 正解/不正解 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`text-3xl font-heading font-bold ${
          isCorrect ? "text-gold" : "text-terracotta"
        }`}
      >
        {isCorrect ? "✦ 正解！" : "✧ 不正解…"}
      </motion.div>

      {/* カード画像が左右に飛ぶ */}
      <div className="relative w-full h-[200px] overflow-hidden">
        {/* 正解/不正解エリアラベル */}
        <div className="absolute top-0 right-4 text-gold/40 text-xs font-heading">
          正解 →
        </div>
        <div className="absolute top-0 left-4 text-terracotta/40 text-xs font-heading">
          ← 不正解
        </div>

        <motion.div
          initial={{ x: 0, y: 0 }}
          animate={{
            x: isCorrect ? 120 : -120,
            y: 0,
            rotate: isCorrect ? 8 : -8,
            opacity: 0.7,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute left-1/2 top-6 -translate-x-1/2 w-28 h-[168px]"
        >
          <div
            className={`w-full h-full rounded-xl overflow-hidden border-2 ${
              isReversed ? "border-terracotta" : "border-gold"
            }`}
            style={isReversed ? { transform: "rotate(180deg)" } : undefined}
          >
            <Image
              src={card.imagePath}
              alt={card.name.ja}
              width={112}
              height={168}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>

      {/* 正解キーワード表示 */}
      {!isCorrect && (
        <div className="text-center space-y-1">
          <p className="text-cream/60 text-xs">正解は...</p>
          <p className="text-gold text-sm font-heading font-bold">
            {correctKeyword}
          </p>
        </div>
      )}

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="bg-gold/15 border border-gold/30 text-gold font-heading font-bold px-8 py-3 rounded-xl cursor-pointer"
      >
        次へ
      </motion.button>
    </motion.div>
  );
}

/* ──── 結果画面 ──── */

function ResultScreen({
  answers,
  correctCount,
  onRetry,
}: {
  answers: QuizAnswer[];
  correctCount: number;
  onRetry: () => void;
}) {
  const ratio = correctCount / QUIZ_COUNT;
  const message =
    ratio === 1
      ? "パーフェクト！"
      : ratio >= 0.8
        ? "素晴らしい！"
        : ratio >= 0.6
          ? "なかなか良い！"
          : ratio >= 0.4
            ? "もう少し！"
            : "がんばりましょう！";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-5 mt-6 w-full"
    >
      {/* スコア */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-center"
      >
        <p className="text-gold-dim text-sm font-heading mb-2">結果</p>
        <p className="text-5xl font-bold text-gold font-heading">
          {correctCount}
          <span className="text-xl text-gold-dim"> / {QUIZ_COUNT}</span>
        </p>
        <p className="text-cream text-lg font-heading mt-2">{message}</p>
      </motion.div>

      <ScratchDivider className="text-gold" />

      {/* 回答一覧 */}
      <div className="w-full space-y-2">
        <h2 className="text-gold-dim text-xs font-heading">回答一覧</h2>
        {answers.map((a, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-2 rounded-lg border ${
              a.isCorrect
                ? "border-gold/20 bg-gold/5"
                : "border-terracotta/20 bg-terracotta/5"
            }`}
          >
            <div className="w-8 h-12 flex-shrink-0 rounded overflow-hidden border border-gold/20">
              <Image
                src={a.question.card.imagePath}
                alt={a.question.card.name.ja}
                width={32}
                height={48}
                className={`w-full h-full object-cover ${
                  a.question.isReversed ? "rotate-180" : ""
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream text-xs truncate">
                {a.question.card.name.ja}
                <span className="text-gold-dim/60 ml-1">
                  {a.question.isReversed ? "逆" : "正"}
                </span>
              </p>
              <p
                className={`text-xs truncate ${
                  a.isCorrect ? "text-gold" : "text-terracotta"
                }`}
              >
                {a.isCorrect ? "○" : "✕"} {a.selectedKeyword}
                {!a.isCorrect && (
                  <span className="text-gold/60 ml-1">
                    → {a.question.correctKeyword}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* リトライ */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="bg-gold text-background font-heading font-bold px-8 py-3 rounded-xl text-lg cursor-pointer mt-2"
      >
        もう一度挑戦する
      </motion.button>
    </motion.div>
  );
}
