"use client";

import Link from "next/link";
import { formatBirthTime, formatPrefecture } from "@/lib/fortune/profile-format";
import { useBirthProfile } from "@/lib/fortune/profile-storage";

/** サイドナビ下部のプロフィール要約(設計書 §10.2) */
export function ProfileSummaryBox() {
  const { ready, profile } = useBirthProfile();
  if (!ready) return null;
  return (
    <div className="mt-auto rounded-[14px] border border-gold/20 px-3.5 py-3 text-xs leading-relaxed text-gold-dim">
      {profile ? (
        <>
          <p>
            {profile.date.year}/{profile.date.month}/{profile.date.day} 生
          </p>
          <p>{[formatBirthTime(profile.time), ...(profile.prefecture ? [formatPrefecture(profile.prefecture)] : [])].join(" · ")}</p>
          <Link href="/fortune/profile" className="mt-1.5 block text-gold-light hover:text-cream">
            編集
          </Link>
        </>
      ) : (
        <Link href="/fortune/profile" className="block text-gold-light hover:text-cream">
          生年月日を登録
        </Link>
      )}
    </div>
  );
}
