import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Icon, type IconName } from "./icon";
import { p } from "~/services/base";

/** 学習の流れ。いまどこにいて次に何をするかを、通販の購入ステップと同じ形で示す */
const STEPS: { icon: IconName; label: string; href?: string }[] = [
  { icon: "target", label: "目標", href: p("/chat/") },
  { icon: "book", label: "教材", href: p("/recommendations/") },
  { icon: "play", label: "学ぶ" },
  { icon: "pencil", label: "問題" },
];

export const FlowSteps = component$<{ current: number }>(({ current }) => (
  <ol class="steps" aria-label="学習の流れ">
    {STEPS.map((st, i) => {
      const state = i < current ? "done" : i === current ? "now" : "todo";
      const body = (
        <>
          <span class="step-dot">
            <Icon name={state === "done" ? "check" : st.icon} size={18} />
          </span>
          <span class="step-label">{st.label}</span>
        </>
      );
      return (
        <li key={st.label} class={["step", `step-${state}`]} aria-current={state === "now" ? "step" : undefined}>
          {state === "done" && st.href ? <Link href={st.href}>{body}</Link> : <span>{body}</span>}
        </li>
      );
    })}
  </ol>
));
