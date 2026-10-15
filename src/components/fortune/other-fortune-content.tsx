"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { Icon } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import {
  BirthFields,
  birthFieldsFromProfile,
  isFutureBirth,
  profileFromBirthFields,
  type BirthFieldsValue,
} from "@/components/profile/birth-fields";
import type { LocalDate } from "@/lib/fortune/local-date";
import { useTodayLocalDate } from "@/lib/use-today";
import type { NatalHeading } from "./natal-section";
import { ReadingsLoading } from "./readings-loading";

/** 計算エンジン(astronomy-engine を含む)はこのページでも動的に読み込む */
const FortuneReadings = dynamic(() => import("./fortune-readings").then((m) => m.FortuneReadings), {
  ssr: false,
  loading: () => <ReadingsLoading />,
});

const NATAL_HEADING: NatalHeading = { title: "この生年月日の人物像", accent: "About this birthday" };

/** 初期値: 生年月日は今日、出生時刻は不明、出生地は東京都、性別は回答しない */
function defaultFields(today: LocalDate): BirthFieldsValue {
  return birthFieldsFromProfile({ version: 1, date: today, time: { kind: "unknown" }, prefecture: "13" });
}

/**
 * 入力欄と結果。今日の日付が分かってから(クライアントで)表示するので、
 * 初期値の「今日」を useState の初期化で決められる(ビルド時の日付が残らず、ハイドレーションもずれない)
 */
function OtherFortuneBody({ today }: { today: LocalDate }) {
  // 入力はこのページの中だけで持つ(プロフィールとして保存しない。再読み込みで初期値に戻る)
  const [fields, setFields] = useState<BirthFieldsValue>(() => defaultFields(today));
  const profile = useMemo(() => profileFromBirthFields(fields), [fields]);
  const future = isFutureBirth(profile, today);

  let pending = "";
  if (!fields.year || !fields.month || !fields.day) pending = "生年月日を選ぶと、7つの占術の結果が表示されます。";
  else if (!profile) pending = "出生時刻を入力すると、7つの占術の結果が表示されます。";
  else if (future) pending = "今日までの生年月日を選ぶと、7つの占術の結果が表示されます。";

  return (
    <>
      <section
        aria-label="占う生年月日"
        className="flex flex-col gap-5 rounded-[22px] border border-gold/25 bg-surface p-4 lg:gap-6 lg:p-7"
      >
        <BirthFields value={fields} onChange={setFields} today={today} layout="grid" />
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-gold-dim lg:justify-end lg:border-t lg:border-gold/15 lg:pt-4">
          <Icon name="lock" size={13} />
          入力した内容は保存されません
        </p>
      </section>

      {profile && !future ? (
        <FortuneReadings profile={profile} today={today} natalHeading={NATAL_HEADING} />
      ) : (
        <p role="status" className="rounded-[20px] border border-dashed border-gold/30 px-4 py-6 text-center text-[13px] text-gold-dim">
          {pending}
        </p>
      )}
    </>
  );
}

/** 好きな生年月日で占うページ(設計書 §11.7) */
export function OtherFortuneContent() {
  const today = useTodayLocalDate();

  return (
    <DetailPanelLayout>
      <PageContainer wide>
        <header className="flex items-center gap-2 lg:gap-3">
          <Link href="/" aria-label="ホームに戻る" className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light">
            <Icon name="back" size={18} />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-heading text-xl lg:text-[26px]">好きな生年月日で占う</h1>
            <span className="font-accent text-sm leading-none text-gold-dark lg:text-base">Any birthday</span>
          </div>
        </header>

        {today ? (
          <OtherFortuneBody today={today} />
        ) : (
          <div role="status" className="h-96">
            <span className="sr-only">読み込み中</span>
          </div>
        )}
      </PageContainer>
    </DetailPanelLayout>
  );
}
