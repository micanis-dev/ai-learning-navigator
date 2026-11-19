import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { CalendarDays } from "lucide";
import { Badge } from "~/components/ui/badge";
import { Icon } from "~/components/ui/icon";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const today = () => {
  // 日付は日本時間で表示する
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), weekday: WEEKDAYS[d.getDay()] };
};

export const DateHeader = component$<{ unread: number }>(({ unread }) => {
  const date = useSignal(today());

  // 静的書き出しではビルド時の日付が埋め込まれるため、表示時に今日へ更新する
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    date.value = today();
  });

  const { year, month, day, weekday } = date.value;

  return (
    <header class="flex h-[72px] shrink-0 items-start justify-between pt-[14px] pr-[33px] pl-[31px]">
      <div class="font-bold">
        <p class="text-[13px] leading-4">{year}</p>
        <p class="-mt-[5px] text-[32px] leading-[39px]">
          <time dateTime={`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`}>
            {month} / {day} <span class="text-base">{weekday}</span>
          </time>
        </p>
      </div>
      <button type="button" aria-label={`カレンダー（お知らせ ${unread}件）`} class="relative h-[43px] w-[42px]">
        <Icon icon={CalendarDays} strokeWidth={2.1} class="absolute top-[9px] left-0 size-[34px]" />
        {unread > 0 && <Badge class="absolute top-0 right-0">{Math.min(unread, 99)}</Badge>}
      </button>
    </header>
  );
});
