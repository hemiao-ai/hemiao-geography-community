"use client";

import { useState } from "react";
import { LIBRARY_BOOKS, SMARTEDU_CATALOG_URL, SMARTEDU_STAGES, XIANGJIAO_RELEASE_URL, type LibraryBook } from "@/data/textbook-library";
import { textbookCoverArt } from "@/data/textbook-cover-art";
import { ArrowRight, FilePdf } from "@/components/ui/Icon";
import { LibraryBookCover } from "./BookCover";
import { CourseCard } from "./CourseCard";

const stages = ["全部", ...SMARTEDU_STAGES] as const;
type StageFilter = (typeof stages)[number];

function TextbookCard({ book }: { book: LibraryBook }) {
  const art = textbookCoverArt(book);
  return <CourseCard href={"/courses/" + book.id}
    cover={<LibraryBookCover book={book} className="w-full" />}
    subtitle={[book.stage, art?.theme].filter(Boolean).join(" · ")}
    title={book.edition + " " + book.volume} titleLevel="h4" chapters={book.chapters}
    aside={<div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
      {book.pages && <span className="flex items-center gap-1.5 text-xs text-muted"><FilePdf size={15} aria-hidden="true" />{book.pages} 页</span>}
      <span className="btn btn-secondary btn-sm justify-between">查看教材<ArrowRight size={13} aria-hidden="true" /></span>
    </div>} />;
}

export function TextbookLibrary() {
  const [stage, setStage] = useState<StageFilter>("全部");
  const [edition, setEdition] = useState("");
  const stageBooks = LIBRARY_BOOKS.filter(book => stage === "全部" || book.stage === stage);
  const editions = Array.from(new Set(stageBooks.map(book => book.edition)));
  const books = edition ? stageBooks.filter(book => book.edition === edition) : stageBooks;
  const publishers = books.filter(book => book.source === "publisher");

  return <section id="textbook-library" aria-labelledby="textbook-library-title" className="scroll-mt-6 space-y-6 border-t border-panel-border pt-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h2 id="textbook-library-title" className="h-display text-xl">地理教材库</h2>
      <a href={SMARTEDU_CATALOG_URL} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">打开官方平台<ArrowRight size={14} aria-hidden="true" /></a>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="学段">
        {stages.map(option => <button type="button" key={option} aria-pressed={stage === option}
          className={"btn btn-sm " + (stage === option ? "" : "btn-secondary")} onClick={() => { setStage(option); setEdition(""); }}>
          {option === "初中（五•四学制）" ? "五四学制" : option}
        </button>)}
      </div>
      <select aria-label="教材版本" className="btn btn-secondary btn-sm max-w-full" value={edition} onChange={event => setEdition(event.target.value)}>
        <option value="">全部版本</option>
        {editions.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <span className="label" role="status">{books.length} 册</span>
    </div>
    {SMARTEDU_STAGES.map(name => {
      const sourceBooks = books.filter(book => book.stage === name && book.source === "smartedu");
      if (!sourceBooks.length) return null;
      return <section key={name} className="space-y-4">
        <h3 className="h-display text-lg">{name} · 智慧教育平台</h3>
        {sourceBooks.map(book => <TextbookCard key={book.id} book={book} />)}
      </section>;
    })}
    {publishers.length > 0 && <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="h-display text-lg">湘教版 · 出版社公开电子版</h3>
        <a href={XIANGJIAO_RELEASE_URL} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">出版社发布页<ArrowRight size={14} aria-hidden="true" /></a>
      </div>
      {publishers.map(book => <TextbookCard key={book.id} book={book} />)}
    </section>}
  </section>;
}
