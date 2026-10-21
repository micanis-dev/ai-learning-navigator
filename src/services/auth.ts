// ===== ダミー認証 =====
// 実際の Sign in with ChatGPT（OIDC/PKCE）は外部承認待ちのためモック。
// 保存するのは「ログイン済みフラグ」のみで、トークン類は一切扱わない。
import type { AuthState, User } from "~/types";
import { MOCK_USER } from "./mock-data";
import { delay, storeGet, storeRemove, storeSet } from "./store";

const KEY = "auth";

export async function getAuthState(): Promise<AuthState> {
  return storeGet<AuthState>(KEY, "signed_out");
}

export async function signInWithChatGPT(): Promise<User> {
  await delay(400);
  storeSet<AuthState>(KEY, "signed_in");
  return MOCK_USER;
}

export async function signOut(): Promise<void> {
  await delay(150);
  storeRemove(KEY);
}

/** デモ用: セッション切れ状態を再現する */
export async function expireSession(): Promise<void> {
  storeSet<AuthState>(KEY, "session_expired");
}
