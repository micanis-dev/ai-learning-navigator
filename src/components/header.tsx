import { component$, useContext, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { AuthContext } from "./auth-context";
import { Icon, type IconName } from "./icon";
import { signOut } from "~/services/auth";
import { p, unbase } from "~/services/base";

const NAV: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: p("/"), label: "ホーム", icon: "home", match: [] },
  { href: p("/chat/"), label: "相談", icon: "chat", match: ["/chat/", "/onboarding/"] },
  { href: p("/recommendations/"), label: "教材", icon: "book", match: ["/recommendations/", "/materials/", "/exercises/"] },
  { href: p("/dashboard/"), label: "記録", icon: "chart", match: ["/dashboard/"] },
  { href: p("/settings/"), label: "設定", icon: "settings", match: ["/settings/"] },
];
const ADMIN_NAV = { href: p("/admin/materials/"), label: "管理", icon: "shield" as IconName, match: ["/admin/"] };

export const Header = component$(() => {
  const auth = useContext(AuthContext);
  const loc = useLocation();
  const path = unbase(loc.url.pathname);
  const logout = $(async () => {
    await signOut();
    auth.state = "signed_out";
    auth.user = null;
    location.href = p("/");
  });
  const items = auth.state === "signed_in" && auth.user?.role === "admin" ? [...NAV, ADMIN_NAV] : NAV;
  return (
    <header class="site-header">
      <div class="container header-inner">
        <Link href={p("/")} class="logo">
          AI Learning Navigator
        </Link>
        {/* PCでは上部、スマホでは画面下のタブバーになる */}
        <nav class="nav" aria-label="メイン">
          {items.map((n) => {
            const active = n.match.length === 0 ? path === "/" : n.match.some((m) => path.startsWith(m));
            return (
              <Link key={n.href} href={n.href} class={["nav-link", active && "active"]} aria-current={active ? "page" : undefined}>
                <Icon name={n.icon} size={22} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div class={["auth-area", !auth.loaded && "auth-placeholder"]} aria-hidden={!auth.loaded ? "true" : undefined}>
          {auth.state === "signed_in" && auth.user ? (
            <>
              <span class="avatar" title={auth.user.display_name}>
                {auth.user.display_name.slice(0, 1)}
              </span>
              <button class="icon-btn" onClick$={logout} aria-label="ログアウト" title="ログアウト">
                <Icon name="logout" />
              </button>
            </>
          ) : (
            <Link href={p("/login/")} class="btn btn-primary btn-sm">
              {auth.state === "session_expired" ? "再ログイン" : "ログイン"}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
});
