// src/lib/fortune/prompt.ts
import type { TarotCard } from "@/data/types";
import type { LocalDate } from "./local-date";
import { formatBirthTime, formatGender, formatPrefecture } from "./profile-format";
import type { BirthProfile, BirthTime, Fact, Period, SystemReading } from "./types";

const PERIODS: readonly { period: Period; label: string }[] = [
  { period: "day", label: "今日" },
  { period: "month", label: "今月" },
  { period: "year", label: "今年" },
];

export interface FortunePromptInput {
  profile: BirthProfile;
  readings: SystemReading[];
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

/**
 * 総合鑑定プロンプト(設計書 §8)。ユーザーが自分で契約している生成AIに貼り付けて使う。
 * 今日・今月・今年の3つの期間をまとめて鑑定してもらう。アプリの解釈文(見出しの一文や早見表の説明)は入れず、
 * 各占術で求めた要素の値と注記・採用している方式だけを渡して、意味づけと統合はAIに任せる
 */
export function generateFortunePrompt(input: FortunePromptInput): string {
  const { profile, readings, today, question, tarot } = input;
  const { year, month, day } = profile.date;
  const place = profile.prefecture ? formatPrefecture(profile.prefecture) : "未入力(明石を基準に計算)";
  const time = birthTimeText(profile.time);

  const natal = readings.map((r) => `【${r.name}】${r.natal.map(factText).join(" / ")}`);
  const periodSections = PERIODS.map(({ period, label }) => {
    const lines = readings.map((r) => {
      const result = r.periods[period];
      const line = `【${r.name}】(期間: ${result.rangeLabel})${result.chips.map(factText).join(" / ")}`;
      return result.note ? `${line}\n  注記: ${result.note}` : line;
    });
    return `── ${label}の要素 ──\n${lines.join("\n")}`;
  });
  const tarotLine = tarot ? `${tarot.card.name.ja}(${tarot.isReversed ? "逆位置" : "正位置"})` : "未抽選";

  return `あなたはプロの占い師です。東洋・西洋の複数の占術で求めた要素をもとに、相談者の今日・今月・今年の運勢を総合的に鑑定してください。各要素の意味づけと、占術どうしの統合はあなたの知識で行ってください。

■ 生年月日: ${year}年${month}月${day}日 / 出生時刻: ${time} / 出生地: ${place} / 性別: ${formatGender(profile.gender)}
■ 鑑定日: ${today.year}年${today.month}月${today.day}日
■ 相談内容: ${question.trim() || "特になし(総合的な鑑定)"}

── 人物像(生まれ持った要素) ──
${natal.join("\n")}

${periodSections.join("\n\n")}

── 今日の1dayタロット ──
${tarotLine}

── 採用している方式 ──
${readings.map((r) => `【${r.name}】${r.method}`).join("\n")}

── 依頼 ──
1. 人物像を、占術間で共通しているテーマと矛盾している点に触れながら統合して説明してください
2. 今日・今月・今年の運勢を、それぞれの期間の要素をもとに鑑定してください(長い期間ほど大きな流れを、短い期間ほど具体的な過ごし方を中心に)
3. 3つの期間を通した流れと、具体的なアドバイスをまとめてください
4. 相談内容があれば、それを軸に鑑定してください。相談内容に上の3つ以外の期間(例: 来年)や話題が含まれていれば、生年月日と採用している方式からその期間の要素を求めて追加で鑑定し、求めた要素も示してください
5. 候補が複数ある項目や仮に計算した項目は、その不確かさを踏まえて解釈してください`;
}
