import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { ChevronRight, CircleCheck } from "lucide";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Separator } from "~/components/ui/separator";
import type { RecentLesson } from "~/data/home";

export const RecentCard = component$<{ lessons: RecentLesson[] }>(({ lessons }) => (
  <Card.Root aria-labelledby="recent-title" class="px-[18px] py-1">
    <Link href={`${import.meta.env.BASE_URL}history/`}>
      <Card.Header class="h-[46px]">
        <Card.Title id="recent-title">最近の学習</Card.Title>
        <Icon icon={ChevronRight} strokeWidth={2.2} class="size-[18px] text-icon" />
        <span class="sr-only">すべて見る</span>
      </Card.Header>
    </Link>
    <Card.Content>
      <ul>
        {lessons.map((l) => (
          <li key={l.id}>
            <Separator />
            <div class="flex h-[49px] items-center gap-3">
              <Icon icon={CircleCheck} strokeWidth={2.2} class="size-[18px] text-highlight" />
              <span class="min-w-0 flex-1 truncate text-sm font-semibold">{l.title}</span>
              <span class="text-[13px] font-semibold text-muted-foreground">{l.minutes}分</span>
            </div>
          </li>
        ))}
      </ul>
    </Card.Content>
  </Card.Root>
));
