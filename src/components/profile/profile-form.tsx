"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import { clearBirthProfile, saveBirthProfile } from "@/lib/fortune/profile-storage";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";
import type { BirthProfile } from "@/lib/fortune/types";
import { BirthFields, birthFieldsFromProfile, isFutureBirth, profileFromBirthFields, type BirthFieldsValue } from "./birth-fields";

const ProfilePreview = dynamic(() => import("./profile-preview").then((m) => m.ProfilePreview), { ssr: false });

/** プロフィール入力(設計書 §11.4)。initial は登録済みの値 */
export function ProfileForm({ initial }: { initial: BirthProfile | null }) {
  const router = useRouter();
  const today = todayInTokyo();
  const [fields, setFields] = useState<BirthFieldsValue>(() => birthFieldsFromProfile(initial));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const confirmLabelId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /** 入力を変えたら、前回の保存失敗のメッセージは消す */
  const changeFields = (next: BirthFieldsValue) => {
    setError("");
    setFields(next);
  };

  const profile = useMemo(() => profileFromBirthFields(fields), [fields]);
  const isFuture = isFutureBirth(profile, today);

  const save = () => {
    if (!profile || isFuture) return;
    if (saveBirthProfile(profile)) router.push("/fortune");
    else setError("保存できませんでした。日付が未来になっていないか、ブラウザの保存設定を確認してください。");
  };

  // 確認の表示・非表示と同時にフォーカスを移す(DOM の更新を待ってから focus する)
  const askDelete = () => {
    flushSync(() => setConfirmingDelete(true));
    cancelButtonRef.current?.focus();
  };
  const cancelDelete = () => {
    flushSync(() => setConfirmingDelete(false));
    deleteButtonRef.current?.focus();
  };

  const remove = () => {
    clearBirthProfile();
    router.push("/fortune");
  };

  return (
    <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[520px_minmax(0,1fr)] xl:items-start xl:gap-12">
      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <Link href="/fortune" aria-label="運勢に戻る" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold-light">
            <Icon name="back" size={18} />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-heading text-xl lg:text-[26px]">プロフィール</h1>
            <span className="font-accent text-sm leading-none text-gold-dark lg:text-base">Birth data</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-5 lg:gap-6 lg:rounded-[22px] lg:border lg:border-gold/25 lg:bg-surface lg:p-7"
        >
          <BirthFields value={fields} onChange={changeFields} today={today} />

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3 lg:border-t lg:border-gold/15 lg:pt-2">
            <button type="submit" disabled={!profile || isFuture} className={`${primaryButton} disabled:opacity-40 lg:px-8`}>
              保存
            </button>
            {initial &&
              (confirmingDelete ? (
                <div role="group" aria-labelledby={confirmLabelId} className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
                  <span id={confirmLabelId} className="text-terracotta">
                    本当に削除しますか?
                  </span>
                  <button type="button" onClick={remove} className="min-h-11 rounded-[14px] px-3 font-bold text-terracotta">
                    削除する
                  </button>
                  <button ref={cancelButtonRef} type="button" onClick={cancelDelete} className="min-h-11 rounded-[14px] px-3 text-gold-dim">
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  ref={deleteButtonRef}
                  type="button"
                  onClick={askDelete}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] px-3.5 text-[13px] text-terracotta"
                >
                  <Icon name="trash" size={16} />
                  登録情報を削除
                </button>
              ))}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gold-dim lg:ml-auto">
              <Icon name="lock" size={13} />
              データは端末内にのみ保存されます
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs text-terracotta">
              {error}
            </p>
          )}
        </form>
      </div>

      {/* 「この入力で分かること」はフォームの横に並べる余裕があるとき(1280px〜)だけ表示する */}
      <div className="hidden xl:block xl:pt-16">{profile && <ProfilePreview profile={profile} />}</div>
    </div>
  );
}
