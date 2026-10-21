import { $, component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, useLocation, type DocumentHead, type StaticGenerateHandler } from "@builder.io/qwik-city";
import { AuthContext, Badge, Button, EmptyState, FlowSteps, Icon } from "~/components";
import { FORMAT_ICON, FORMAT_LABEL, LEVEL_LABEL, LoginNotice } from "~/components/learning";
import styles from "~/components/learning/learning.module.css";
import { getMaterial, getProgress, updateProgress } from "~/services/api";
import type { Material, ProgressStatus } from "~/types";
import { p } from "~/services/base";
import { MOCK_MATERIALS } from "~/services/mock-data";

export default component$(() => {
  const auth = useContext(AuthContext);
  const loc = useLocation();
  const s = useStore<{ loading: boolean; material: Material | null; status: ProgressStatus; busy: boolean; error: string }>({
    loading: true, material: null, status: "not_started", busy: false, error: "",
  });

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
    s.material = await getMaterial(id);
    const p = await getProgress();
    s.status = p.items.find((x) => x.material_id === id)?.status ?? "not_started";
    s.loading = false;
  });

  const id = loc.params.id;
  const m = s.material;
  const setStatus = $(async (next: ProgressStatus) => {
    s.busy = true;
    s.error = "";
    try {
      s.status = (await updateProgress(id, next)).status;
    } catch {
      s.error = "状態を更新できませんでした。";
    }
    s.busy = false;
  });
  const done = s.status === "completed";

  return (
    <>
      <FlowSteps current={2} />
      {auth.loaded && auth.state !== "signed_in" && <LoginNotice />}
      {auth.state === "signed_in" && s.loading && <p class={styles.loading}>読み込み中…</p>}
      {auth.state === "signed_in" && !s.loading && !m && (
        <EmptyState icon="book" title="教材が見つかりません">
          <Button href={p("/recommendations/")}>おすすめ教材へ</Button>
        </EmptyState>
      )}
      {auth.state === "signed_in" && !s.loading && m && (
        <div class={styles.detail}>
          <Link href={p("/recommendations/")} class={styles.back}>
            <Icon name="back" size={18} />
            おすすめ教材
          </Link>
          <h1 class={styles.detailTitle}>{m.title}</h1>
          <ul class="chips">
            <li><Icon name={FORMAT_ICON[m.format]} size={15} />{FORMAT_LABEL[m.format]}</li>
            <li><Icon name="clock" size={15} />{m.duration_minutes}分</li>
            <li><Icon name="level" size={15} />{LEVEL_LABEL[m.level]}</li>
            {m.is_free && <li><Badge tone="success">無料</Badge></li>}
            <li>{m.provider}</li>
          </ul>
          <p class={styles.desc}>{m.description}</p>

          {/* やることを順番どおりに並べたチェックリスト */}
          <ol class={styles.todo}>
            <li class={[styles.todoItem, s.status !== "not_started" && styles.todoDone]}>
              <span class={styles.todoMark}><Icon name={s.status !== "not_started" ? "check" : "external"} size={18} /></span>
              <span class={styles.todoText}>教材を開く</span>
              <a
                class={["btn", s.status === "not_started" ? "btn-primary" : "btn-ghost"]}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick$={() => {
                  if (s.status === "not_started") setStatus("in_progress");
                }}
              >
                開く
                <Icon name="external" size={16} />
              </a>
            </li>
            <li class={[styles.todoItem, done && styles.todoDone]}>
              <span class={styles.todoMark}><Icon name="check" size={18} /></span>
              <span class={styles.todoText}>{done ? "学習完了" : "読み終えたら"}</span>
              {!done && (
                <button
                  type="button"
                  class={["btn", s.status === "in_progress" ? "btn-primary" : "btn-ghost"]}
                  disabled={s.busy}
                  onClick$={() => setStatus("completed")}
                >
                  完了
                </button>
              )}
            </li>
            <li class={styles.todoItem}>
              <span class={styles.todoMark}><Icon name="pencil" size={18} /></span>
              <span class={styles.todoText}>問題で確認</span>
              <Button href={p(`/exercises/${m.id}/`)} variant={done ? "primary" : "ghost"}>解く</Button>
            </li>
          </ol>
          {s.error && <div class={styles.error} role="alert">{s.error}</div>}
        </div>
      )}
    </>
  );
});

export const head: DocumentHead = { title: "教材 | AI Learning Navigator" };

// 静的書き出し（GitHub Pages）用に、教材ごとのページを事前に生成する
export const onStaticGenerate: StaticGenerateHandler = () => ({
  params: MOCK_MATERIALS.map((m) => ({ id: m.id })),
});
