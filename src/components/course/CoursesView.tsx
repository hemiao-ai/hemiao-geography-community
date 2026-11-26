"use client";
import { BOOKS } from "@/data/catalog";
import { LIBRARY_BOOKS } from "@/data/textbook-library";
import { bookStats } from "@/lib/course-view";
import { useLearning } from "@/lib/progress";
import { hasTianditu } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { ArrowRight } from "@/components/ui/Icon";
import { CourseCard } from "./CourseCard";
import { BookCover } from "./BookCover";
import { TextbookLibrary } from "./TextbookLibrary";

export function CoursesView() {
  const { progress } = useLearning("guest");
  return <AppShell active="/courses" title="教材课程" subtitle="初高中地理 · 课程路线与教材库">
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="h-display text-lg">人教版初中课程路线</h2>
        <a href="#textbook-library" className="btn btn-secondary btn-sm">教材库 · {LIBRARY_BOOKS.length} 册<ArrowRight size={14} /></a>
      </div>
      {BOOKS.map(book => {
        const stats = bookStats(book, progress);
        const chapters = book.chapters.map(chapter => <><span className="num mr-2 text-xs">{chapter.no}</span>{chapter.title}</>);
        return <CourseCard key={book.id} href={"/courses/" + book.id}
          cover={<BookCover book={book} className="w-full" />} title={book.title}
          subtitle={[book.grade, book.theme].join(" · ")} chapters={chapters}
          aside={<div className="space-y-2">
            <dl className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {[["章", stats.chapters], ["知识主题", stats.total], ["互动探究", stats.open]].map(([label, value]) => <div key={label} className="lg:flex lg:items-baseline lg:justify-between">
                <dt className="label">{label}</dt><dd className="num text-xl font-bold">{value}</dd>
              </div>)}
            </dl>
            <span className="btn btn-secondary btn-sm">查看路线<ArrowRight size={13} /></span>
          </div>} />;
      })}
      <p className="text-xs text-muted">教材目录按官方版整理。原书由智慧教育平台和出版社提供。</p>
      {!hasTianditu && <p className="text-xs text-muted">含标准底图的探究需配置天地图 Key 和审图号。</p>}
      <TextbookLibrary />
    </div>
  </AppShell>;
}
