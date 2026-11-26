import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-boot";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "用互动地球仪和等高线沙盘动手学地理，进度保存在此浏览器。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" data-theme="paper" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} /></head>
    <body className="app-bg min-h-dvh">{children}</body>
  </html>;
}
