import { component$, useContext } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { AuthContext, Icon, type IconName } from "~/components";
import styles from "./index.module.css";
import { p } from "~/services/base";

const FLOW: { icon: IconName; t: string }[] = [
  { icon: "chat", t: "話す" },
  { icon: "book", t: "教材が届く" },
  { icon: "play", t: "学ぶ" },
  { icon: "pencil", t: "問題で確認" },
];

export default component$(() => {
  const auth = useContext(AuthContext);
  const signedIn = auth.state === "signed_in";
  return (
    <section class={styles.hero}>
      <h1 class={styles.headline}>
        話すだけで、
        <br />
        学ぶ教材が決まる。
      </h1>
      <p class={styles.intro}>無料・検証済みの教材から3件をおすすめします。</p>

      <ol class={styles.route} aria-label="使い方">
        {FLOW.map((f) => (
          <li key={f.t} class={styles.station}>
            <span class={styles.dot}>
              <Icon name={f.icon} size={26} />
            </span>
            <span class={styles.name}>{f.t}</span>
          </li>
        ))}
      </ol>

      <div class={styles.cta} style={{ visibility: auth.loaded ? "visible" : "hidden" }} aria-hidden={auth.loaded ? undefined : "true"}>
        <Link class="btn btn-primary btn-lg" href={p(signedIn ? "/chat/" : "/login/")} tabIndex={auth.loaded ? undefined : -1}>
          <Icon name="chat" />
          {signedIn ? "相談をはじめる" : "はじめる"}
        </Link>
        {signedIn && (
          <Link class="btn btn-ghost btn-lg" href={p("/dashboard/")} tabIndex={auth.loaded ? undefined : -1}>
            <Icon name="play" size={16} />
            続きから
          </Link>
        )}
      </div>
    </section>
  );
});

export const head: DocumentHead = { title: "AI Learning Navigator" };
