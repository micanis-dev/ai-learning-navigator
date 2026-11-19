// ホーム画面の表示データ。API ができるまではここのモックを使う

export interface LearningGoal {
  title: string;
  /** 0–100 */
  progress: number;
}

export interface NextLesson {
  step: number;
  minutes: number;
  /** 改行位置を指定したいときは \n を入れる */
  title: string;
  goal: string;
}

export interface RecentLesson {
  id: string;
  title: string;
  minutes: number;
}

export interface HomeData {
  unreadNotifications: number;
  goal: LearningGoal;
  next: NextLesson;
  recent: RecentLesson[];
}

export const homeData: HomeData = {
  unreadNotifications: 99,
  goal: { title: "日々の作業をAIで時短する", progress: 60 },
  next: {
    step: 3,
    minutes: 10,
    title: "プロンプトで\n文章を要約する",
    goal: "長文を3行にまとめる",
  },
  recent: [
    { id: "python-basics-6", title: "Python 基礎 ⑥", minutes: 20 },
    { id: "genai-basics", title: "生成AIの基礎", minutes: 30 },
    { id: "python-intro", title: "Python 入門", minutes: 20 },
  ],
};
