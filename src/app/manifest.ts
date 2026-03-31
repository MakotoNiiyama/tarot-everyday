import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tarot Everyday — タロット暗記アプリ",
    short_name: "Tarot Everyday",
    description:
      "占い師を目指す人のためのタロットカード暗記・学習アプリ。78枚の早見表、カード詳細、1dayタロット占いで毎日の学習をサポート。",
    start_url: "/",
    display: "standalone",
    background_color: "#130C06",
    theme_color: "#130C06",
    orientation: "portrait",
    categories: ["education", "lifestyle"],
    icons: [
      {
        src: "/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
