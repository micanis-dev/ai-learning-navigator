import { Slot, component$ } from "@builder.io/qwik";

export const Card = component$<{ title?: string; class?: string }>(({ title, class: c }) => (
  <section class={["card", c]}>
    {title && <h2 class="card-title">{title}</h2>}
    <Slot />
  </section>
));
