"use client";
import Link from "next/link";
import { pointHref } from "@/data/catalog";
import { homeCourse, learnerOverview } from "@/lib/course-view";
import { BookCover } from "@/components/course/BookCover";
import { AppShell, Card } from "@/components/shell/AppShell";
import { useLearning } from "@/lib/progress";
import { canStartLesson } from "@/lib/lesson-availability";
import { ArrowRight, CheckCircle, Compass, Star } from "@/components/ui/Icon";

function Bar({ value, max, label, tone = "accent" }: { value: number; max: number; label: string; tone?: "accent" | "good" }) {
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-panel-border">
    <div className={`h-full rounded-full transition-[width] duration-500 ${tone === "good" ? "bg-good" : "bg-accent"}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
  </div>;
}

export function HomeView() {
  const learning = useLearning("guest");
  const { book, chapters, stats, next, resuming, latest, stars } = homeCourse(learning, canStartLesson);
  const { completed } = learnerOverview(learning);
  return <AppShell active="/home" title="地理探究" subtitle="学习进度保存在此浏览器">
    {!learning.ready ? <div data-nosnippet="" className="panel p-6 text-sm text-muted" role="status">
      正在读取学习记录…
    </div> : <div className="grid gap-5 wide:grid-cols-12">
      <section className="panel overflow-hidden wide:col-span-12">
        <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex min-w-0 flex-col p-6 sm:p-7">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="min-w-0 flex-1">
                <p className="label">{book.title} · {book.theme}</p>
                <h2 className="h-display mt-3 text-[26px] sm:text-[32px]">{next?.plan.title ?? "本册已开放内容已学完"}</h2>
                {next ? <>
                  <p className="mt-1 text-sm text-muted">{next.chapter.no} {next.chapter.title}</p>
                  <p className="mt-3 max-w-[38ch] text-[15px] leading-7 text-muted">{next.plan.summary}</p>
                </> : <p className="mt-3 text-sm leading-6 text-muted">可以回顾已学内容，或前往教材课程选择其他探究。</p>}
                {latest && <p className="mt-4 flex items-center gap-1.5 text-sm text-muted"><CheckCircle size={15} className="shrink-0 text-good" aria-hidden="true" />最近完成 · {latest.plan.title}</p>}
              </div>
              <BookCover book={book} className="w-16 shrink-0 sm:w-20" />
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-7">
              {next && <Link href={pointHref(book.id, next.point.id)} className="btn">{resuming ? "继续学习" : stats.done ? "学下一节" : "开始探险"}<ArrowRight size={16} weight="bold" /></Link>}
              <Link href={`/courses/${book.id}`} className="btn btn-secondary">课程路线</Link>
              <Link href="/courses" className="btn btn-secondary">切换教材</Link>
            </div>
          </div>
          <div className="min-w-0 border-t border-panel-border bg-raised p-6 sm:p-7 md:border-t-0 md:border-l">
            <div className="flex items-baseline gap-2"><h3 className="text-sm font-bold">课程进度</h3><span className="text-xs text-muted">{book.short} · 已开放 {stats.open} / {stats.total} 节</span></div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <p className="flex items-baseline gap-1.5 text-sm text-muted"><span className="num text-3xl font-bold text-ink">{stats.done}</span><span className="num">/ {stats.open}</span>节完成</p>
              <p className="flex items-center gap-1 text-sm text-muted"><Star size={15} weight="fill" className="text-accent-3" aria-hidden="true" /><span className="num font-semibold text-ink">{stars}</span>/ {stats.open * 3} 星</p>
            </div>
            <div className="mt-3"><Bar value={stats.done} max={stats.open} label={`${book.short}完成进度`} /></div>
            <ul className="mt-5 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {chapters.map(({ chapter, lessons, done }) => <li key={chapter.id} className="min-w-0">
                <Link href={`/courses/${book.id}`} className="group block">
                  <span className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate text-muted group-hover:text-ink"><span className="mr-1.5 text-xs">{chapter.no}</span>{chapter.title}</span>
                    <span className={`num shrink-0 text-xs font-semibold ${done === lessons.length ? "text-good" : ""}`}>{done}/{lessons.length}</span></span>
                  <span className="mt-1 block"><Bar value={done} max={lessons.length} label={`${chapter.title}完成进度`} tone={done === lessons.length ? "good" : "accent"} /></span>
                </Link>
              </li>)}
            </ul>
            {chapters.length < book.chapters.length && <p className="mt-4 text-xs text-muted">其余章节可在课程路线查看。</p>}
          </div>
        </div>
      </section>


      <Card title="最近完成" className="wide:col-span-12"
        extra={<Link href="/courses" className="text-sm font-semibold text-accent hover:underline">教材课程</Link>}>
        {completed.length ? <ul className="divide-y divide-panel-border">
          {completed.slice(0, 4).map(lesson => <li key={lesson.key}>
            <Link href={pointHref(lesson.book.id, lesson.point.id)} className="group flex min-h-12 items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold group-hover:text-accent">{lesson.plan.title}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{lesson.book.short} · {lesson.chapter.title}</span>
              </span>
              <span className="flex shrink-0 gap-0.5 text-accent-3" aria-label={`最高 ${lesson.result.stars} 星`}>
                {[1, 2, 3].map(star => <Star key={star} size={14} weight={star <= lesson.result.stars ? "fill" : "regular"} aria-hidden="true" />)}
              </span>
            </Link>
          </li>)}
        </ul> : <div className="flex items-start gap-3 text-sm text-muted">
          <Compass size={22} weight="duotone" className="shrink-0 text-accent" aria-hidden="true" />
          <p className="leading-6">还没有完成记录。完成一节探究后，会在这里看到星级。</p>
        </div>}
      </Card>
    </div>}
  </AppShell>;
}
