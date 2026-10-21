/** 配信先のサブパス（GitHub Pages ではリポジトリ名）。末尾スラッシュなし */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** アプリ内のパス（"/chat/" など）を、配信先のサブパス付きにする */
export const p = (path: string) => BASE + path;

/** 現在のURLのパスからサブパスを取り除く */
export const unbase = (pathname: string) => (BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || "/" : pathname);
