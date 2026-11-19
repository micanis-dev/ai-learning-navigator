// Qwik UI styled kit の Progress（qwik-ui add progress 相当）
import { type PropsOf, component$ } from "@builder.io/qwik";
import { Progress as HeadlessProgress } from "@qwik-ui/headless";
import { cn } from "@qwik-ui/utils";

export const Progress = component$<PropsOf<typeof HeadlessProgress.Root>>((props) => {
  return (
    <HeadlessProgress.Root {...props} class={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", props.class)}>
      <HeadlessProgress.Indicator class="h-full w-full flex-1 rounded-full bg-highlight transition-transform" />
    </HeadlessProgress.Root>
  );
});
