import type { LearningAI } from "./types";
import { MockLearningAI } from "./mock";

export type { LearningAI } from "./types";

let instance: LearningAI | null = null;

/** 承認後は ChatGPTPlanLearningAI に差し替える。現在はモックのみ。 */
export function getLearningAI(): LearningAI {
  return (instance ??= new MockLearningAI());
}
