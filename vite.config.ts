import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  // GitHub Pages ではリポジトリ名のサブパスで配信される。ローカルは "/"
  base: process.env.BASE_PATH ?? "/",
  plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
  server: { headers: { "Cache-Control": "public, max-age=0" } },
  preview: { headers: { "Cache-Control": "public, max-age=600" } },
}));
