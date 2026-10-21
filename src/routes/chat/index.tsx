import { $, component$, noSerialize, sync$, useSignal, useStore, useVisibleTask$, type NoSerialize } from "@builder.io/qwik";
import { Link, useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { Card, EmptyState, FlowSteps, Icon } from "~/components";
import { GoalForm } from "~/components/chat/goal-form";
import styles from "~/components/chat/chat.module.css";
import { createGoal, getAIStatus, loadChatMessages, saveChatMessages } from "~/services/api";
import { getLearningAI } from "~/services/ai";
import { getAuthState } from "~/services/auth";
import { uuid } from "~/services/store";
import type { AIStatus, AuthState, ChatMessage, ChatStatus, LearningGoal } from "~/types";
import { p } from "~/services/base";

const FINAL_USER_COUNT = 6; // ヒアリング6問への回答が揃ったら目標を抽出

const AI_REASON: Record<Exclude<AIStatus, "available">, string> = {
  unknown: "AIの状態を確認できません。",
  consent_required: "AIの利用許可が必要です。",
  quota_exceeded: "AIの利用上限に達しました。",
  revoked: "AIの利用許可が切れています。",
  unsupported: "このプランではAIを使えません。",
};

const emptyGoal = (): LearningGoal => ({
  subject: "programming", topic: "python", current_level: "beginner", goal: "",
  study_minutes_per_day: 30, learning_days: 14, preferred_formats: ["article"], language: "ja",
});

export default component$(() => {
  const nav = useNavigate();
  const s = useStore<{
    ready: boolean;
    auth: AuthState;
    ai: AIStatus;
    messages: ChatMessage[];
    status: ChatStatus;
    draft: string;
    streamText: string;
    error: string;
    showGoal: boolean;
    saving: boolean;
    goalError: string;
  }>({
    ready: false, auth: "signed_out", ai: "unknown", messages: [], status: "idle", draft: "",
    streamText: "", error: "", showGoal: false, saving: false, goalError: "",
  });
  const goal = useStore<LearningGoal>(emptyGoal());
  const ctrl = useSignal<NoSerialize<AbortController>>();
  const listRef = useSignal<HTMLElement>();

  const scroll = $(() => {
    const el = listRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });

  /** 現在の履歴に対するAI応答を疑似ストリーミングで生成する */
  const respond = $(async () => {
    const c = new AbortController();
    ctrl.value = noSerialize(c);
    s.status = "streaming";
    s.streamText = "";
    s.error = "";
    let text = "";
    let failed = false;
    try {
      for await (const ev of getLearningAI().chat([...s.messages], c.signal)) {
        if (ev.type === "delta") {
          text += ev.text;
          s.streamText = text;
          scroll();
        } else if (ev.type === "error") {
          failed = true;
          s.error = ev.message;
        }
      }
    } catch {
      failed = true;
      s.error = "応答の取得中にエラーが発生しました。";
    }
    // reset／再送信で世代が替わっていたら、この応答の後続処理は行わない（C-01）
    if (ctrl.value !== c) return;
    const aborted = c.signal.aborted;
    ctrl.value = undefined;
    // 途中エラー（failed）の部分テキストは保存しない。再試行で発話が重複しないようにする（C-08）
    if (text && (aborted || !failed)) {
      s.messages = [
        ...s.messages,
        { id: uuid(), role: "assistant", content: aborted ? text + "…（停止）" : text, created_at: new Date().toISOString() },
      ];
      await saveChatMessages([...s.messages]);
    }
    s.streamText = "";
    s.status = aborted ? "cancelled" : failed ? "failed" : "completed";
    if (s.status === "completed") {
      const users = s.messages.filter((m) => m.role === "user").length;
      if (users >= FINAL_USER_COUNT && !s.showGoal) {
        Object.assign(goal, await getLearningAI().extractGoal([...s.messages]));
        s.showGoal = true;
      }
    }
    scroll();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    s.auth = await getAuthState();
    if (s.auth === "signed_in") {
      s.ai = await getAIStatus();
      s.messages = await loadChatMessages();
      const users = s.messages.filter((m) => m.role === "user").length;
      if (users >= FINAL_USER_COUNT) {
        Object.assign(goal, await getLearningAI().extractGoal([...s.messages]));
        s.showGoal = true;
      }
      s.ready = true;
      if (s.messages.length === 0 && s.ai === "available") await respond();
    } else {
      s.ready = true;
    }
    scroll();
  });

  const send = $(async () => {
    const text = s.draft.trim();
    if (!text || s.status === "streaming" || s.ai !== "available") return;
    s.draft = "";
    s.showGoal = false;
    s.messages = [...s.messages, { id: uuid(), role: "user", content: text, created_at: new Date().toISOString() }];
    await saveChatMessages([...s.messages]);
    scroll();
    await respond();
  });

  const reset = $(async () => {
    ctrl.value?.abort();
    ctrl.value = undefined;
    s.messages = [];
    s.showGoal = false;
    s.streamText = "";
    s.status = "idle";
    s.error = "";
    await saveChatMessages([]);
    if (s.ai === "available") await respond();
  });

  const submitGoal = $(async () => {
    s.saving = true;
    s.goalError = "";
    try {
      await createGoal({ ...goal, goal: goal.goal.trim(), preferred_formats: [...goal.preferred_formats] });
      await nav(p("/recommendations/"));
    } catch {
      s.goalError = "目標の保存に失敗しました。もう一度お試しください。";
    } finally {
      s.saving = false;
    }
  });

  if (s.ready && s.auth !== "signed_in") {
    return (
      <>
        <FlowSteps current={0} />
        <EmptyState icon="lock" title={s.auth === "session_expired" ? "もう一度ログインしてください" : "ログインしてください"}>
          <Link class="btn btn-primary" href={p("/login/")}>ログイン</Link>
        </EmptyState>
      </>
    );
  }
  if (!s.ready) {
    return (
      <>
        <FlowSteps current={0} />
        <Card class={styles.panel}>
          <p class="muted" role="status" style={{ margin: "auto" }}>読み込み中…</p>
        </Card>
      </>
    );
  }
  const aiOk = s.ai === "available";
  const streaming = s.status === "streaming";
  const aiReason = !aiOk ? AI_REASON[s.ai as Exclude<AIStatus, "available">] : "";
  const answered = Math.min(FINAL_USER_COUNT, s.messages.filter((m) => m.role === "user").length);
  return (
    <>
      <FlowSteps current={0} />
      <div class={styles.layout}>
        <Card class={styles.panel}>
          <div class={styles.top}>
            <span class={styles.bot} aria-hidden="true"><Icon name="sparkle" size={18} /></span>
            <span class={styles.botName}>学習ナビ</span>
            {/* 質問の残り数をドットで示す（アンケートの進捗表示と同じ形） */}
            <span class={styles.qdots} role="img" aria-label={`質問 ${answered}/${FINAL_USER_COUNT}`}>
              {Array.from({ length: FINAL_USER_COUNT }, (_, i) => (
                <span key={i} class={[styles.qdot, i < answered && styles.qdotOn]} />
              ))}
            </span>
            <button class="icon-btn" disabled={s.messages.length === 0} onClick$={reset} aria-label="最初からやり直す" title="最初からやり直す">
              <Icon name="refresh" size={18} />
            </button>
          </div>
          <div class={styles.list} ref={listRef} aria-live="polite">
            {s.messages.map((m) => (
              <div key={m.id} class={[styles.msg, m.role === "user" ? styles.user : styles.assistant]}>
                {m.content}
              </div>
            ))}
            {streaming && (
              <div class={[styles.msg, styles.assistant]}>
                {s.streamText || <span class={styles.typing} aria-label="入力中"><i /><i /><i /></span>}
              </div>
            )}
          </div>
          {aiReason && (
            <p class={[styles.notice, styles.warn]} role="alert">
              <Icon name="alert" size={18} />
              <span>{aiReason}<Link href={p("/settings/")}>設定</Link></span>
            </p>
          )}
          {s.status === "failed" && (
            <p class={[styles.notice, styles.err]} role="alert">
              <Icon name="alert" size={18} />
              <span>{s.error || "エラーが発生しました。"}</span>
              <button class="btn btn-secondary btn-sm" onClick$={respond}>再試行</button>
            </p>
          )}
          {s.showGoal ? (
            <div class={styles.bar}>
              <p class={styles.doneMsg}><Icon name="check" size={18} />質問はここまで</p>
              {/* スマホでは目標フォームが下にあるので、そこへ移動するボタンを出す */}
              <a href="#goal" class={["btn btn-primary", styles.goalJump]}>
                <Icon name="target" size={18} />
                目標を確認
              </a>
            </div>
          ) : (
          <div class={styles.bar}>
            <textarea
              aria-label="メッセージ"
              rows={1}
              placeholder={aiOk ? "メッセージ" : "入力できません"}
              value={s.draft}
              disabled={!aiOk || streaming}
              onInput$={(_, el) => (s.draft = el.value)}
              onKeyDown$={[
                sync$((e: KeyboardEvent) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) e.preventDefault();
                }),
                $((e: KeyboardEvent) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) send();
                }),
              ]}
            />
            {streaming ? (
              <button class={[styles.send, styles.stop]} onClick$={() => ctrl.value?.abort()} aria-label="停止" title="停止">
                <Icon name="stop" size={18} />
              </button>
            ) : (
              <button class={styles.send} disabled={!aiOk || !s.draft.trim()} onClick$={send} aria-label="送信" title="送信">
                <Icon name="send" size={18} />
              </button>
            )}
          </div>
          )}
        </Card>
        <aside class={styles.side} id="goal">
          {s.showGoal ? (
            <Card title="この目標でOK？">
              <GoalForm
                goal={goal}
                idPrefix="ch"
                submitLabel="教材を探す"
                saving={s.saving}
                error={s.goalError}
                onSubmit$={submitGoal}
              />
            </Card>
          ) : (
            <Link href={p("/onboarding/")} class={styles.formLink}>
              <Icon name="list" />
              <span>フォームで入力する</span>
              <Icon name="next" size={18} />
            </Link>
          )}
        </aside>
      </div>
    </>
  );
});
export const head: DocumentHead = { title: "相談 | AI Learning Navigator" };
