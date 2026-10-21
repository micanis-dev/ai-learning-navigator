// ===== Go API (README §9) を模したモッククライアント =====
// 永続化は localStorage（接頭辞 aln:）。トークン類は保存しない。
import type {
  AIStatus,
  ChatMessage,
  Exercise,
  ExerciseAttempt,
  LearningGoal,
  LearningProgress,
  Material,
  ProgressStatus,
  ProgressSummary,
  Recommendation,
  RecommendationResult,
  ReviewStatus,
  User,
} from "~/types";
import { getAuthState } from "./auth";
import { MOCK_EXERCISES, MOCK_MATERIALS, MOCK_USER } from "./mock-data";
import { delay, storeGet, storeRemove, storeSet, uuid } from "./store";

const now = () => new Date().toISOString();

/** 機械可読な code と日本語 message を持つAPIエラー（README §9.3） */
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

// ---------- me / AI status ----------
export async function getMe(): Promise<User | null> {
  await delay();
  if ((await getAuthState()) !== "signed_in") return null;
  return { ...MOCK_USER, role: storeGet<User["role"]>("role", MOCK_USER.role) };
}

/** デモ用: ロール（学生/管理者）を切り替える */
export async function setMockRole(role: User["role"]): Promise<void> {
  storeSet("role", role);
}

export async function getAIStatus(): Promise<AIStatus> {
  await delay();
  if ((await getAuthState()) !== "signed_in") return "unknown";
  return storeGet<AIStatus>("ai_status", "available");
}

/** デモ用: 設定画面でAI利用状態を切り替えて各UI状態を確認できる */
export async function setMockAIStatus(status: AIStatus): Promise<void> {
  storeSet("ai_status", status);
}

// ---------- goals ----------
export async function createGoal(goal: LearningGoal): Promise<LearningGoal> {
  await delay();
  const saved: LearningGoal = { ...goal, id: uuid(), created_at: now() };
  storeSet("goals", [saved, ...storeGet<LearningGoal[]>("goals", [])]);
  return saved;
}

export async function listGoals(): Promise<LearningGoal[]> {
  await delay(80);
  return storeGet<LearningGoal[]>("goals", []);
}

// ---------- chat（アプリ内会話の保存。POST /chat-sessions/{id}/messages 相当）----------
export async function loadChatMessages(): Promise<ChatMessage[]> {
  return storeGet<ChatMessage[]>("chat", []);
}
export async function saveChatMessages(messages: ChatMessage[]): Promise<void> {
  storeSet("chat", messages);
}

// ---------- materials ----------
function effectiveMaterials(): Material[] {
  const overrides = storeGet<Record<string, ReviewStatus>>("material_status", {});
  return MOCK_MATERIALS.map((m) => (overrides[m.id] ? { ...m, review_status: overrides[m.id] } : m));
}

const LEVEL_ORDER = { beginner: 0, basic: 1, experienced: 2 } as const;

function scoreMaterial(m: Material, g: LearningGoal): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  // 目標適合 40%
  let fit = m.topic === g.topic ? 0.7 : 0;
  const goalText = g.goal.toLowerCase();
  const hits = m.tags.filter((t) => goalText.includes(t.toLowerCase())).length;
  if (fit > 0) fit = Math.min(1, fit + hits * 0.15);
  if (fit > 0) reasons.push(hits ? `目標「${g.goal}」に関連するテーマを扱います` : "学びたい分野と一致しています");
  // レベル 25%
  const diff = Math.abs(LEVEL_ORDER[m.level] - LEVEL_ORDER[g.current_level]);
  const lv = diff === 0 ? 1 : diff === 1 ? 0.5 : 0;
  if (diff === 0) reasons.push("現在のレベルに合っています");
  // 時間 15%
  const total = g.study_minutes_per_day * g.learning_days;
  const time = m.duration_minutes <= total ? Math.min(1, 0.6 + (m.duration_minutes <= g.study_minutes_per_day * 3 ? 0.4 : 0.2)) : 0.2;
  if (m.duration_minutes <= total) reasons.push(`約${m.duration_minutes}分で、学習期間内に終えられます`);
  // 品質 15%
  const quality = m.verified_at ? 1 : 0.5;
  // 形式 5%
  const fmt = g.preferred_formats.includes(m.format) ? 1 : 0;
  if (fmt) reasons.push("希望の教材形式です");
  const score = 0.4 * fit + 0.25 * lv + 0.15 * time + 0.15 * quality + 0.05 * fmt;
  return { score: Math.round(score * 100) / 100, reasons };
}

/** 承認済み・無料のみ。3〜5件（limitは3〜5に丸める）。足りなければ水増しせず理由を返す。 */
export async function getRecommendations(
  goalOrId: LearningGoal | string,
  limit = 3,
): Promise<RecommendationResult> {
  await delay(350);
  const goal =
    typeof goalOrId === "string"
      ? storeGet<LearningGoal[]>("goals", []).find((g) => g.id === goalOrId)
      : goalOrId;
  if (!goal) return { recommendation_id: uuid(), recommendations: [], shortage_reason: "学習目標が見つかりません。" };
  const n = Math.min(5, Math.max(3, limit));
  const candidates = effectiveMaterials().filter(
    (m) => m.review_status === "approved" && m.is_free && m.topic === goal.topic,
  );
  const recs: Recommendation[] = candidates
    .map((material) => {
      const { score, reasons } = scoreMaterial(material, goal);
      return { material, score, reason: reasons.slice(0, 3).join("。") + "。" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
  const result: RecommendationResult = { recommendation_id: uuid(), recommendations: recs };
  if (recs.length < 3) {
    result.shortage_reason = `条件に合う承認済みの無料教材が${recs.length}件のみでした（件数の水増しはしていません）。分野・レベル・教材形式の条件を変更すると見つかる可能性があります。`;
  }
  return result;
}

export async function getMaterial(id: string): Promise<Material | null> {
  await delay(100);
  const m = effectiveMaterials().find((x) => x.id === id);
  return m && m.review_status === "approved" ? m : null;
}

// ---------- exercises / attempts ----------
export async function getExercises(materialId: string): Promise<Exercise[]> {
  await delay(100);
  const m = effectiveMaterials().find((x) => x.id === materialId);
  if (!m || m.review_status !== "approved") return [];
  // 選択式の正答(answer)は仕様上サーバー側採点だが、モックでは同梱（画面では表示しないこと）
  return MOCK_EXERCISES.filter((e) => e.material_id === materialId);
}

/**
 * answer: single_choice は選択肢インデックス(number)、記述式は文字列。
 * 選択式はローカル判定。記述式はダミー評価で ai_reference_only=true（AI評価は参考値）。
 */
export async function submitAttempt(exerciseId: string, answer: string | number): Promise<ExerciseAttempt> {
  await delay(300);
  const ex = MOCK_EXERCISES.find((e) => e.id === exerciseId);
  if (!ex) throw new ApiError("exercise_not_found", "問題が見つかりません。");
  const mat = effectiveMaterials().find((m) => m.id === ex.material_id);
  if (!mat || mat.review_status !== "approved") {
    throw new ApiError("material_not_approved", "この教材は現在公開されていないため、回答を送信できません。");
  }
  const text = String(answer);
  let attempt: ExerciseAttempt;
  if (ex.type === "single_choice") {
    const ok = Number(text) === ex.answer;
    attempt = {
      id: uuid(), exercise_id: ex.id, material_id: ex.material_id, answer: text,
      is_correct: ok, score: ok ? 1 : 0, feedback: ex.explanation, ai_reference_only: false, created_at: now(),
    };
  } else {
    const len = text.trim().length;
    const score = len >= 40 ? 0.8 : len >= 15 ? 0.6 : len > 0 ? 0.3 : 0;
    attempt = {
      id: uuid(), exercise_id: ex.id, material_id: ex.material_id, answer: text,
      is_correct: null, score,
      feedback:
        (len >= 15 ? "要点を押さえた回答です。" : "もう少し具体的に書いてみましょう。") +
        `\n参考解説：${ex.explanation}\n（この評価はダミーのAI評価で、参考値です。）`,
      ai_reference_only: true, created_at: now(),
    };
  }
  storeSet("attempts", [attempt, ...storeGet<ExerciseAttempt[]>("attempts", [])]);
  const p = storeGet<LearningProgress[]>("progress", []).find((x) => x.material_id === ex.material_id);
  if (!p || p.status === "not_started") await updateProgress(ex.material_id, "in_progress");
  return attempt;
}

// ---------- progress ----------
export async function getProgress(): Promise<ProgressSummary> {
  await delay(80);
  return {
    items: storeGet<LearningProgress[]>("progress", []),
    attempts: storeGet<ExerciseAttempt[]>("attempts", []),
  };
}

export async function updateProgress(materialId: string, status: ProgressStatus): Promise<LearningProgress> {
  await delay(80);
  const all = storeGet<LearningProgress[]>("progress", []).filter((p) => p.material_id !== materialId);
  const item: LearningProgress = {
    material_id: materialId, status,
    completed_at: status === "completed" ? now() : null, updated_at: now(),
  };
  storeSet("progress", [item, ...all]);
  return item;
}

/** 目標・回答・進捗・チャット履歴を削除（F-11, §13.1） */
export async function deleteHistory(): Promise<void> {
  await delay(200);
  ["goals", "attempts", "progress", "chat"].forEach(storeRemove);
}

// ---------- admin ----------
export async function listAllMaterials(): Promise<Material[]> {
  await delay(100);
  return effectiveMaterials();
}

export async function updateMaterialStatus(id: string, status: ReviewStatus): Promise<Material | null> {
  await delay(150);
  if (!MOCK_MATERIALS.some((m) => m.id === id)) return null;
  const o = storeGet<Record<string, ReviewStatus>>("material_status", {});
  o[id] = status;
  storeSet("material_status", o);
  return effectiveMaterials().find((m) => m.id === id) ?? null;
}
