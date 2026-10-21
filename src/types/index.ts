// README §5.2, §7.2, §8.1, §9, §10 に沿った型定義

export type AuthState = "signed_out" | "signed_in" | "session_expired";
export type AIStatus =
  | "unknown"
  | "consent_required"
  | "available"
  | "quota_exceeded"
  | "revoked"
  | "unsupported";
export type ChatStatus = "idle" | "streaming" | "completed" | "failed" | "cancelled";
export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type Level = "beginner" | "basic" | "experienced";
export type MaterialFormat = "article" | "video" | "interactive";
export type ReviewStatus = "pending" | "approved" | "suspended";

export interface User {
  id: string;
  display_name: string;
  role: "student" | "admin";
  plan_label?: string; // 表示用（モック）
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: string; message: string };

export interface LearningGoal {
  id?: string;
  subject: string; // 例: "programming" | "ai_literacy"
  topic: string; // 例: "python" | "generative_ai"
  current_level: Level;
  goal: string;
  study_minutes_per_day: number;
  learning_days: number;
  preferred_formats: MaterialFormat[];
  language: string; // "ja"
  created_at?: string;
}

export interface Material {
  id: string;
  title: string;
  url: string;
  provider: string;
  description: string;
  level: Level;
  duration_minutes: number;
  format: MaterialFormat;
  is_free: boolean;
  review_status: ReviewStatus;
  verified_at: string | null;
  tags: string[];
  topic?: string; // python | generative_ai（推薦用）
}

export interface Recommendation {
  material: Material;
  score: number; // 0..1
  reason: string;
}

export interface RecommendationResult {
  recommendation_id: string;
  recommendations: Recommendation[];
  /** 3件に満たない場合の不足理由・条件変更の提案 */
  shortage_reason?: string;
}

export interface MaterialExplanation {
  material_id: string;
  explanation: string;
}

export type ExerciseType = "single_choice" | "free_text" | "practice";

export interface Exercise {
  id: string;
  material_id: string;
  type: ExerciseType;
  question: string;
  choices?: string[];
  answer?: number | string; // single_choice: 正解インデックス
  explanation: string;
  rubric?: string;
}

export interface ExerciseAttempt {
  id: string;
  exercise_id: string;
  material_id: string;
  answer: string; // single_choice: 選択インデックスの文字列
  is_correct: boolean | null; // 記述式はnull
  score: number; // 0..1
  feedback: string;
  /** 記述式のAI評価は参考値 */
  ai_reference_only: boolean;
  created_at: string;
}

export interface LearningProgress {
  material_id: string;
  status: ProgressStatus;
  completed_at: string | null;
  updated_at: string;
}

export interface ProgressSummary {
  items: LearningProgress[];
  attempts: ExerciseAttempt[];
}
