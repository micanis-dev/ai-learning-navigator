import { Slot, component$ } from "@builder.io/qwik";

export const Badge = component$<{ tone?: "neutral" | "info" | "success" | "warn" | "danger" }>(({ tone = "neutral" }) => (
  <span class={`badge badge-${tone}`}>
    <Slot />
  </span>
));
