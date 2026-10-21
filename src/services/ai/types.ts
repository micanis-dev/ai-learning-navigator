import type {
  ChatEvent,
  ChatMessage,
  Exercise,
  LearningGoal,
  Material,
  MaterialExplanation,
} from "~/types";

// README §5.2 AIアダプター（論理IF）
export interface LearningAI {
  chat(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<ChatEvent>;
  extractGoal(messages: ChatMessage[]): Promise<LearningGoal>;
  explainMaterials(goal: LearningGoal, materials: Material[]): Promise<MaterialExplanation[]>;
  generateExercises(goal: LearningGoal, materials: Material[]): Promise<Exercise[]>;
}
