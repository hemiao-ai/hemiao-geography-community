import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { ArrowRight, CaretLeft, FilePdf } from "@/components/ui/Icon";
import { XIANGJIAO_RELEASE_URL, type LibraryBook } from "@/data/textbook-library";
import { LibraryBookCover } from "./BookCover";

export function TextbookDetail({ book }: { book: LibraryBook }) {
  const publisher = book.source === "publisher";
  const subtitle = [book.stage, book.edition + "地理"].join(" · ");
  return <AppShell active="/courses" title={book.volume} subtitle={subtitle}
    actions={<Link href="/courses#textbook-library" className="btn btn-secondary btn-sm"><CaretLeft size={14} />返回教材库</Link>}>
    <div className="grid max-w-5xl gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
      <LibraryBookCover book={book} className="w-32 sm:w-full" />
      <div className="space-y-5">
        <section className="panel space-y-3 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="h-display text-lg">教材原书</h2>
            {book.pages && <span className="label">PDF · {book.pages} 页</span>}
          </div>
          <p className="text-sm leading-6 text-muted">
            {publisher
              ? (book.stage === "初中" ? "湖南教育出版社 2020 年公开的旧版电子教材，供学习使用。" : "湖南教育出版社公开的高中电子教材，供学习使用。")
              : "国家中小学智慧教育平台电子教材，原书由平台提供，阅读时可能需要登录。"}
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={book.originalUrl} target="_blank" rel="noreferrer" className="btn btn-sm">
              {publisher ? <><FilePdf size={16} />打开出版社 PDF</> : <>在智慧教育平台读原书<ArrowRight size={14} /></>}
            </a>
            {publisher && <a href={XIANGJIAO_RELEASE_URL} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">出版社发布页<ArrowRight size={14} /></a>}
          </div>
        </section>
        {book.chapters.length > 0 && <section className="panel p-5">
          <h2 className="h-display text-lg">教材目录</h2>
          <ol className="mt-2 divide-y divide-panel-border text-sm">
            {book.chapters.map(chapter => <li key={chapter} className="py-2.5">{chapter}</li>)}
          </ol>
        </section>}
      </div>
    </div>
  </AppShell>;
}
