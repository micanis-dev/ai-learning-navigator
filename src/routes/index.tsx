import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ScrollArea } from "~/components/scroll-area";
import { DateHeader } from "~/components/home/date-header";
import { GoalCard } from "~/components/home/goal-card";
import { NextLessonCard } from "~/components/home/next-lesson-card";
import { RecentCard } from "~/components/home/recent-card";
import { homeData } from "~/data/home";

export default component$(() => {
  const data = homeData;

  return (
    <>
      <DateHeader unread={data.unreadNotifications} />
      <ScrollArea>
        <div class="flex flex-col gap-3 px-4 pt-6 pb-4">
          <GoalCard goal={data.goal} />
          <NextLessonCard lesson={data.next} />
          <RecentCard lessons={data.recent} />
        </div>
      </ScrollArea>
    </>
  );
});

export const head: DocumentHead = {
  title: "ホーム | AI学びナビ",
};
