// Lucide 公式パッケージ（lucide）のアイコンデータを Qwik の SVG として描く。
// 使い方: import { House } from "lucide"; <Icon icon={House} class="size-6" />
import { component$, type PropsOf } from "@builder.io/qwik";
import { cn } from "@qwik-ui/utils";

export type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][];

type IconProps = PropsOf<"svg"> & {
  icon: IconNode;
  strokeWidth?: number;
};

export const Icon = component$<IconProps>(({ icon, strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    {...props}
    class={cn("shrink-0", props.class as string)}
  >
    {/* Lucide のノード名（path / circle / rect ...）をそのまま要素名に使う */}
    {icon.map(([Tag, attrs], i) => (
      <Tag key={i} {...attrs} />
    ))}
  </svg>
));
