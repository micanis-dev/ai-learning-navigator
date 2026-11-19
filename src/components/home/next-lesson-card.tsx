import { component$ } from "@builder.io/qwik";
import { ArrowRight, Clock, Flag } from "lucide";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import type { NextLesson } from "~/data/home";

export const NextLessonCard = component$<{ lesson: NextLesson }>(({ lesson }) => (
  <Card.Root aria-labelledby="next-lesson-title" class="flex flex-col gap-14 bg-primary p-5 text-primary-foreground">
    <Card.Header class="justify-start gap-2 py-1.5 text-xs font-bold">
      <span class="tracking-[0.06em]">STEP {lesson.step}</span>
      <span aria-hidden="true" class="opacity-60">·</span>
      <span class="flex items-center gap-[5px]">
        <Icon icon={Clock} strokeWidth={2.4} class="size-[13px]" />
        <span>
          {lesson.minutes}分<span class="sr-only">程度</span>
        </span>
      </span>
    </Card.Header>

    <Card.Content class="flex flex-col gap-4">
      <h1 id="next-lesson-title" class="text-[29px] leading-[1.4] font-bold tracking-[0.02em] whitespace-pre-line">
        {lesson.title}
      </h1>
      <p class="flex items-center gap-1.5 text-[13px] font-medium opacity-92">
        <Icon icon={Flag} strokeWidth={2.4} class="size-3.5" />
        {lesson.goal}
      </p>
    </Card.Content>

    <Button look="secondary" size="lg" class="justify-between pr-5">
      学習をはじめる
      <Icon icon={ArrowRight} strokeWidth={2.4} class="size-5 text-primary" />
    </Button>
  </Card.Root>
));
