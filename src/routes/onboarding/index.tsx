import { component$, useContext, useStore } from "@builder.io/qwik";
import { Link, useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { AuthContext, Card, EmptyState, FlowSteps, Icon } from "~/components";
import { GoalForm } from "~/components/chat/goal-form";
import { createGoal } from "~/services/api";
import type { LearningGoal } from "~/types";
import { p } from "~/services/base";

export default component$(() => {
  const auth = useContext(AuthContext);
  const nav = useNavigate();
  const goal = useStore<LearningGoal>({
    subject: "programming",
    topic: "python",
    current_level: "beginner",
    goal: "",
    study_minutes_per_day: 30,
    learning_days: 14,
    preferred_formats: ["article", "video"],
    language: "ja",
  });
  const ui = useStore({ saving: false, error: "" });

  const needLogin = auth.loaded && auth.state !== "signed_in";

  return (
    <div class="narrow">
      <FlowSteps current={0} />
      {needLogin ? (
        <EmptyState icon="lock" title={auth.state === "session_expired" ? "もう一度ログインしてください" : "ログインしてください"}>
          <Link class="btn btn-primary" href={p("/login/")}>ログイン</Link>
        </EmptyState>
      ) : (
        <>
          <Card>
            <h1 class="card-title">目標を決める</h1>
            <GoalForm
              goal={goal}
              idPrefix="ob"
              submitLabel="教材を探す"
              saving={ui.saving}
              error={ui.error}
              onSubmit$={async () => {
                ui.saving = true;
                ui.error = "";
                try {
                  await createGoal({ ...goal, goal: goal.goal.trim(), preferred_formats: [...goal.preferred_formats] });
                  await nav(p("/recommendations/"));
                } catch {
                  ui.error = "保存できませんでした。もう一度お試しください。";
                } finally {
                  ui.saving = false;
                }
              }}
            />
          </Card>
          <p class="alt-link">
            <Link href={p("/chat/")}><Icon name="chat" size={18} />迷ったらAIに相談</Link>
          </p>
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = { title: "目標を決める | AI Learning Navigator" };
