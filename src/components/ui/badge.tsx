// Qwik UI styled kit の Badge（qwik-ui add badge 相当）。通知件数用の丸いバッジ
import { component$, type PropsOf, Slot } from "@builder.io/qwik";
import { cn } from "@qwik-ui/utils";
import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva("inline-grid place-items-center rounded-full font-bold", {
  variants: {
    look: {
      primary: "bg-primary text-primary-foreground",
    },
    size: {
      md: "size-[25px] text-[13px]",
    },
  },
  defaultVariants: {
    look: "primary",
    size: "md",
  },
});

type BadgeProps = PropsOf<"span"> & VariantProps<typeof badgeVariants>;

export const Badge = component$<BadgeProps>(({ look, size, ...props }) => {
  return (
    <span {...props} class={cn(badgeVariants({ look, size }), props.class)}>
      <Slot />
    </span>
  );
});
