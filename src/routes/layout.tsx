import { Slot, component$ } from "@builder.io/qwik";
import { TabBar } from "~/components/tab-bar";

// 画面全体: ページ（固定ヘッダー + スクロール領域）とタブバー
export default component$(() => (
  <div class="mx-auto flex h-dvh max-w-[480px] flex-col bg-background">
    <main class="flex min-h-0 flex-1 flex-col">
      <Slot />
    </main>
    <TabBar />
  </div>
));
