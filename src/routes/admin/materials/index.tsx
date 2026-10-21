import { $, component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Badge, Button, Card, EmptyState, PageHeader } from "~/components";
import { AuthContext } from "~/components/auth-context";
import { listAllMaterials, updateMaterialStatus } from "~/services/api";
import type { Level, Material, ReviewStatus } from "~/types";
import styles from "./admin.module.css";
import { p } from "~/services/base";

const REVIEW: Record<ReviewStatus, { label: string; tone: "warn" | "success" | "danger" }> = {
  pending: { label: "審査待ち", tone: "warn" },
  approved: { label: "承認済み", tone: "success" },
  suspended: { label: "公開停止", tone: "danger" },
};
const LEVEL: Record<Level, string> = { beginner: "初心者", basic: "基礎", experienced: "経験者" };

interface State { loading: boolean; items: Material[]; status: string; topic: string; busyId: string; msg: string }

export default component$(() => {
  const auth = useContext(AuthContext);
  const s = useStore<State>({ loading: true, items: [], status: "", topic: "", busyId: "", msg: "" });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const loaded = track(() => auth.loaded);
    const state = track(() => auth.state);
    const user = track(() => auth.user);
    if (!loaded) return;
    if (state === "signed_in" && user?.role === "admin") s.items = await listAllMaterials();
    s.loading = false;
  });

  const change = $(async (id: string, status: ReviewStatus) => {
    s.busyId = id;
    const updated = await updateMaterialStatus(id, status);
    if (updated) {
      s.items = s.items.map((m) => (m.id === id ? updated : m));
      s.msg = `「${updated.title}」を「${REVIEW[status].label}」にしました。`;
    }
    s.busyId = "";
  });

  const head = <PageHeader title="教材管理" />;
  if (!auth.loaded || s.loading) return <>{head}<p class="muted" role="status">読み込み中…</p></>;
  if (auth.state !== "signed_in") {
    return <>{head}<EmptyState title="ログインが必要です" description="管理画面を利用するにはログインしてください。"><Button href={p("/login/")}>ログインへ</Button></EmptyState></>;
  }
  if (auth.user?.role !== "admin") {
    return <>{head}<EmptyState title="権限がありません" description="この画面は管理者のみ利用できます。"><Button href={p("/dashboard/")} variant="secondary">ダッシュボードへ戻る</Button></EmptyState></>;
  }

  const topics = [...new Set(s.items.map((m) => m.topic).filter((t): t is string => !!t))];
  const shown = s.items.filter((m) => (!s.status || m.review_status === s.status) && (!s.topic || m.topic === s.topic));
  const date = (v: string | null) => (v ? v.slice(0, 10) : "未確認");

  return (
    <>
      {head}
      <Card>
        <div class={styles.filters}>
          <div>
            <label for="f-status">審査ステータス</label>
            <select id="f-status" value={s.status} onChange$={(_, el) => { s.status = el.value; }}>
              <option value="">すべて</option>
              {(Object.keys(REVIEW) as ReviewStatus[]).map((k) => <option key={k} value={k}>{REVIEW[k].label}</option>)}
            </select>
          </div>
          <div>
            <label for="f-topic">トピック</label>
            <select id="f-topic" value={s.topic} onChange$={(_, el) => { s.topic = el.value; }}>
              <option value="">すべて</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {s.msg && <p role="status" style={{ color: "var(--c-success)", fontWeight: 600 }}>{s.msg}</p>}
        <p class="muted" style={{ margin: "0 0 8px" }}>{shown.length}件を表示（全{s.items.length}件）</p>
        {shown.length === 0 ? <p class="muted">条件に合う教材がありません。</p> : (
          <div class={styles.wrap}>
            <table>
              <thead><tr><th>タイトル</th><th>トピック</th><th>レベル</th><th>無料</th><th>審査</th><th>確認日</th><th>URL</th><th>操作</th></tr></thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{m.topic ?? "—"}</td>
                    <td>{LEVEL[m.level]}</td>
                    <td>{m.is_free ? "無料" : "有料"}</td>
                    <td><Badge tone={REVIEW[m.review_status].tone}>{REVIEW[m.review_status].label}</Badge></td>
                    <td>{date(m.verified_at)}</td>
                    <td class={styles.url}><a href={m.url} target="_blank" rel="noopener noreferrer">{m.url}</a></td>
                    <td>
                      <div class={styles.actions}>
                        {m.review_status !== "approved" && <Button size="sm" disabled={s.busyId === m.id} onClick$={() => change(m.id, "approved")}>承認</Button>}
                        {m.review_status !== "suspended" && <Button size="sm" variant="danger" disabled={s.busyId === m.id} onClick$={() => change(m.id, "suspended")}>公開停止</Button>}
                        {m.review_status !== "pending" && <Button size="sm" variant="ghost" disabled={s.busyId === m.id} onClick$={() => change(m.id, "pending")}>審査待ちに戻す</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
});

export const head: DocumentHead = { title: "教材管理 | AI Learning Navigator" };
