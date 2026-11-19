// Qwik UI styled kit の Card（qwik-ui add card 相当）。このアプリでは枠線・影なし
import { component$, type PropsOf, Slot } from "@builder.io/qwik";
import { cn } from "@qwik-ui/utils";

const Root = component$<PropsOf<"section">>((props) => {
  return (
    <section {...props} class={cn("rounded-base bg-card text-card-foreground", props.class)}>
      <Slot />
    </section>
  );
});

const Header = component$<PropsOf<"div">>((props) => {
  return (
    <div {...props} class={cn("flex items-center justify-between", props.class)}>
      <Slot />
    </div>
  );
});

const Title = component$<PropsOf<"h2">>((props) => {
  return (
    <h2 {...props} class={cn("text-[15px] leading-snug font-bold", props.class)}>
      <Slot />
    </h2>
  );
});

const Description = component$<PropsOf<"p">>((props) => {
  return (
    <p {...props} class={cn("text-[13px] font-medium text-muted-foreground", props.class)}>
      <Slot />
    </p>
  );
});

const Content = component$<PropsOf<"div">>((props) => {
  return (
    <div {...props} class={cn(props.class)}>
      <Slot />
    </div>
  );
});

const Footer = component$<PropsOf<"div">>((props) => {
  return (
    <div {...props} class={cn("flex items-center", props.class)}>
      <Slot />
    </div>
  );
});

export const Card = {
  Root,
  Header,
  Title,
  Description,
  Content,
  Footer,
};
