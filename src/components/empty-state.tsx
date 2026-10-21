import { Slot, component$ } from "@builder.io/qwik";
import { Icon, type IconName } from "./icon";

export const EmptyState = component$<{ title: string; description?: string; icon?: IconName }>(({ title, description, icon = "sparkle" }) => (
  <div class="empty">
    <span class="empty-icon"><Icon name={icon} size={28} /></span>
    <p class="empty-title">{title}</p>
    {description && <p class="empty-desc">{description}</p>}
    <div class="empty-actions"><Slot /></div>
  </div>
));
