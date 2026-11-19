// Qwik UI styled kit の Button（qwik-ui add button 相当）をこのアプリの見た目に合わせたもの
import { component$, type PropsOf, Slot } from "@builder.io/qwik";
import { cn } from "@qwik-ui/utils";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "group inline-flex items-center justify-center rounded-base font-bold transition-all duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      look: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:press",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:press",
        ghost: "text-accent-foreground hover:bg-accent",
      },
      size: {
        sm: "h-8 px-2 text-sm",
        md: "h-12 px-4 text-base",
        lg: "h-[58px] px-6 text-base tracking-[0.06em]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      look: "primary",
      size: "md",
    },
  },
);

type ButtonProps = PropsOf<"button"> & VariantProps<typeof buttonVariants>;

export const Button = component$<ButtonProps>(({ size, look, ...props }) => {
  return (
    <button type="button" {...props} class={cn(buttonVariants({ size, look }), props.class)}>
      <Slot />
    </button>
  );
});
