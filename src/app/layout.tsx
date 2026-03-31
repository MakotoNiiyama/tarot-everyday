import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic, Kaisei_Decol, Caveat } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const kaiseiDecol = Kaisei_Decol({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const caveat = Caveat({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Tarot Everyday — タロット暗記アプリ",
  description:
    "占い師を目指す人のためのタロットカード暗記・学習アプリ。78枚の早見表、カード詳細、1dayタロット占いで毎日の学習をサポート。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tarot Everyday",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#130C06",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenMaruGothic.variable} ${kaiseiDecol.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16">
        {children}
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
