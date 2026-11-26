import { BOOKS, pointKey, type Book, type Point } from "../data/catalog";
import { LESSON_PLANS, type LessonPlan } from "../data/lessons";
import type { LessonType } from "./lessons";
import type { Learning, Progress } from "./progress";

export type PointStatus = "done" | "open" | "project" | "soon";
export function pointStatus(book: Book, point: Point, progress: Progress): PointStatus {
  const key = pointKey(book.id, point.id);
  if (LESSON_PLANS[key]) return progress[key] ? "done" : "open";
  return point.kind === "project" ? "project" : "soon";
}
export function bookStats(book: Book, progress: Progress) {
  const points = book.chapters.flatMap(c => c.points), open = points.filter(p => LESSON_PLANS[pointKey(book.id, p.id)]), done = open.filter(p => progress[pointKey(book.id, p.id)]);
  return { total: points.length, chapters: book.chapters.length, open: open.length, done: done.length, projects: points.filter(p => p.kind === "project").length };
}
export function openLessons() {
  return Object.entries(LESSON_PLANS).map(([key, plan]) => {
    const [bookId, pointId] = key.split("/"), book = BOOKS.find(b => b.id === bookId)!, chapter = book.chapters.find(c => c.points.some(p => p.id === pointId))!;
    return { key, plan, book, chapter, point: chapter.points.find(p => p.id === pointId)! };
  });
}

export function learnerOverview({ progress, started }: Pick<Learning, "progress" | "started">) {
  const completed = [];
  const pending = [];
  for (const lesson of openLessons()) {
    const result = progress[lesson.key];
    if (result) completed.push({ ...lesson, result });
    else if (started[lesson.key]) pending.push({ ...lesson, startedAt: started[lesson.key] });
  }
  completed.sort((left, right) => (right.result.completedAt ?? "").localeCompare(left.result.completedAt ?? ""));
  pending.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  return { completed, pending, stars: completed.reduce((sum, lesson) => sum + lesson.result.stars, 0) };
}

/** 首页课程：取最近有学习活动的册，没有记录时取第一本已开放探究的册。 */
export function homeCourse({ progress, started }: Pick<Learning, "progress" | "started">, available: (type: LessonType) => boolean = () => true) {
  const playable = (plan: LessonPlan | undefined) => !!plan && available(plan.type);
  const activity = (key: string) => progress[key]?.completedAt ?? started[key] ?? "";
  const recent = openLessons().filter(lesson => playable(lesson.plan)).reduce<ReturnType<typeof openLessons>[number] | null>((best, lesson) =>
    activity(lesson.key) > (best ? activity(best.key) : "") ? lesson : best, null);
  const book = recent?.book ?? BOOKS.find(b => b.chapters.some(c => c.points.some(p => playable(LESSON_PLANS[pointKey(b.id, p.id)])))) ?? BOOKS[0];
  const chapters = book.chapters.map(chapter => {
    const lessons = chapter.points.filter(point => playable(LESSON_PLANS[pointKey(book.id, point.id)]))
      .map(point => ({ key: pointKey(book.id, point.id), plan: LESSON_PLANS[pointKey(book.id, point.id)], book, chapter, point }));
    return { chapter, lessons, done: lessons.filter(lesson => progress[lesson.key]).length };
  }).filter(item => item.lessons.length);
  const lessons = chapters.flatMap(item => item.lessons);
  const pending = lessons.filter(lesson => !progress[lesson.key] && started[lesson.key])
    .sort((left, right) => started[right.key].localeCompare(started[left.key]));
  const latest = lessons.filter(lesson => progress[lesson.key])
    .sort((left, right) => progress[right.key].completedAt.localeCompare(progress[left.key].completedAt))[0] ?? null;
  return {
    book, chapters, stats: { ...bookStats(book, progress), open: lessons.length, done: lessons.filter(lesson => progress[lesson.key]).length }, latest,
    next: pending[0] ?? lessons.find(lesson => !progress[lesson.key]) ?? null, resuming: pending.length > 0,
    stars: lessons.reduce((sum, lesson) => sum + (progress[lesson.key]?.stars ?? 0), 0),
  };
}
