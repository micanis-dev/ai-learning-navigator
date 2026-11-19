import { Slot, component$ } from "@builder.io/qwik";

// 固定ヘッダーとタブバーの間でスクロールする領域。上下の境界は背景色へフェードさせる
export const ScrollArea = component$(() => (
  <div class="relative min-h-0 flex-1">
    <div class="h-full overflow-y-auto overscroll-contain">
      <Slot />
    </div>
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-background to-transparent" />
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent" />
  </div>
));
