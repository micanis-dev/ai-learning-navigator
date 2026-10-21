import type { Level, MaterialFormat, ProgressStatus } from "~/types";
import type { IconName } from "../icon";

export const LEVEL_LABEL: Record<Level, string> = { beginner: "初心者", basic: "基礎", experienced: "経験者" };
export const FORMAT_LABEL: Record<MaterialFormat, string> = { article: "文章", video: "動画", interactive: "実践" };
export const FORMAT_ICON: Record<MaterialFormat, IconName> = { article: "article", video: "video", interactive: "code" };
export const PROGRESS_LABEL: Record<ProgressStatus, string> = {
  not_started: "未着手",
  in_progress: "学習中",
  completed: "完了",
};
