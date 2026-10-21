import { component$, useContext, useStore } from "@builder.io/qwik";
import { Link, useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { AuthContext, Card, Icon, type IconName } from "~/components";
import { signInWithChatGPT } from "~/services/auth";
import { getMe, listGoals } from "~/services/api";
import { p } from "~/services/base";

/** 権限について、ログイン前に知っておきたいことだけをアイコン付きで示す */
const POINTS: { icon: IconName; t: string }[] = [
  { icon: "user", t: "本人確認に使います" },
  { icon: "sparkle", t: "AIは許可した操作だけ実行" },
  { icon: "eyeOff", t: "ChatGPTの会話履歴は読みません" },
];

export default component$(() => {
  const auth = useContext(AuthContext);
  const nav = useNavigate();
  const ui = useStore({ loading: false, error: "" });

  return (
    <div class="narrow">
      <Card class="login-card">
        <h1>ログイン</h1>
        {auth.state === "session_expired" && (
          <p role="alert" class="badge badge-warn">
            期限切れです。もう一度ログインしてください。
          </p>
        )}
        {auth.loaded && auth.state === "signed_in" ? (
          <Link class="btn btn-primary btn-lg btn-block" href={p("/chat/")}>
            <Icon name="chat" />
            相談をはじめる
          </Link>
        ) : (
          <button
            class="btn btn-primary btn-lg btn-block"
            disabled={ui.loading}
            onClick$={async () => {
              ui.loading = true;
              ui.error = "";
              try {
                await signInWithChatGPT();
                auth.user = await getMe();
                auth.state = "signed_in";
                const goals = await listGoals();
                await nav(p(goals.length > 0 ? "/chat/" : "/onboarding/"));
              } catch {
                ui.error = "ログインできませんでした。もう一度お試しください。";
              } finally {
                ui.loading = false;
              }
            }}
          >
            {ui.loading ? "ログイン中…" : "ChatGPTで続ける"}
          </button>
        )}
        {ui.error && (
          <p role="alert" class="login-error">
            {ui.error}
          </p>
        )}
        <ul class="login-points">
          {POINTS.map((p) => (
            <li key={p.t}>
              <Icon name={p.icon} size={18} />
              {p.t}
            </li>
          ))}
        </ul>
        <p class="login-demo">デモのため、実際の認証は行いません。</p>
      </Card>
    </div>
  );
});

export const head: DocumentHead = { title: "ログイン | AI Learning Navigator" };
