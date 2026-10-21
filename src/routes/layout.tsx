import { Slot, component$, useContextProvider, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { AuthContext, type AuthStore } from "~/components/auth-context";
import { DemoBanner } from "~/components/demo-banner";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { getAuthState } from "~/services/auth";
import { getMe } from "~/services/api";

export default component$(() => {
  const auth = useStore<AuthStore>({ state: "signed_out", user: null, loaded: false });
  useContextProvider(AuthContext, auth);

  // localStorage はブラウザでのみ読めるため、クライアントで初期化する
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    auth.state = await getAuthState();
    auth.user = await getMe();
    auth.loaded = true;
  }, { strategy: "document-ready" });

  return (
    <div class="app">
      <DemoBanner />
      <Header />
      <main class="container main">
        <Slot />
      </main>
      <Footer />
    </div>
  );
});
