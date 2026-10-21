import { staticAdapter } from "@builder.io/qwik-city/adapters/static/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

// GitHub Pages 用の静的書き出し。BASE_PATH はリポジトリ名（例: /ai-learning-navigator/）
export default extendConfig(baseConfig, () => ({
  build: {
    ssr: true,
    rollupOptions: { input: ["@qwik-city-plan"] },
  },
  plugins: [
    staticAdapter({
      origin: process.env.SITE_ORIGIN ?? "https://micanis-dev.github.io",
    }),
  ],
}));
