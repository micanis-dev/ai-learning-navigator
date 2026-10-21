import { createContextId } from "@builder.io/qwik";
import type { AuthState, User } from "~/types";

export interface AuthStore {
  state: AuthState;
  user: User | null;
  loaded: boolean;
}
/** layout.tsx が provide。ログイン/ログアウト後は store.state / store.user を更新すること。 */
export const AuthContext = createContextId<AuthStore>("aln.auth");
