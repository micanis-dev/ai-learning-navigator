import { component$ } from "@builder.io/qwik";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import type { LearningGoal } from "~/data/home";

export const GoalCard = component$<{ goal: LearningGoal }>(({ goal }) => (
  // 面を持たず、他のカードの 95% 幅で中央にそろえる
  <Card.Root aria-labelledby="goal-title" class="mx-auto w-[95%] bg-transparent py-1">
    <Card.Title id="goal-title">
      <span class="mr-1.5 font-medium text-muted-foreground">学習目標：</span>
      {goal.title}
    </Card.Title>
    {/* 進捗率は目標文ではなくバーに添える */}
    <Card.Content class="mt-3 flex items-center gap-3">
      <Progress value={goal.progress} aria-label="学習進捗" class="flex-1" />
      <span class="text-xs font-semibold text-muted-foreground tabular-nums">{goal.progress}%</span>
    </Card.Content>
  </Card.Root>
));
