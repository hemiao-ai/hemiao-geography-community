import Link from "next/link";
import type { ReactNode } from "react";

export function CourseCard({ href, cover, subtitle, title, chapters, aside, titleLevel = "h3" }: {
  href: string;
  cover: ReactNode;
  subtitle: string;
  title: string;
  chapters?: readonly ReactNode[];
  aside: ReactNode;
  titleLevel?: "h3" | "h4";
}) {
  const Title = titleLevel;
  return <Link href={href} prefetch={false}
    className="panel group grid grid-cols-[76px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 p-4 transition hover:-translate-y-0.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-x-5 sm:p-5 lg:grid-cols-[110px_minmax(0,1fr)_155px]">
    {cover}
    <div className="min-w-0">
      <div className="label">{subtitle}</div>
      <Title className="h-display mt-1 text-lg sm:text-xl">{title}</Title>
      {chapters && chapters.length > 0 && <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm leading-6 text-muted md:grid-cols-2">
        {chapters.map((chapter, index) => <li key={index}>{chapter}</li>)}
      </ol>}
    </div>
    <div className="col-start-2 min-w-0 lg:col-start-auto">{aside}</div>
  </Link>;
}
