import { component$ } from "@builder.io/qwik";

export const PageHeader = component$<{ title: string; lead?: string }>(({ title, lead }) => (
  <div class="page-header">
    <h1>{title}</h1>
    {lead && <p class="lead">{lead}</p>}
  </div>
));
