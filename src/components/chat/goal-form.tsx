import { component$, type QRL } from "@builder.io/qwik";
import type { Level, LearningGoal, MaterialFormat } from "~/types";
import { SUBJECTS } from "~/services/mock-data";
import { Icon, type IconName } from "../icon";
import styles from "./goal-form.module.css";

const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "はじめて" },
  { value: "basic", label: "少しある" },
  { value: "experienced", label: "経験者" },
];
const FORMATS: { value: MaterialFormat; label: string; icon: IconName }[] = [
  { value: "article", label: "文章", icon: "article" },
  { value: "video", label: "動画", icon: "video" },
  { value: "interactive", label: "実践", icon: "code" },
];
const MINUTES = [15, 30, 45, 60, 90, 120];
const DAYS: [number, string][] = [[7, "1週間"], [14, "2週間"], [30, "1か月"], [60, "2か月"], [90, "3か月"]];

interface Props {
  /** 編集対象（store）。フォームの変更はこのオブジェクトに直接反映される */
  goal: LearningGoal;
  submitLabel: string;
  saving?: boolean;
  error?: string;
  idPrefix?: string;
  onSubmit$: QRL<() => void>;
}

/** 学習目標の入力・編集フォーム（オンボーディングとチャットの目標確認で共用） */
export const GoalForm = component$<Props>(({ goal, submitLabel, saving, error, idPrefix = "gf", onSubmit$ }) => {
  const minuteOpts = MINUTES.includes(goal.study_minutes_per_day) ? MINUTES : [...MINUTES, goal.study_minutes_per_day].sort((a, b) => a - b);
  const dayOpts = DAYS.some(([d]) => d === goal.learning_days) ? DAYS : ([...DAYS, [goal.learning_days, `${goal.learning_days}日`]] as [number, string][]).sort((a, b) => a[0] - b[0]);
  const invalid = goal.goal.trim().length === 0 || goal.preferred_formats.length === 0;
  return (
    <form
      class={styles.form}
      preventdefault:submit
      onSubmit$={() => {
        if (!invalid) onSubmit$();
      }}
    >
      <div>
        <label for={`${idPrefix}-topic`}>分野</label>
        <select
          id={`${idPrefix}-topic`}
          value={goal.topic}
          onChange$={(_, el) => {
            const s = SUBJECTS.find((x) => x.topic === el.value);
            if (s) {
              goal.topic = s.topic;
              goal.subject = s.subject;
            }
          }}
        >
          {SUBJECTS.map((s) => (
            <option key={s.topic} value={s.topic} selected={s.topic === goal.topic}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label for={`${idPrefix}-goal`}>できるようになりたいこと</label>
        <textarea
          id={`${idPrefix}-goal`}
          value={goal.goal}
          rows={2}
          placeholder="例：PythonでCSVを集計する"
          onInput$={(_, el) => (goal.goal = el.value)}
        />
      </div>
      <fieldset class={styles.field}>
        <legend>経験</legend>
        <div class={styles.chips}>
          {LEVELS.map((l) => (
            <label key={l.value} class={styles.chip}>
              <input
                type="radio"
                name={`${idPrefix}-level`}
                checked={goal.current_level === l.value}
                onChange$={() => (goal.current_level = l.value)}
              />
              <span>{l.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div class={styles.cols}>
        <div>
          <label for={`${idPrefix}-min`}><Icon name="clock" size={16} /> 1日</label>
          <select id={`${idPrefix}-min`} onChange$={(_, el) => (goal.study_minutes_per_day = Number(el.value))}>
            {minuteOpts.map((m) => (
              <option key={m} value={String(m)} selected={m === goal.study_minutes_per_day}>
                {`${m}分`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label for={`${idPrefix}-days`}><Icon name="calendar" size={16} /> 期間</label>
          <select id={`${idPrefix}-days`} onChange$={(_, el) => (goal.learning_days = Number(el.value))}>
            {dayOpts.map(([d, l]) => (
              <option key={d} value={String(d)} selected={d === goal.learning_days}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <fieldset class={styles.field}>
        <legend>教材の形式</legend>
        <div class={styles.chips}>
          {FORMATS.map((f) => (
            <label key={f.value} class={styles.chip}>
              <input
                type="checkbox"
                checked={goal.preferred_formats.includes(f.value)}
                onChange$={(_, el) => {
                  const rest = goal.preferred_formats.filter((x) => x !== f.value);
                  goal.preferred_formats = el.checked ? [...rest, f.value] : rest;
                }}
              />
              <span><Icon name={f.icon} size={16} />{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p class={styles.error} role="alert">
          {error}
        </p>
      )}
      <button class="btn btn-primary btn-block" type="submit" disabled={saving || invalid}>
        <Icon name="book" size={18} />
        {saving ? "保存中…" : submitLabel}
      </button>
    </form>
  );
});
