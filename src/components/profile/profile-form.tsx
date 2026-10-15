"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import { compareLocalDate, daysInMonth, isValidLocalDate } from "@/lib/fortune/local-date";
import { prefectures, type PrefectureCode } from "@/lib/fortune/prefectures";
import { clearBirthProfile, saveBirthProfile } from "@/lib/fortune/profile-storage";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";
import type { BirthProfile, BirthTime } from "@/lib/fortune/types";
import { useRovingSelection } from "@/lib/use-roving-selection";

const ProfilePreview = dynamic(() => import("./profile-preview").then((m) => m.ProfilePreview), { ssr: false });

type TimeMode = BirthTime["kind"];
type Half = "am" | "pm";

const HALVES = [
  ["am", "午前", "0:00〜11:59"],
  ["pm", "午後", "12:00〜23:59"],
] as const;
const HALF_VALUES: readonly Half[] = HALVES.map(([v]) => v);

const SELECT =
  "w-full min-h-12 appearance-none rounded-xl border border-gold/30 bg-surface pl-3.5 pr-8 text-[15px] text-cream focus:border-gold/60 focus:outline-none";

function Field({ icon, label, required, hint, children }: { icon: IconName; label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[13px] text-gold-light">
        <Icon name={icon} size={16} />
        {label}
        <span className={`ml-auto text-[11px] ${required ? "text-terracotta" : "text-gold-dim"}`}>
          {required ? "必須" : hint ? `任意 · ${hint}` : "任意"}
        </span>
      </div>
      {children}
    </div>
  );
}

function Select({ label, value, onChange, children, describedBy }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <select aria-label={label} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {children}
      </select>
      <Icon name="chev" size={16} className="pointer-events-none absolute right-3 top-4 text-gold-dim" />
    </div>
  );
}

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const values = options.map((o) => o.value);
  const { itemProps } = useRovingSelection({ values, value, onChange });
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-[14px] border border-gold/25 bg-popover p-1">
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-[11px] text-[13px] font-bold ${checked ? "bg-gold text-background" : "text-gold-dim hover:text-cream"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** プロフィール入力(設計書 §11.4)。initial は登録済みの値 */
export function ProfileForm({ initial }: { initial: BirthProfile | null }) {
  const router = useRouter();
  const today = todayInTokyo();
  const [year, setYear] = useState(initial ? String(initial.date.year) : "");
  const [month, setMonth] = useState(initial ? String(initial.date.month) : "");
  const [day, setDay] = useState(initial ? String(initial.date.day) : "");
  const [timeMode, setTimeMode] = useState<TimeMode>(initial?.time.kind ?? "unknown");
  const [half, setHalf] = useState<Half>(initial?.time.kind === "half" ? initial.time.half : "am");
  const [hour, setHour] = useState(initial?.time.kind === "hour" ? String(initial.time.hour) : "12");
  const [prefecture, setPrefecture] = useState<string>(initial?.prefecture ?? "");
  const [gender, setGender] = useState<"male" | "female" | "none">(initial?.gender ?? "none");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const futureHintId = useId();
  const confirmLabelId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /** 入力を変えたら、前回の保存失敗のメッセージは消す */
  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      setError("");
      set(v);
    };
  const halfRoving = useRovingSelection({ values: HALF_VALUES, value: half, onChange: edit(setHalf) });

  const daysOf = (y: string, m: string) => (y && m ? daysInMonth(Number(y), Number(m)) : 31);
  const lastDay = daysOf(year, month);
  // 今年の未来の月・日は選べないようにする(すでに選んである値は表示したまま、未来の日付として知らせる)
  const isThisYear = Number(year) === today.year;
  const lastSelectableMonth = isThisYear ? today.month : 12;
  const lastSelectableDay = isThisYear && Number(month) === today.month ? today.day : lastDay;

  /** 年・月を変えて日がその月にない日付になったら(2月30日など)、日を空に戻す */
  const changeYear = edit((v: string) => {
    setYear(v);
    if (Number(day) > daysOf(v, month)) setDay("");
  });
  const changeMonth = edit((v: string) => {
    setMonth(v);
    if (Number(day) > daysOf(year, v)) setDay("");
  });

  const profile = useMemo<BirthProfile | null>(() => {
    const date = { year: Number(year), month: Number(month), day: Number(day) };
    if (!year || !month || !day || !isValidLocalDate(date)) return null;
    const time: BirthTime =
      timeMode === "unknown" ? { kind: "unknown" } : timeMode === "half" ? { kind: "half", half } : { kind: "hour", hour: Number(hour) };
    const p: BirthProfile = { version: 1, date, time };
    if (prefecture) p.prefecture = prefecture as PrefectureCode;
    if (gender !== "none") p.gender = gender;
    return p;
  }, [year, month, day, timeMode, half, hour, prefecture, gender]);

  const isFuture = profile !== null && compareLocalDate(profile.date, today) > 0;

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
          <Field icon="cal" label="生年月日" required>
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
              <Select label="年" value={year} onChange={changeYear} describedBy={isFuture ? futureHintId : undefined}>
                <option value="">年</option>
                {Array.from({ length: today.year - 1900 + 1 }, (_, i) => today.year - i).map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </Select>
              <Select label="月" value={month} onChange={changeMonth} describedBy={isFuture ? futureHintId : undefined}>
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} disabled={m > lastSelectableMonth}>
                    {m}月
                  </option>
                ))}
              </Select>
              <Select label="日" value={day} onChange={edit(setDay)} describedBy={isFuture ? futureHintId : undefined}>
                <option value="">日</option>
                {Array.from({ length: lastDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} disabled={d > lastSelectableDay}>
                    {d}日
                  </option>
                ))}
              </Select>
            </div>
            {isFuture && (
              <p id={futureHintId} role="alert" className="px-1 text-xs text-terracotta">
                未来の日付は選べません
              </p>
            )}
          </Field>

          <Field icon="clock" label="出生時刻">
            <Segment
              label="出生時刻の入力方式"
              value={timeMode}
              onChange={edit(setTimeMode)}
              options={[
                { value: "unknown", label: "不明" },
                { value: "half", label: "午前・午後" },
                { value: "hour", label: "時刻を指定" },
              ]}
            />
            {timeMode === "unknown" && (
              <p className="px-1 text-xs leading-relaxed text-gold-dim">
                時刻が不明の場合、出生時刻で結果が変わる項目は「候補」として時刻範囲付きで表示されます。四柱推命の時柱は、時刻を指定したときだけ表示されます。
              </p>
            )}
            {timeMode === "half" && (
              <div role="radiogroup" aria-label="午前・午後" className="grid grid-cols-2 gap-2">
                {HALVES.map(([value, label, sub], i) => (
                  <button
                    key={value}
                    {...halfRoving.itemProps(i)}
                    type="button"
                    role="radio"
                    aria-checked={half === value}
                    onClick={() => edit(setHalf)(value)}
                    className={`min-h-[52px] rounded-[14px] border text-[15px] font-bold ${
                      half === value ? "border-gold bg-gold/18 text-gold-light" : "border-gold/25 bg-surface text-gold-dim"
                    }`}
                  >
                    {label}
                    <span className="block text-[11px] font-normal opacity-80">{sub}</span>
                  </button>
                ))}
              </div>
            )}
            {timeMode === "hour" && (
              <Select label="出生時刻" value={hour} onChange={edit(setHour)}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}時台({h}:00〜{h}:59)
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
            <Field icon="pin" label="出生地">
              <Select label="出生地" value={prefecture} onChange={edit(setPrefecture)}>
                <option value="">未入力</option>
                {prefectures.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field icon="person" label="性別" hint="大運などの計算にのみ使用">
              <Segment
                label="性別"
                value={gender}
                onChange={edit(setGender)}
                options={[
                  { value: "male", label: "男性" },
                  { value: "female", label: "女性" },
                  { value: "none", label: "回答しない" },
                ]}
              />
            </Field>
          </div>

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
