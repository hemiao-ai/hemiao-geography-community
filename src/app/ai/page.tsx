import type { Metadata } from "next";
import { GuideChat } from "@/components/ai/GuideChat";
import { AppShell } from "@/components/shell/AppShell";
import { guideConfig } from "@/lib/ai/config";
import { lessonContext } from "@/lib/ai/guide";

export const metadata: Metadata = { title: "AI 地理向导", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ point?: string | string[] }> }) {
  const lesson = lessonContext((await searchParams).point);
  return <AppShell active="/ai" title="AI 地理向导" subtitle="问概念、找原因，也可以请芽芽出题">
    <GuideChat key={lesson?.key ?? "general"} enabled={!!guideConfig()} point={lesson?.key} lessonTitle={lesson?.point.title} />
  </AppShell>;
}
