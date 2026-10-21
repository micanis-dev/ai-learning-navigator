import { component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { Badge, Button, EmptyState, Icon } from "~/components";
import { AuthContext } from "~/components/auth-context";
import { getRecommendations, getProgress, listAllMaterials, listGoals } from "~/services/api";
import type { ExerciseAttempt, LearningGoal, Material, ProgressStatus } from "~/types";
import styles from "./dashboard.module.css";
import { p } from "~/services/base";

const STATUS_LABEL: Record<ProgressStatus, string> = { not_started: "未着手", in_progress: "学習中", completed: "完了" };
const STATUS_TONE: Record<ProgressStatus, "neutral" | "info" | "success"> = { not_started: "neutral", in_progress: "info", completed: "success" };

interface Row { material: Material; status: ProgressStatus }
interface ReviewItem { material: Material; wrong: number }
interface State {
  loading: boolean;
  goal: LearningGoal | null;
  rows: Row[];
  attempts: ExerciseAttempt[];
  titles: Record<string, string>;
  review: ReviewItem[];
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default component$(() => {
  const auth = useContext(AuthContext);
  const s = useStore<State>({ loading: true, goal: null, rows: [], attempts: [], titles: {}, review: [] });

  // localStorage 依存のためブラウザ側で取得（AI非依存。保存済みデータのみ）
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const loaded = track(() => auth.loaded);
    const state = track(() => auth.state);
    if (!loaded) return;
    if (state !== "signed_in") { s.loading = false; return; }
    s.loading = true;
    const [goals, progress, all] = await Promise.all([listGoals(), getProgress(), listAllMaterials()]);
    const byId = new Map(all.map((m) => [m.id, m]));
    const goal = goals[0] ?? null;
    const ids: string[] = [];
    if (goal) {
      const rec = await getRecommendations(goal);
      rec.recommendations.forEach((r) => ids.push(r.material.id));
    }
    progress.items.forEach((p) => { if (!ids.includes(p.material_id)) ids.push(p.material_id); });
    const st = new Map(progress.items.map((p) => [p.material_id, p.status]));
    s.goal = goal;
    s.rows = ids.flatMap((id) => {
      const material = byId.get(id);
      return material ? [{ material, status: st.get(id) ?? ("not_started" as ProgressStatus) }] : [];
    });
    s.attempts = progress.attempts;
    s.titles = Object.fromEntries(all.map((m) => [m.id, m.title]));
    // 復習: 各問題の最新回答が不正解の教材（attempts は新しい順）
    const latest = new Map<string, ExerciseAttempt>();
    for (const a of progress.attempts) if (!latest.has(a.exercise_id)) latest.set(a.exercise_id, a);
    const wrong = new Map<string, number>();
    latest.forEach((a) => { if (a.is_correct === false) wrong.set(a.material_id, (wrong.get(a.material_id) ?? 0) + 1); });
    s.review = [...wrong.entries()].flatMap(([id, n]) => (byId.get(id) ? [{ material: byId.get(id)!, wrong: n }] : []));
    s.loading = false;
  });

  if (!auth.loaded || s.loading) return <p class="muted" role="status">読み込み中…</p>;
  if (auth.state !== "signed_in") {
    return (
      <EmptyState icon="lock" title={auth.state === "session_expired" ? "もう一度ログインしてください" : "ログインしてください"}>
        <Button href={p("/login/")}>ログイン</Button>
      </EmptyState>
    );
  }
  if (!s.goal && s.rows.length === 0 && s.attempts.length === 0) {
    return (
      <EmptyState icon="chart" title="まだ記録がありません">
        <Button href={p("/chat/")}><Icon name="chat" size={18} />目標を決める</Button>
      </EmptyState>
    );
  }
  const done = s.rows.filter((r) => r.status === "completed").length;
  const total = s.rows.length;
  // 正答率は問題ごとの最新回答だけで集計（attempts は新しい順）
  const latestByEx = new Map<string, ExerciseAttempt>();
  for (const a of s.attempts) if (!latestByEx.has(a.exercise_id)) latestByEx.set(a.exercise_id, a);
  const graded = [...latestByEx.values()].filter((a) => a.is_correct !== null);
  const correct = graded.filter((a) => a.is_correct).length;
  const rate = graded.length ? Math.round((correct / graded.length) * 100) : null;
  const next = s.rows.find((r) => r.status === "in_progress") ?? s.rows.find((r) => r.status === "not_started");
  return (
    <>
      <h1 class="sr-only">記録</h1>
      {/* 動画アプリの「続きから」と同じ形で、次にやることを一番上に置く */}
      {next ? (
        <Link href={p(`/materials/${next.material.id}/`)} class={styles.next}>
          <span class={styles.nextPlay}><Icon name="play" size={26} /></span>
          <span class={styles.nextBody}>
            <span class={styles.nextLabel}>{next.status === "in_progress" ? "続きから" : "次はこれ"}</span>
            <span class={styles.nextTitle}>{next.material.title}</span>
            <span class={styles.nextMeta}><Icon name="clock" size={14} />{next.material.duration_minutes}分</span>
          </span>
        </Link>
      ) : (
        <div class={[styles.next, styles.nextDone]}>
          <span class={styles.nextPlay}><Icon name="check" size={26} /></span>
          <span class={styles.nextBody}>
            <span class={styles.nextTitle}>すべて完了</span>
          </span>
          <Button href={p("/recommendations/")} variant="secondary">次の教材</Button>
        </div>
      )}

      <ul class={styles.stats}>
        <li>
          <Icon name="book" />
          <span class={styles.stat}>{done}<small>/{total}</small></span>
          <span class={styles.statLabel}>教材</span>
        </li>
        <li>
          <Icon name="target" />
          <span class={styles.stat}>{rate === null ? "—" : rate}<small>{rate === null ? "" : "%"}</small></span>
          <span class={styles.statLabel}>正答率</span>
        </li>
        <li>
          <Icon name="pencil" />
          <span class={styles.stat}>{s.attempts.length}</span>
          <span class={styles.statLabel}>回答</span>
        </li>
      </ul>

      {s.rows.length > 0 && (
        <section class={styles.section}>
          <h2>{s.goal ? s.goal.goal : "教材"}</h2>
          <ol class={["card", styles.line]}>
            {s.rows.map((r) => (
              <li key={r.material.id} class={[styles.stop, r.status === "completed" && styles.done, r === next && styles.now]}>
                <span class={styles.dot} aria-hidden="true" />
                <Link href={p(`/materials/${r.material.id}/`)} class={styles.stopTitle}>{r.material.title}</Link>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </li>
            ))}
          </ol>
        </section>
      )}

      {s.review.length > 0 && (
        <section class={styles.section}>
          <h2>復習</h2>
          <ul class={["card", styles.list]}>
            {s.review.map((r) => (
              <li key={r.material.id}>
                <Icon name="refresh" size={18} class={styles.listIcon} />
                <span class={styles.grow}>{r.material.title}</span>
                <Badge tone="danger">×{r.wrong}</Badge>
                <Button href={p(`/exercises/${r.material.id}/`)} size="sm" variant="secondary">解き直す</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.attempts.length > 0 && (
        <section class={styles.section}>
          <h2>最近の回答</h2>
          <ul class={["card", styles.list]}>
            {s.attempts.slice(0, 10).map((a) => (
              <li key={a.id}>
                <span class={[styles.mark, a.is_correct === null ? styles.markRef : a.is_correct ? styles.markOk : styles.markNg]}>
                  <Icon name={a.is_correct === null ? "sparkle" : a.is_correct ? "check" : "x"} size={16} />
                  <span class="sr-only">{a.is_correct === null ? "AI参考評価" : a.is_correct ? "正解" : "不正解"}</span>
                </span>
                <Link href={p(`/exercises/${a.material_id}/`)} class={styles.grow}>{s.titles[a.material_id] ?? a.material_id}</Link>
                <span class="muted">{fmt(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
});
export const head: DocumentHead = { title: "記録 | AI Learning Navigator" };
