import type { TarotCard } from "@/data/types";

/** スプレッドの種類 */
export type SpreadType = "three-card" | "choice" | "hexagram" | "celtic-cross";

/** スプレッド内の1枚の位置定義 */
export interface SpreadPosition {
  /** この位置の名前（例: "過去", "現在"） */
  label: string;
  /** 説明 */
  description: string;
}

/** スプレッド定義 */
export interface SpreadDefinition {
  id: SpreadType;
  name: string;
  description: string;
  /** 必要枚数 */
  cardCount: number;
  /** 各位置の定義（インデックス順） */
  positions: SpreadPosition[];
}

/** 展開されたカード1枚 */
export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  /** スプレッド内の位置インデックス */
  positionIndex: number;
}

/** スプレッド占い結果 */
export interface SpreadReading {
  spread: SpreadDefinition;
  question: string;
  cards: DrawnCard[];
  timestamp: number;
}

/* ──────────── スプレッド定義 ──────────── */

export const spreadDefinitions: Record<SpreadType, SpreadDefinition> = {
  "three-card": {
    id: "three-card",
    name: "スリーカード",
    description:
      "過去・現在・未来を3枚で読み解く、最も基本的なスプレッド。初心者にもおすすめで、日常の悩みや短期的な見通しを手軽に占えます。",
    cardCount: 3,
    positions: [
      {
        label: "過去",
        description:
          "現在の状況に至るまでの経緯や背景。問題の根本にある出来事や感情を示します。",
      },
      {
        label: "現在",
        description:
          "今まさに直面している状況や心の状態。質問の核心に対する答えの手がかりです。",
      },
      {
        label: "未来",
        description:
          "このまま進んだ場合に訪れる展開や可能性。行動次第で変わり得る未来像を示します。",
      },
    ],
  },
  choice: {
    id: "choice",
    name: "二者択一",
    description:
      "「AとBどちらを選ぶべき？」という迷いに応えるスプレッド。それぞれの選択肢がもたらす展開と結末を比較し、より良い道を探れます。",
    cardCount: 5,
    positions: [
      {
        label: "現状",
        description:
          "選択を迫られている今のあなたの立場や心理状態。判断の出発点となるカードです。",
      },
      {
        label: "選択肢A",
        description:
          "Aを選んだ場合に起こる変化や直面する状況。道のりの途中で経験することを示します。",
      },
      {
        label: "選択肢Aの結果",
        description:
          "Aを選び切った先に待つ最終的な結末。長期的にどんな影響があるかを示します。",
      },
      {
        label: "選択肢B",
        description:
          "Bを選んだ場合に起こる変化や直面する状況。Aとの違いに注目して読み解きます。",
      },
      {
        label: "選択肢Bの結果",
        description:
          "Bを選び切った先に待つ最終的な結末。Aの結果と比較して判断の材料にします。",
      },
    ],
  },
  hexagram: {
    id: "hexagram",
    name: "ヘキサグラム",
    description:
      "六芒星（ダビデの星）の形に7枚を配置し、過去から未来、意識から無意識まで問題の全体像を多角的に分析するスプレッド。対人関係や複雑な状況の整理に向いています。",
    cardCount: 7,
    positions: [
      {
        label: "過去",
        description:
          "問題のきっかけとなった過去の出来事や感情。現在の状況を生んだ根本原因を示します。",
      },
      {
        label: "現在",
        description:
          "今この瞬間の状況や心境。問題の中心にあるテーマを端的に表します。",
      },
      {
        label: "未来",
        description:
          "近い将来に起こりうる展開。現在の流れが自然に向かう先を示します。",
      },
      {
        label: "対策",
        description:
          "状況を好転させるために取るべき具体的なアクションやヒント。実践的なアドバイスの鍵です。",
      },
      {
        label: "周囲の影響",
        description:
          "家族・友人・職場など周囲の人々や環境があなたに与えている影響。見落としがちな外的要因を示します。",
      },
      {
        label: "潜在意識",
        description:
          "自分でも気づいていない本音や深層心理。表面的な気持ちの奥にある本当の望みや恐れを映し出します。",
      },
      {
        label: "最終結果",
        description:
          "すべてのカードを総合した最終的な結論。問題に対する答えの集約です。",
      },
    ],
  },
  "celtic-cross": {
    id: "celtic-cross",
    name: "ケルト十字",
    description:
      "タロット占いで最も有名かつ伝統的なスプレッド。10枚のカードで質問者の現状・障害・意識・過去から未来まで、人生の全体像を深く読み解きます。じっくり向き合いたい重要な問いに。",
    cardCount: 10,
    positions: [
      {
        label: "現状",
        description:
          "質問の中心テーマ。今あなたが置かれている状況の本質を表すカードです。",
      },
      {
        label: "障害",
        description:
          "現状に立ちはだかる障害や試練。乗り越えるべき課題、あるいは補完すべき要素を示します。",
      },
      {
        label: "顕在意識",
        description:
          "あなたが意識的に目標としていること、心がけていること。自覚している望みや考えです。",
      },
      {
        label: "潜在意識",
        description:
          "心の奥底にある動機や感情。自分では認識しにくい本能的な欲求や不安を映し出します。",
      },
      {
        label: "過去",
        description:
          "最近の過去に起きた重要な出来事。現在の状況を形作った直接的な要因を示します。",
      },
      {
        label: "近未来",
        description:
          "数週間〜数ヶ月以内に訪れる出来事や変化。すぐ先に待っている展開の兆しです。",
      },
      {
        label: "自分自身",
        description:
          "この問題に対するあなた自身の姿勢や振る舞い。周囲からどう見えているかも含みます。",
      },
      {
        label: "周囲の影響",
        description:
          "家庭・職場・人間関係など外部環境の影響。自分ではコントロールしにくい外的要因です。",
      },
      {
        label: "希望と恐れ",
        description:
          "あなたが密かに望んでいること、同時に恐れていること。期待と不安の両面を映すカードです。",
      },
      {
        label: "最終結果",
        description:
          "すべての要素を踏まえた上での最終的な結末。質問に対する総合的な答えとなります。",
      },
    ],
  },
};

/** スプレッド一覧（選択画面用） */
export const spreadList: SpreadDefinition[] = [
  spreadDefinitions["three-card"],
  spreadDefinitions["choice"],
  spreadDefinitions["hexagram"],
  spreadDefinitions["celtic-cross"],
];
