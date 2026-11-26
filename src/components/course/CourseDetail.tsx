"use client";
import Link from "next/link";
import { bookById, pointHref, pointKey } from "@/data/catalog";
import { LESSON_PLANS } from "@/data/lessons";
import { bookStats, pointStatus } from "@/lib/course-view";
import { useLearning } from "@/lib/progress";
import { canStartLesson } from "@/lib/lesson-availability";
import { AppShell } from "@/components/shell/AppShell";
import { ArrowRight, CaretLeft, Compass, Star } from "@/components/ui/Icon";
import { BookCover } from "./BookCover";

export function CourseDetail({ bookId }: { bookId: string }) {
  const book = bookById(bookId)!, { progress } = useLearning("guest"), s = bookStats(book, progress);
  return <AppShell active="/courses" title={book.title} subtitle={`${book.theme} · ${s.chapters} 章 · ${s.total} 个知识主题`} actions={<Link href="/courses" className="btn btn-secondary btn-sm"><CaretLeft size={14} />全部教材</Link>}>
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start"><BookCover book={book} className="w-[160px]" />
        <dl className="divide-y divide-panel-border text-sm">{[["互动探究", `${s.done} / ${s.open} 完成`], ["项目课", `${s.projects} 节`]].map(([k, v]) => <div key={k} className="flex justify-between py-2.5"><dt className="text-muted">{k}</dt><dd className="num font-bold">{v}</dd></div>)}</dl>
        <p className="text-xs leading-5 text-muted">进度保存在此浏览器。地图探究使用天地图标准底图。</p></aside>
      <div className="space-y-8">{book.chapters.map(chapter => <section key={chapter.id}>
        <div className="flex items-baseline gap-3 border-b-2 border-ink pb-2"><span className="label">{chapter.no}</span><h2 className="h-display text-xl">{chapter.title}</h2><span className="ml-auto text-xs text-muted">{chapter.points.length} 节</span></div>
        <ol className="divide-y divide-panel-border">{chapter.points.map((p, i) => { const st = pointStatus(book, p, progress), key = pointKey(book.id, p.id), plan = LESSON_PLANS[key], live = st === "open" || st === "done";
          return <li key={p.id}><Link href={pointHref(book.id, p.id)} className={`group flex min-h-14 items-center gap-4 py-3 ${live ? "" : "text-muted"}`}>
            <span className="num w-8 shrink-0 text-sm text-muted">{chapter.id === "c0" ? "" : `${chapter.id.slice(1)}.${i + 1}`}</span>
            <span className="min-w-0 flex-1"><span className={`block truncate text-[15px] ${live ? "font-semibold text-ink" : ""}`}>{p.title}</span>
              {plan && <span className="mt-0.5 flex items-center gap-1.5 text-xs text-accent"><Compass size={13} weight="fill" />{plan.tools.join(" · ")}</span>}</span>
            {plan && !canStartLesson(plan.type) ? <span className="text-xs font-semibold text-accent-2">需配置天地图</span>
              : st === "done" ? <span className="flex text-accent-3">{[0, 1, 2].map(k => <Star key={k} size={14} weight={k < progress[key].stars ? "fill" : "regular"} />)}</span>
              : st === "open" ? <span className="btn btn-sm">开始探险<ArrowRight size={13} weight="bold" /></span>
              : <span className={`text-xs ${st === "project" ? "rounded-[6px] border border-dashed border-accent-2/70 px-2 py-0.5 text-accent-2" : ""}`}>{st === "project" ? "项目课" : "制作中"}</span>}
          </Link></li>; })}</ol>
      </section>)}</div>
    </div>
  </AppShell>;
}
