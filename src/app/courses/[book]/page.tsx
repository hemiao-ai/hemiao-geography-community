import { notFound } from "next/navigation";
import { BOOKS, bookById } from "@/data/catalog";
import { LIBRARY_BOOKS, libraryBookById } from "@/data/textbook-library";
import { CourseDetail } from "@/components/course/CourseDetail";
import { TextbookDetail } from "@/components/course/TextbookDetail";

export function generateStaticParams() {
  return [...BOOKS, ...LIBRARY_BOOKS].map(book => ({ book: book.id }));
}

export default async function Page({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  if (bookById(book)) return <CourseDetail bookId={book} />;
  const textbook = libraryBookById(book);
  if (!textbook) notFound();
  return <TextbookDetail book={textbook} />;
}
