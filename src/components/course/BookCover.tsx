import Image from "next/image";
import type { Book } from "@/data/catalog";
import { textbookCoverArt } from "@/data/textbook-cover-art";
import type { LibraryBook } from "@/data/textbook-library";
import { Plant } from "@/components/ui/Icon";

function GeographyCover({ title, volume, edition, source, color, className }: {
  title: string;
  volume: string;
  edition: string;
  source?: string;
  color: string;
  className: string;
}) {
  return <div aria-hidden="true" className={"@container relative aspect-[3/4] overflow-hidden rounded-[10px] text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,.6)] " + className}
    style={{ background: color }}>
    {source && <Image src={source} alt="" fill unoptimized className="object-cover" />}
    <div className="absolute inset-x-0 top-0 h-[36%] bg-linear-to-b from-black/55 via-black/25 to-transparent" />
    <div className="absolute left-[7%] top-[5%] flex max-w-[86%] flex-col items-start leading-none">
      <span className="text-[20cqw] font-black text-shadow-[0_1px_1px_#0008]">{title}</span>
      <span className="mt-[2cqw] rounded-[36%_16%_30%_14%/24%_38%_30%_40%] bg-[#ffe474] px-[2.8cqw] py-[1.5cqw] text-[11cqw] font-black text-[#482a13]">{volume}</span>
      <span className="mt-[2cqw] text-[8cqw] leading-[1.15] font-bold text-shadow-[0_1px_2px_#000,0_0_2px_#000]">{edition}</span>
    </div>
    <span className="absolute bottom-0 right-0 flex w-[58%] items-center justify-end gap-[2cqw] rounded-tl-[80%] bg-[#174e37] pb-[4cqw] pr-[5cqw] pt-[7cqw] text-[8.5cqw] font-bold leading-none text-[#fff6dc]">
      <Plant className="size-[9cqw] text-[#d9ef91]" weight="fill" />禾苗地理
    </span>
  </div>;
}

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  return <GeographyCover title="初中地理" volume={book.title.replace(/^人教版\s+/, "")} edition="人教版"
    color={book.color} source={book.cover} className={className} />;
}

export function LibraryBookCover({ book, className = "" }: { book: LibraryBook; className?: string }) {
  const art = textbookCoverArt(book);
  const highSchool = book.stage === "高中";
  const edition = book.source === "publisher" ? "湘教版 · 公开电子版"
    : book.edition.replace(/（主编：(.+)）$/, " · $1");
  return <GeographyCover title={highSchool ? "高中地理" : "初中地理"} volume={art?.label ?? book.volume}
    edition={edition} color={art?.color ?? "#15544b"} source={art?.src} className={className} />;
}
