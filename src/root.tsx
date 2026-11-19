import { component$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet, useDocumentHead } from "@builder.io/qwik-city";
import "./global.css";

// 各ルートの `head` からタイトルを反映する
const DocTitle = component$(() => <title>{useDocumentHead().title || "AI学びナビ"}</title>);

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Noto+Sans+JP:wght@500;600;700&display=swap"
        />
        <DocTitle />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
