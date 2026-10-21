import { component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { AuthContext, Badge, Button, EmptyState, FlowSteps, Icon } from "~/components";
import { FORMAT_ICON, FORMAT_LABEL, LEVEL_LABEL, LoginNotice } from "~/components/learning";
import styles from "~/components/learning/learning.module.css";
import { getAIStatus, getRecommendations, listGoals } from "~/services/api";
import { getLearningAI } from "~/services/ai";
import type { AIStatus, LearningGoal, RecommendationResult } from "~/types";
import { p } from "~/services/base";

interface State {
  goals: LearningGoal[];
  goalIdx: number;
  limit: number;
  goalsLoaded: boolean;
  loading: boolean;
  error: string;
  result: RecommendationResult | null;
  ai: AIStatus;
  explanations: Record<string, string>;
}

export default component$(() => {
  const auth = useContext(AuthContext);
  const s = useStore<State>({
    goals: [], goalIdx: 0, limit: 3, goalsLoaded: false, loading: false, error: "",
    result: null, ai: "unknown", explanations: {},
  });

  // localStorage 依存のためブラウザ側で取得
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const loaded = track(() => auth.loaded);
    const state = track(() => auth.state);
    if (!loaded || state !== "signed_in") return;
    s.goals = await listGoals();
    s.goalsLoaded = true;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const idx = track(() => s.goalIdx);
    const limit = track(() => s.limit);
    const loaded = track(() => s.goalsLoaded);
    if (!loaded) return;
    const goal = s.goals[idx];
    if (!goal) return;
    s.loading = true;
    s.error = "";
    s.explanations = {};
    try {
      const res = await getRecommendations(goal, limit);
      // 順位はGo側（モックAPI）で確定済み。スコア降順のまま表示する
      s.result = res;
      s.ai = await getAIStatus();
      if (s.ai === "available" && res.recommendations.length > 0) {
        try {
          const ex = await getLearningAI().explainMaterials(goal, res.recommendations.map((r) => r.material));
          const map: Record<string, string> = {};
          ex.forEach((e) => (map[e.material_id] = e.explanation));
          s.explanations = map;
        } catch {
          /* AI補足は任意。失敗しても推薦は表示する */
        }
      }
    } catch {
      s.error = "教材を読み込めませんでした。時間をおいて再度お試しください。";
    } finally {
      s.loading = false;
    }
  });

  const goal = s.goals[s.goalIdx];

  return (
    <>
      <FlowSteps current={1} />
      {auth.loaded && auth.state !== "signed_in" && <LoginNotice />}
      {auth.state === "signed_in" && !s.goalsLoaded && <p class={styles.loading}>読み込み中…</p>}
      {s.goalsLoaded && !goal && (
        <EmptyState icon="target" title="まず目標を決めましょう">
          <Button href={p("/chat/")}><Icon name="chat" size={18} />AIに相談</Button>
          <Button href={p("/onboarding/")} variant="secondary"><Icon name="list" size={18} />フォームで入力</Button>
        </EmptyState>
      )}
      {goal && (
        <>
          <div class={styles.goalbar}>
            <Icon name="target" size={22} class={styles.goalIcon} />
            <div class={styles.goalMain}>
              {s.goals.length > 1 ? (
                <select
                  aria-label="目標を切り替える"
                  class={styles.goalSelect}
                  value={String(s.goalIdx)}
                  onChange$={(_, el) => (s.goalIdx = Number(el.value))}
                >
                  {s.goals.map((g, i) => (
                    <option key={i} value={String(i)} selected={i === s.goalIdx}>
                      {g.goal}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>{goal.goal}</strong>
              )}
              <ul class="chips">
                <li><Icon name="level" size={15} />{LEVEL_LABEL[goal.current_level]}</li>
                <li><Icon name="clock" size={15} />1日{goal.study_minutes_per_day}分</li>
                <li><Icon name="calendar" size={15} />{goal.learning_days}日間</li>
              </ul>
            </div>
            <Link href={p("/onboarding/")} class="icon-btn" aria-label="目標を変える" title="目標を変える">
              <Icon name="pencil" size={18} />
            </Link>
          </div>

          <div class={styles.listHead}>
            <h1 class={styles.listTitle}>おすすめ教材</h1>
            <div class={styles.seg} role="group" aria-label="表示件数">
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  class={[styles.segBtn, s.limit === n && styles.segOn]}
                  aria-pressed={s.limit === n}
                  onClick$={() => (s.limit = n)}
                >
                  {n}件
                </button>
              ))}
            </div>
          </div>

          {s.error && <div class={styles.error} role="alert">{s.error}</div>}
          {s.loading && <p class={styles.loading}>探しています…</p>}
          {!s.loading && s.result && (
            <>
              {s.result.shortage_reason && (
                <div class={styles.shortage} role="note">
                  <Icon name="alert" size={18} />
                  <span>{s.result.shortage_reason}</span>
                  <Link href={p("/onboarding/")}>条件を変える</Link>
                </div>
              )}
              {s.result.recommendations.length === 0 && (
                <EmptyState icon="book" title="合う教材がありません">
                  <Button href={p("/onboarding/")} variant="secondary">条件を変える</Button>
                </EmptyState>
              )}
              <ol class={styles.cards}>
                {s.result.recommendations.map((r, i) => (
                  <li key={r.material.id} class={["card", styles.mcard]}>
                    <span class={styles.rank} aria-label={`${i + 1}位`}>{i + 1}</span>
                    <div class={styles.mbody}>
                      <h2 class={styles.title}>{r.material.title}</h2>
                      <ul class="chips">
                        <li><Icon name={FORMAT_ICON[r.material.format]} size={15} />{FORMAT_LABEL[r.material.format]}</li>
                        <li><Icon name="clock" size={15} />{r.material.duration_minutes}分</li>
                        <li><Icon name="level" size={15} />{LEVEL_LABEL[r.material.level]}</li>
                        {r.material.is_free && <li><Badge tone="success">無料</Badge></li>}
                      </ul>
                      <p class={styles.reason}>
                        <Icon name="bulb" size={16} />
                        <span>{r.reason}</span>
                      </p>
                      {s.explanations[r.material.id] && (
                        <details class={styles.ai}>
                          <summary><Icon name="sparkle" size={15} />AIの説明</summary>
                          <p>{s.explanations[r.material.id]}</p>
                        </details>
                      )}
                    </div>
                    <div class={styles.actions}>
                      <Button href={p(`/materials/${r.material.id}/`)}>
                        <Icon name="play" size={14} />
                        学ぶ
                      </Button>
                      <span class={styles.provider}>{r.material.provider}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </>
  );
});

export const head: DocumentHead = { title: "おすすめ教材 | AI Learning Navigator" };
