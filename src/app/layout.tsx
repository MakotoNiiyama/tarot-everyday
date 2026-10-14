import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic, Kaisei_Decol, Caveat } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";
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
  title: "Tarot Everyday — 毎日の占いノート",
  description: "タロットの練習と、生年月日から読み解く7つの占術で毎日の運勢を確かめる占いノート。",
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
  viewportFit: "cover",
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
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[232px]">
        {/* キーボード操作向け。フォーカスされたときだけ左上に表示する */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[calc(1rem+env(safe-area-inset-top))] focus:z-[100] focus:rounded-[14px] focus:border focus:border-gold/50 focus:bg-popover focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-gold-light focus:outline-none focus:ring-2 focus:ring-gold"
        >
          本文へスキップ
        </a>
        <SideNav />
        {/* DetailPanelLayout は flex-1 で高さを埋め、サイドパネルの sticky もこの中で効く */}
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </main>
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
