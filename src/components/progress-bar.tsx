import { component$ } from "@builder.io/qwik";

export const ProgressBar = component$<{ value: number; label?: string }>(({ value, label }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div class="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div class="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
});
