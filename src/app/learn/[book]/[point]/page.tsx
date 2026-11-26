import { notFound } from "next/navigation";
import Link from "next/link";
import { BOOKS, findPoint, pointKey } from "@/data/catalog";
import { LESSON_PLANS } from "@/data/lessons";
import { Workbench } from "@/components/lesson/Workbench";
import { canStartLesson } from "@/lib/lesson-availability";
import { AppShell, Card } from "@/components/shell/AppShell";

export function generateStaticParams() {
  return BOOKS.flatMap(b => b.chapters.flatMap(c => c.points.map(p => ({ book: b.id, point: p.id }))));
}
export default async function Page({ params }: { params: Promise<{ book: string; point: string }> }) {
  const { book, point } = await params, found = findPoint(book, point);
  if (!found) notFound();
  const plan = LESSON_PLANS[pointKey(book, point)], crumb = `${found.book.short} · ${found.chapter.no} ${found.chapter.title} · ${found.point.title}`;
  if (!plan || !canStartLesson(plan.type)) return <AppShell active="/courses" title={found.point.title} subtitle={crumb}>
    <Card title={plan ? "配置天地图后开始探究" : "教材目录"}>
      <p className="text-sm leading-7 text-muted">{plan
        ? <>这节课使用标准底图。请在 <code>.env.local</code> 填写 <code>NEXT_PUBLIC_TIANDITU_KEY</code> 和 <code>NEXT_PUBLIC_TIANDITU_CREDIT</code>，重新构建并启动。</>
        : "这一节目前提供教材目录参考。"}</p>
      <Link href={`/courses/${book}`} className="btn btn-secondary mt-4">返回课程路线</Link>
    </Card>
  </AppShell>;
  return <Workbench bookId={book} pointId={point} type={plan.type} title={plan.title} backHref={`/courses/${book}`} crumb={crumb} />;
}
