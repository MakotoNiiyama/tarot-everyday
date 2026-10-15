"use client";

import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { compareLocalDate, daysInMonth, isValidLocalDate, type LocalDate } from "@/lib/fortune/local-date";
import { prefectures, type PrefectureCode } from "@/lib/fortune/prefectures";
import type { BirthProfile, BirthTime } from "@/lib/fortune/types";
import { useRovingSelection } from "@/lib/use-roving-selection";

/** 入力方式。"time" は時刻を指定(分まで、または分は分からない) */
export type TimeMode = "unknown" | "half" | "time";
type Half = "am" | "pm";
type Gender = "male" | "female" | "none";

/** 生年月日・出生時刻・出生地・性別の入力中の値(選択肢の値そのまま。未選択は空文字) */
export interface BirthFieldsValue {
  year: string;
  month: string;
  day: string;
  timeMode: TimeMode;
  half: Half;
  /** 時刻入力の値("HH:MM")。時刻を指定に切り替えた直後は空 */
  clock: string;
  minuteUnknown: boolean;
  prefecture: string;
  gender: Gender;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 時刻入力の値("HH:MM")。空や不正な値なら null */
function parseClock(v: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** 登録済みの時刻を時刻入力の値にする。分が分からない時台は計算に使う HH:30 */
function initialClock(time: BirthTime | undefined): string {
  if (time?.kind === "minute") return `${pad2(time.hour)}:${pad2(time.minute)}`;
  if (time?.kind === "hour") return `${pad2(time.hour)}:30`;
  return "";
}

function initialMode(time: BirthTime | undefined): TimeMode {
  if (time?.kind === "half") return "half";
  if (time?.kind === "hour" || time?.kind === "minute") return "time";
  return "unknown";
}

/** プロフィール(未登録なら null)から入力中の値を作る */
export function birthFieldsFromProfile(profile: BirthProfile | null): BirthFieldsValue {
  return {
    year: profile ? String(profile.date.year) : "",
    month: profile ? String(profile.date.month) : "",
    day: profile ? String(profile.date.day) : "",
    timeMode: initialMode(profile?.time),
    half: profile?.time.kind === "half" ? profile.time.half : "am",
    clock: initialClock(profile?.time),
    minuteUnknown: profile?.time.kind === "hour",
    prefecture: profile?.prefecture ?? "",
    gender: profile?.gender ?? "none",
  };
}

/** 入力中の値をプロフィールにする。生年月日が揃っていない・時刻が未入力なら null(未来の日付かどうかは見ない) */
export function profileFromBirthFields(v: BirthFieldsValue): BirthProfile | null {
  const date = { year: Number(v.year), month: Number(v.month), day: Number(v.day) };
  if (!v.year || !v.month || !v.day || !isValidLocalDate(date)) return null;
  let time: BirthTime;
  if (v.timeMode === "unknown") time = { kind: "unknown" };
  else if (v.timeMode === "half") time = { kind: "half", half: v.half };
  else {
    const c = parseClock(v.clock);
    if (!c) return null;
    time = v.minuteUnknown ? { kind: "hour", hour: c.hour } : { kind: "minute", hour: c.hour, minute: c.minute };
  }
  const p: BirthProfile = { version: 1, date, time };
  if (v.prefecture) p.prefecture = v.prefecture as PrefectureCode;
  if (v.gender !== "none") p.gender = v.gender;
  return p;
}

/** 生年月日が今日より後か */
export function isFutureBirth(profile: BirthProfile | null, today: LocalDate): boolean {
  return profile !== null && compareLocalDate(profile.date, today) > 0;
}

const HALVES = [
  ["am", "午前", "0:00〜11:59"],
  ["pm", "午後", "12:00〜23:59"],
] as const;
const HALF_VALUES: readonly Half[] = HALVES.map(([v]) => v);

const SELECT =
  "w-full min-h-12 appearance-none rounded-xl border border-gold/30 bg-surface pl-3.5 pr-8 text-[15px] text-cream focus:border-gold/60 focus:outline-none";

const TIME_INPUT =
  "w-full min-h-12 rounded-xl border border-gold/30 bg-surface px-3.5 text-[15px] text-cream [color-scheme:dark] focus:border-gold/60 focus:outline-none aria-invalid:border-terracotta/60";

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

/**
 * 生年月日・出生時刻・出生地・性別の入力欄(プロフィール入力と「好きな生年月日で占う」で共通)。
 * 値は呼び出し側が持ち、変更は onChange で次の値をまるごと受け取る。
 * layout が "stack" なら縦に並べ(出生地と性別は PC で横並び)、"grid" なら PC で4項目を2列に並べる
 */
export function BirthFields({
  value,
  onChange,
  today,
  layout = "stack",
}: {
  value: BirthFieldsValue;
  onChange: (next: BirthFieldsValue) => void;
  today: LocalDate;
  layout?: "stack" | "grid";
}) {
  const { year, month, day, timeMode, half, clock, minuteUnknown, prefecture, gender } = value;
  const futureHintId = useId();
  const clockHintId = useId();
  const set = <K extends keyof BirthFieldsValue>(key: K) => (v: BirthFieldsValue[K]) => onChange({ ...value, [key]: v });

  // 「分は分からない」は計算に使う30分を時刻入力にも出す。チェック中に30分以外を選んだらチェックを外す
  // (チェックを外しているときに30分を選んでもチェックは入れない)
  const changeMinuteUnknown = (checked: boolean) => {
    const c = parseClock(clock);
    onChange({ ...value, minuteUnknown: checked, clock: checked && c ? `${pad2(c.hour)}:30` : clock });
  };
  const changeClock = (next: string) => {
    const c = parseClock(next);
    onChange({ ...value, clock: next, minuteUnknown: minuteUnknown && c && c.minute !== 30 ? false : minuteUnknown });
  };
  const halfRoving = useRovingSelection({ values: HALF_VALUES, value: half, onChange: set("half") });

  const daysOf = (y: string, m: string) => (y && m ? daysInMonth(Number(y), Number(m)) : 31);
  const lastDay = daysOf(year, month);
  // 今年の未来の月・日は選べないようにする(すでに選んである値は表示したまま、未来の日付として知らせる)
  const isThisYear = Number(year) === today.year;
  const lastSelectableMonth = isThisYear ? today.month : 12;
  const lastSelectableDay = isThisYear && Number(month) === today.month ? today.day : lastDay;

  /** 年・月を変えて日がその月にない日付になったら(2月30日など)、日を空に戻す */
  const changeYear = (v: string) => onChange({ ...value, year: v, day: Number(day) > daysOf(v, month) ? "" : day });
  const changeMonth = (v: string) => onChange({ ...value, month: v, day: Number(day) > daysOf(year, v) ? "" : day });

  const picked = parseClock(clock);
  const clockMissing = timeMode === "time" && !picked;
  const isFuture = isFutureBirth(profileFromBirthFields(value), today);
  const grid = layout === "grid";

  return (
    <div className={grid ? "flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-5" : "flex flex-col gap-5 lg:gap-6"}>
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
          <Select label="日" value={day} onChange={set("day")} describedBy={isFuture ? futureHintId : undefined}>
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
          onChange={set("timeMode")}
          options={[
            { value: "unknown", label: "不明" },
            { value: "half", label: "午前・午後" },
            { value: "time", label: "時刻を指定" },
          ]}
        />
        {timeMode === "unknown" && (
          <p className="px-1 text-xs leading-relaxed text-gold-dim">
            時刻が不明の場合、出生時刻で結果が変わる項目は「候補」として時刻範囲付きで表示されます。四柱推命の時柱は、時刻を指定したときだけ表示されます。
          </p>
        )}
        {timeMode === "half" && (
          <div role="radiogroup" aria-label="午前・午後" className="grid grid-cols-2 gap-2">
            {HALVES.map(([v, label, sub], i) => (
              <button
                key={v}
                {...halfRoving.itemProps(i)}
                type="button"
                role="radio"
                aria-checked={half === v}
                onClick={() => set("half")(v)}
                className={`min-h-[52px] rounded-[14px] border text-[15px] font-bold ${
                  half === v ? "border-gold bg-gold/18 text-gold-light" : "border-gold/25 bg-surface text-gold-dim"
                }`}
              >
                {label}
                <span className="block text-[11px] font-normal opacity-80">{sub}</span>
              </button>
            ))}
          </div>
        )}
        {timeMode === "time" && (
          <>
            <input
              type="time"
              step={60}
              aria-label="出生時刻"
              aria-describedby={clockHintId}
              aria-invalid={clockMissing || undefined}
              value={clock}
              onChange={(e) => changeClock(e.target.value)}
              className={TIME_INPUT}
            />
            <label className="flex min-h-12 cursor-pointer items-center gap-3 px-1 text-[13px] text-cream">
              <span className="relative flex h-5 w-5 shrink-0">
                <input
                  type="checkbox"
                  checked={minuteUnknown}
                  onChange={(e) => changeMinuteUnknown(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gold/50 bg-surface checked:border-gold checked:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                />
                <Icon name="check" size={14} strokeWidth={2.6} className="pointer-events-none absolute left-[3px] top-[3px] hidden text-background peer-checked:block" />
              </span>
              分は分からない({picked ? `${picked.hour}時台` : "その時台"}として計算)
            </label>
            <p id={clockHintId} className={`px-1 text-xs leading-relaxed ${clockMissing ? "text-terracotta" : "text-gold-dim"}`}>
              {clockMissing
                ? "出生時刻を入力してください"
                : minuteUnknown
                  ? `${picked!.hour}時30分の生まれとして計算します。分まで入力すると、時刻の境目に近い項目もより正確に決まります。`
                  : "分まで入力すると、出生時刻で結果が変わる項目もほぼすべて1つに決まります。"}
            </p>
          </>
        )}
      </Field>

      <div className={grid ? "contents" : "flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5"}>
        <Field icon="pin" label="出生地">
          <Select label="出生地" value={prefecture} onChange={set("prefecture")}>
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
            onChange={set("gender")}
            options={[
              { value: "male", label: "男性" },
              { value: "female", label: "女性" },
              { value: "none", label: "回答しない" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}
