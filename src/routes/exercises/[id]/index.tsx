import { $, component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, useLocation, type DocumentHead, type StaticGenerateHandler } from "@builder.io/qwik-city";
import { AuthContext, Badge, Button, EmptyState, FlowSteps, Icon, ProgressBar } from "~/components";
import { LoginNotice } from "~/components/learning";
import styles from "~/components/learning/learning.module.css";
import { getExercises, submitAttempt } from "~/services/api";
import type { Exercise, ExerciseAttempt } from "~/types";
import { p } from "~/services/base";
import { MOCK_MATERIALS } from "~/services/mock-data";

interface State {
  loading: boolean;
  exercises: Exercise[];
  answers: Record<string, string>;
  attempts: Record<string, ExerciseAttempt>;
  busy: string;
  error: string;
}

export default component$(() => {
  const auth = useContext(AuthContext);
  const loc = useLocation();
  const s = useStore<State>({ loading: true, exercises: [], answers: {}, attempts: {}, busy: "", error: "" });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const loaded = track(() => auth.loaded);
    const state = track(() => auth.state);
    const id = track(() => loc.params.id);
    if (!loaded) return;
    if (state !== "signed_in") {
      s.loading = false;
      return;
    }
    s.loading = true;
    s.exercises = await getExercises(id);
    s.answers = {};
    s.attempts = {};
    s.loading = false;
  });

  const materialId = loc.params.id;
  const total = s.exercises.length;
  const done = s.exercises.filter((e) => s.attempts[e.id]).length;
  const finished = total > 0 && done === total;
  const correct = s.exercises.filter((e) => s.attempts[e.id]?.is_correct === true).length;
  const choiceTotal = s.exercises.filter((e) => e.type === "single_choice").length;
  const wrong = s.exercises.some((e) => s.attempts[e.id]?.is_correct === false);

  const submit = $(async (exId: string) => {
    s.busy = exId;
    s.error = "";
    try {
      s.attempts[exId] = await submitAttempt(exId, s.answers[exId]);
    } catch (err) {
      s.error = (err as { code?: string }).code ? (err as Error).message : "採点できませんでした。もう一度お試しください。";
    }
    s.busy = "";
  });
  const retry = $((exId: string) => {
    s.attempts = Object.fromEntries(Object.entries(s.attempts).filter(([k]) => k !== exId));
    s.answers = Object.fromEntries(Object.entries(s.answers).filter(([k]) => k !== exId));
    s.error = "";
  });

  return (
    <>
      <FlowSteps current={3} />
      {auth.loaded && auth.state !== "signed_in" && <LoginNotice />}
      {auth.state === "signed_in" && s.loading && <p class={styles.loading}>読み込み中…</p>}
      {auth.state === "signed_in" && !s.loading && total === 0 && (
        <EmptyState icon="pencil" title="問題はまだありません">
          <Button href={p(`/materials/${materialId}/`)}>教材へ戻る</Button>
        </EmptyState>
      )}
      {s.error && <div class={styles.error} role="alert">{s.error}</div>}
      {total > 0 && (
        <div class={styles.quiz}>
          <div class={styles.quizHead}>
            <Link href={p(`/materials/${materialId}/`)} class="icon-btn" aria-label="教材へ戻る" title="教材へ戻る">
              <Icon name="back" />
            </Link>
            <div class={styles.quizBar}><ProgressBar value={(done / total) * 100} label="回答済み" /></div>
            <span class={styles.quizCount}>{done}/{total}</span>
          </div>
          {s.exercises.map((e, i) => {
            const at = s.attempts[e.id];
            const isChoice = e.type === "single_choice";
            const tone = at ? (at.ai_reference_only ? styles.resRef : at.is_correct ? styles.resOk : styles.resNg) : "";
            return (
              <section key={e.id} class={["card", styles.q]} aria-labelledby={`q-${e.id}`}>
                <p class={styles.qnum}>
                  問{i + 1}
                  {!isChoice && <Badge>記述</Badge>}
                </p>
                <p id={`q-${e.id}`} class={styles.qtext}>{e.question}</p>
                {isChoice ? (
                  <div role="radiogroup" aria-labelledby={`q-${e.id}`} class={styles.choices}>
                    {(e.choices ?? []).map((c, ci) => {
                      const selected = s.answers[e.id] === String(ci);
                      return (
                        <label
                          key={ci}
                          class={[
                            styles.choice,
                            selected && !at && styles.choiceSel,
                            at && selected && (at.is_correct ? styles.choiceOk : styles.choiceNg),
                          ]}
                        >
                          <input
                            type="radio" name={`q-${e.id}`} value={String(ci)} checked={selected} disabled={!!at}
                            onChange$={() => (s.answers[e.id] = String(ci))}
                          />
                          <span class={styles.choiceKey} aria-hidden="true">{String.fromCharCode(65 + ci)}</span>
                          <span>{c}</span>
                          {at && selected && <Icon name={at.is_correct ? "check" : "x"} class={styles.choiceIcon} />}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    rows={4} aria-labelledby={`q-${e.id}`} placeholder="自分の言葉で" disabled={!!at}
                    value={s.answers[e.id] ?? ""}
                    onInput$={(_, el) => (s.answers[e.id] = el.value)}
                  />
                )}
                {!at ? (
                  <button
                    type="button" class="btn btn-primary btn-block"
                    disabled={s.busy === e.id || !(s.answers[e.id] ?? "").trim()}
                    onClick$={() => submit(e.id)}
                  >
                    {s.busy === e.id ? "採点中…" : "答え合わせ"}
                  </button>
                ) : (
                  <div class={[styles.result, tone]} role="status">
                    <p class={styles.resHead}>
                      <Icon name={at.ai_reference_only ? "sparkle" : at.is_correct ? "check" : "x"} />
                      {at.ai_reference_only ? `AIの参考評価 ${Math.round(at.score * 100)}点` : at.is_correct ? "正解" : "不正解"}
                      <button type="button" class="icon-btn" onClick$={() => retry(e.id)} aria-label="もう一度解く" title="もう一度解く">
                        <Icon name="refresh" size={18} />
                      </button>
                    </p>
                    <p class={styles.resBody}>{at.feedback}</p>
                  </div>
                )}
              </section>
            );
          })}
          {finished && (
            <section class={["card", styles.summary]} aria-label="結果">
              <span class={styles.summaryIcon}><Icon name={wrong ? "refresh" : "check"} size={30} /></span>
              <p class={styles.big}>
                {correct}<small>/{choiceTotal}</small>
              </p>
              <p class="muted">{wrong ? "教材を見直して、もう一度。" : "全問正解！"}</p>
              <div class={styles.summaryActions}>
                {wrong ? (
                  <Button href={p(`/materials/${materialId}/`)}><Icon name="book" size={18} />教材を見直す</Button>
                ) : (
                  <Button href={p("/recommendations/")}><Icon name="book" size={18} />次の教材へ</Button>
                )}
                <Button href={p("/dashboard/")} variant="ghost"><Icon name="chart" size={18} />記録</Button>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
});

export const head: DocumentHead = { title: "問題 | AI Learning Navigator" };

// 静的書き出し（GitHub Pages）用に、教材ごとのページを事前に生成する
export const onStaticGenerate: StaticGenerateHandler = () => ({
  params: MOCK_MATERIALS.map((m) => ({ id: m.id })),
});
