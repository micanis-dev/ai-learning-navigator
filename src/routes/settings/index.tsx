import { $, component$, useContext, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Badge, Button, EmptyState, Icon } from "~/components";
import { AuthContext } from "~/components/auth-context";
import { deleteHistory, getAIStatus, getMe, setMockAIStatus, setMockRole } from "~/services/api";
import { expireSession, signOut } from "~/services/auth";
import type { AIStatus, User } from "~/types";
import styles from "./settings.module.css";
import { p } from "~/services/base";

const AI_INFO: Record<AIStatus, { label: string; tone: "neutral" | "info" | "success" | "warn" | "danger"; desc: string }> = {
  unknown: { label: "未確認", tone: "neutral", desc: "ログインすると確認できます。" },
  consent_required: { label: "許可が必要", tone: "warn", desc: "ログイン画面でAIの利用を許可してください。" },
  available: { label: "利用できます", tone: "success", desc: "AIはあなたの操作でのみ動きます。" },
  quota_exceeded: { label: "上限に到達", tone: "warn", desc: "リセットまでAIは止まります。自動で課金されることはありません。" },
  revoked: { label: "許可が切れました", tone: "danger", desc: "もう一度ログインして許可してください。" },
  unsupported: { label: "プラン対象外", tone: "danger", desc: "AIなしで教材・選択式の問題・記録は使えます。" },
};
const STATUSES = Object.keys(AI_INFO) as AIStatus[];

interface State { loading: boolean; user: User | null; ai: AIStatus; confirm: boolean; busy: boolean; msg: string }

export default component$(() => {
  const auth = useContext(AuthContext);
  const s = useStore<State>({ loading: true, user: null, ai: "unknown", confirm: false, busy: false, msg: "" });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const loaded = track(() => auth.loaded);
    const state = track(() => auth.state);
    if (!loaded) return;
    if (state === "signed_in") { s.user = await getMe(); s.ai = await getAIStatus(); }
    s.loading = false;
  });

  const changeAI = $(async (v: string) => {
    await setMockAIStatus(v as AIStatus);
    s.ai = await getAIStatus();
    s.msg = "AIの状態を変更しました";
  });
  const changeRole = $(async (v: string) => {
    await setMockRole(v as User["role"]);
    auth.user = await getMe();
    s.user = auth.user;
    s.msg = "ロールを変更しました";
  });
  const doDelete = $(async () => {
    s.busy = true;
    await deleteHistory();
    s.busy = false; s.confirm = false;
    s.msg = "削除しました";
  });
  const expire = $(async () => {
    await expireSession();
    auth.state = "session_expired";
    auth.user = null;
    s.user = null;
  });
  const logout = $(async () => {
    await signOut();
    auth.state = "signed_out";
    auth.user = null;
    location.href = p("/");
  });

  const head = <h1>設定</h1>;
  if (!auth.loaded || s.loading) return <>{head}<p class="muted" role="status">読み込み中…</p></>;
  if (auth.state !== "signed_in") {
    return (
      <EmptyState icon="lock" title={auth.state === "session_expired" ? "もう一度ログインしてください" : "ログインしてください"}>
        <Button href={p("/login/")}>ログイン</Button>
      </EmptyState>
    );
  }
  const info = AI_INFO[s.ai];

  return (
    <div class={styles.wrap}>
      {head}
      {s.msg && <p class={styles.ok} role="status"><Icon name="check" size={18} />{s.msg}</p>}

      {/* スマホの設定アプリと同じ、アイコン付きの行の一覧 */}
      <ul class={["card", styles.rows]}>
        <li>
          <span class="avatar" aria-hidden="true">{s.user?.display_name.slice(0, 1)}</span>
          <span class={styles.main}>
            <strong>{s.user?.display_name}</strong>
            <span class="muted">{s.user?.role === "admin" ? "管理者" : "学習者"}・{s.user?.plan_label ?? "—"}</span>
          </span>
          <Button variant="ghost" size="sm" onClick$={logout}><Icon name="logout" size={16} />ログアウト</Button>
        </li>
        <li>
          <span class={styles.rowIcon}><Icon name="sparkle" /></span>
          <span class={styles.main}>
            <strong>AI</strong>
            <span class="muted">{info.desc}</span>
          </span>
          <Badge tone={info.tone}>{info.label}</Badge>
        </li>
        <li>
          <span class={styles.rowIcon}><Icon name="trash" /></span>
          <span class={styles.main}>
            <strong>履歴を削除</strong>
            <span class="muted">チャット・目標・回答・進捗</span>
          </span>
          {!s.confirm && <Button variant="ghost" size="sm" onClick$={() => { s.confirm = true; }}>削除</Button>}
        </li>
        {s.confirm && (
          <li class={styles.confirm} role="alertdialog" aria-label="削除の確認">
            <span class={styles.main}><strong>元に戻せません。削除しますか？</strong></span>
            <Button variant="ghost" size="sm" disabled={s.busy} onClick$={() => { s.confirm = false; }}>キャンセル</Button>
            <Button variant="danger" size="sm" disabled={s.busy} onClick$={doDelete}>{s.busy ? "削除中…" : "削除する"}</Button>
          </li>
        )}
      </ul>

      <details class={["card", styles.more]}>
        <summary><Icon name="shield" size={18} />データの扱い</summary>
        <ul class={styles.ul}>
          <li>トークンはブラウザにもログにも保存しません。</li>
          <li>トークンや利用枠を他の人と共有しません。</li>
          <li>AIは、あなたの操作のときだけ実行します。</li>
          <li>AIが止まっても、保存した記録は見られます。</li>
          <li>通常のAPI課金に自動で切り替わることはありません。</li>
        </ul>
      </details>

      <section class={styles.demo} aria-label="デモ用の切り替え">
        <div class={styles.demoRow}>
          <label for="role-demo">ロール</label>
          <select id="role-demo" value={s.user?.role ?? "student"} onChange$={(_, el) => changeRole(el.value)}>
            <option value="student">学生</option>
            <option value="admin">管理者</option>
          </select>
        </div>
        <div class={styles.demoRow}>
          <label for="ai-demo">AIの状態</label>
          <select id="ai-demo" value={s.ai} onChange$={(_, el) => changeAI(el.value)}>
            {STATUSES.map((k) => <option key={k} value={k}>{AI_INFO[k].label}</option>)}
          </select>
        </div>
        <Button variant="ghost" size="sm" onClick$={expire}>セッション切れを再現</Button>
      </section>
    </div>
  );
});

export const head: DocumentHead = { title: "設定 | AI Learning Navigator" };
