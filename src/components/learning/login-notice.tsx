import { component$ } from "@builder.io/qwik";
import { EmptyState } from "../empty-state";
import { Button } from "../button";
import { p } from "~/services/base";

/** 未ログイン時にログインへ誘導する */
export const LoginNotice = component$(() => (
  <EmptyState icon="lock" title="ログインしてください">
    <Button href={p("/login/")}>ログイン</Button>
  </EmptyState>
));
