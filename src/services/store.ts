// localStorage を使った簡易ストア（キー接頭辞 aln:）。SSR時は何もしない。
// 注意: 認証・AIのトークン類は一切保存しない（そもそも存在しない）。
const PREFIX = "aln:";

export function storeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function storeSet<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 容量超過・プライベートモード等は無視 */
  }
}

export function storeRemove(key: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}

export const delay = (ms = 150) => new Promise<void>((r) => setTimeout(r, ms));

export function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
