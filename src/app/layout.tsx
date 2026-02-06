import "../../styles/global.css";
import { Metadata, Viewport } from "next";
import Script from "next/script";
import { RotatingBanner } from "../components/RotatingBanner";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "Remotion 视频生成器",
  description: "基于 Remotion 与 Next.js 的视频生成器",
  applicationName: "Remotion 视频生成器",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Remotion 视频生成器",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-background min-h-screen flex flex-col">
        <RotatingBanner />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
        <Script
          src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
