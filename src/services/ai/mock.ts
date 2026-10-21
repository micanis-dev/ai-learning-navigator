// モックAI。実際のAIは一切呼び出さない（承認後に ChatGPTPlanLearningAI へ差し替える）。
import type {
  ChatEvent,
  ChatMessage,
  Exercise,
  Level,
  LearningGoal,
  Material,
  MaterialExplanation,
  MaterialFormat,
} from "~/types";
import { MOCK_EXERCISES } from "../mock-data";
import type { LearningAI } from "./types";

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

/** ヒアリング項目（README §3.1）を順に聞く */
export const INTERVIEW_QUESTIONS = [
  "こんにちは！学習計画づくりをお手伝いします。まず、学びたい分野やテーマを教えてください。（例：Python、生成AIの活用）",
  "ありがとうございます。具体的にどんなことができるようになりたいですか？到達目標を教えてください。（例：CSVファイルを集計できる）",
  "現在の経験レベルを教えてください。（初心者・基礎・経験者）",
  "1日にどれくらい学習できますか？また、いつまでに達成したいですか？（例：毎日30分、2週間）",
  "希望する教材の形式はありますか？（文章・動画・実践、どれでもOK）",
  "使用言語は日本語でよろしいですか？",
];

function summarize(g: LearningGoal): string {
  const lv = { beginner: "初心者", basic: "基礎", experienced: "経験者" }[g.current_level];
  return `ありがとうございます。内容を整理しました。\n・分野：${g.topic === "python" ? "Python" : "生成AI活用"}\n・目標：${g.goal}\n・レベル：${lv}\n・学習時間：1日${g.study_minutes_per_day}分 × ${g.learning_days}日\n画面の「学習目標」を確認・編集して、保存すると教材を推薦します。`;
}

export class MockLearningAI implements LearningAI {
  async *chat(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<ChatEvent> {
    const userCount = messages.filter((m) => m.role === "user").length;
    const text =
      userCount < INTERVIEW_QUESTIONS.length
        ? INTERVIEW_QUESTIONS[userCount]
        : summarize(await this.extractGoal(messages));
    try {
      await sleep(300, signal);
      for (let i = 0; i < text.length; i += 3) {
        await sleep(30, signal);
        yield { type: "delta", text: text.slice(i, i + 3) };
      }
      yield { type: "done" };
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // 呼び出し側で cancelled 扱い
      yield { type: "error", code: "mock_error", message: "モックAIでエラーが発生しました。" };
    }
  }

  async extractGoal(messages: ChatMessage[]): Promise<LearningGoal> {
    const users = messages.filter((m) => m.role === "user").map((m) => m.content);
    const all = users.join("\n");
    const isAI = /生成AI|ChatGPT|プロンプト|AI活用/i.test(all) && !/python|パイソン|パイソン/i.test(users[0] ?? "");
    const level: Level = /経験者|上級|得意/.test(users[2] ?? all)
      ? "experienced"
      : /基礎|少し|初級/.test(users[2] ?? "") && !/初心者|初めて/.test(users[2] ?? "")
        ? "basic"
        : "beginner";
    // 学習時間・期間は「時間・期限」への回答（ユーザー発言 index 3）からだけ抽出する
    const timeAns = users[3] ?? "";
    const minutes = Number(/(\d+)\s*分/.exec(timeAns)?.[1] ?? 30);
    const hours = /(\d+)\s*時間/.exec(timeAns)?.[1];
    const weeks = /(\d+)\s*週間/.exec(timeAns)?.[1];
    const days = /(\d+)\s*日間/.exec(timeAns)?.[1];
    const months = /(\d+)\s*(か|ヶ|カ)?月/.exec(timeAns)?.[1];
    const learning_days = weeks ? Number(weeks) * 7 : days ? Number(days) : months ? Number(months) * 30 : 14;
    const formats: MaterialFormat[] = [];
    if (/文章|記事|読/.test(users[4] ?? "")) formats.push("article");
    if (/動画/.test(users[4] ?? "")) formats.push("video");
    if (/実践|演習|インタラクティブ/.test(users[4] ?? "")) formats.push("interactive");
    return {
      subject: isAI ? "ai_literacy" : "programming",
      topic: isAI ? "generative_ai" : "python",
      current_level: level,
      goal: users[1]?.trim() || (isAI ? "生成AIを学習に安全に活用できる" : "PythonでCSVデータを集計できる"),
      study_minutes_per_day: hours ? Number(hours) * 60 : Math.min(Math.max(minutes, 5), 480),
      learning_days,
      preferred_formats: formats.length ? formats : ["article", "video"],
      language: "ja",
    };
  }

  async explainMaterials(goal: LearningGoal, materials: Material[]): Promise<MaterialExplanation[]> {
    await sleep(200);
    return materials.map((m) => ({
      material_id: m.id,
      explanation: `「${goal.goal}」を目指すあなたに、約${m.duration_minutes}分の「${m.title}」は適しています。（モックAIによる説明）`,
    }));
  }

  async generateExercises(_goal: LearningGoal, materials: Material[]): Promise<Exercise[]> {
    await sleep(200);
    const ids = new Set(materials.map((m) => m.id));
    return MOCK_EXERCISES.filter((e) => ids.has(e.material_id));
  }
}
