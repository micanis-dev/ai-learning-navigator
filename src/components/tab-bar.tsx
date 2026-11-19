import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { GalleryVerticalEnd, House, MessageCircleText, Settings } from "lucide";
import { Icon } from "./ui/icon";

const BASE = import.meta.env.BASE_URL;

const TABS = [
  { path: "", label: "ホーム", icon: House },
  { path: "chat/", label: "チャット", icon: MessageCircleText },
  { path: "history/", label: "履歴", icon: GalleryVerticalEnd },
  { path: "settings/", label: "設定", icon: Settings },
];

export const TabBar = component$(() => {
  const loc = useLocation();

  return (
    <nav
      aria-label="メインメニュー"
      class="flex shrink-0 items-center justify-center bg-tab px-3 pt-[5px] pb-[max(5px,env(safe-area-inset-bottom))]"
    >
      {TABS.map(({ path, label, icon }) => {
        const href = BASE + path;
        const active = loc.url.pathname === href;
        return (
          <Link
            key={path}
            href={href}
            aria-current={active ? "page" : undefined}
            class={[
              "flex h-[54px] flex-1 flex-col items-center gap-0.5 pt-[5px] text-[10.5px]",
              active ? "font-bold text-tab-active" : "font-medium text-muted-foreground",
            ]}
          >
            <span class={["grid h-[30px] w-[52px] place-items-center", !active && "text-icon"]}>
              <Icon icon={icon} strokeWidth={active ? 2.2 : 1.8} class="size-6" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
});
