// src/lib/fortune/prompt.ts
import type { TarotCard } from "@/data/types";
import { composeHeadline } from "@/data/guide";
import type { LocalDate } from "./local-date";
import { formatBirthTime, formatGender, formatPrefecture } from "./profile-format";
import type { BirthProfile, BirthTime, Fact, Period, SystemReading } from "./types";

const PERIOD_LABEL: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };

export interface FortunePromptInput {
  profile: BirthProfile;
  readings: SystemReading[];
  period: Period;
  today: LocalDate;
  question: string;
  tarot: { card: TarotCard; isReversed: boolean } | null;
}

/** 候補がある事実は「A または B(出生時刻が曖昧なため候補)」にする */
function factText(f: Fact): string {
  if (f.candidates && f.candidates.length > 1) {
    return `${f.label}: ${f.candidates.map((c) => c.value).join(" または ")}(出生時刻が曖昧なため候補)`;
  }
  return `${f.label}: ${f.value}`;
}

/** 出生時刻。生成AIが取り違えないよう、午前・午後は時刻の範囲を、分が不明な時台は計算に使った時刻も書く */
function birthTimeText(time: BirthTime): string {
  if (time.kind === "unknown") return "不明";
  if (time.kind === "half") return time.half === "am" ? "午前(0:00〜11:59)" : "午後(12:00〜23:59)";
  if (time.kind === "hour") return `${formatBirthTime(time)}(${time.hour}:30として計算)`;
  return formatBirthTime(time);
}

/** 総合鑑定プロンプト(設計書 §8)。ユーザーが自分で契約している生成AIに貼り付けて使う */
export function generateFortunePrompt(input: FortunePromptInput): string {
  const { profile, readings, period, today, question, tarot } = input;
  const p = PERIOD_LABEL[period];
  const { year, month, day } = profile.date;
  const place = profile.prefecture ? formatPrefecture(profile.prefecture) : "未入力(明石を基準に計算)";
  const time = birthTimeText(profile.time);

  const natal = readings.map((r) => `【${r.name}】${r.natal.map(factText).join(" / ")}`);
  const periods = readings.map((r) => {
    const result = r.periods[period];
    const lines = [
      `【${r.name}】(期間: ${result.rangeLabel})${composeHeadline(result.headline)}`,
      `  ${result.chips.map(factText).join(" / ")}`,
    ];
    if (result.note) lines.push(`  注記: ${result.note}`);
    return lines.join("\n");
  });
  const tarotLine = tarot
    ? `${tarot.card.name.ja}(${tarot.isReversed ? "逆位置" : "正位置"}) キーワード: ${(tarot.isReversed
        ? tarot.card.keywords.reversed
        : tarot.card.keywords.upright
      ).join("・")}`
    : "未抽選";

  return `あなたはプロの占い師です。東洋・西洋の複数の占術の結果を統合し、相談者にわかりやすく鑑定してください。

■ 生年月日: ${year}年${month}月${day}日 / 出生時刻: ${time} / 出生地: ${place} / 性別: ${formatGender(profile.gender)}
■ 鑑定日: ${today.year}年${today.month}月${today.day}日 / 対象期間: ${p}
■ 相談内容: ${question.trim() || "特になし(総合的な鑑定)"}

── 人物像 ──
${natal.join("\n")}

── ${p}の運勢 ──
${periods.join("\n")}

── 今日の1dayタロット ──
${tarotLine}

── 採用している方式 ──
${readings.map((r) => `【${r.name}】${r.method}`).join("\n")}

── 依頼 ──
1. 占術間で共通しているテーマと、矛盾している点を整理してください
2. 人物像を統合して説明してください
3. 対象期間の運勢と、具体的なアドバイスをまとめてください
4. 候補が複数ある項目は、その不確かさを踏まえて解釈してください`;
}
