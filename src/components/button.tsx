import { Slot, component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface Props {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "md" | "sm";
  onClick$?: () => void;
}

/** href があれば Link（外部URLは <a>）、なければ <button>。 */
export const Button = component$<Props>(({ variant = "primary", href, type = "button", disabled, size = "md", onClick$ }) => {
  const cls = `btn btn-${variant} btn-${size}`;
  if (href && /^https?:/.test(href)) {
    return (
      <a class={cls} href={href} target="_blank" rel="noopener noreferrer">
        <Slot />
      </a>
    );
  }
  return href ? (
    <Link class={cls} href={href}>
      <Slot />
    </Link>
  ) : (
    <button class={cls} type={type} disabled={disabled} onClick$={onClick$}>
      <Slot />
    </button>
  );
});
