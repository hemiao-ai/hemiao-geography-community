import { describe, expect, it } from "vitest";
import { homeCourse, learnerOverview, openLessons } from "./course-view";
import type { LabResult } from "./verify";

describe("学员首页进度", () => {
  it("没有个人记录时，不返回课程推荐或全量课表", () => {
    expect(learnerOverview({ progress: {}, started: {} })).toEqual({ completed: [], pending: [], stars: 0 });
  });

  it("只统计有学习记录的课程，按最近活动排序且不会重复统计", () => {
    const [earlier, recent, started, resumed] = openLessons();
    const result = (stars: LabResult["stars"], day: string): LabResult => ({
      stars, completedAt: `2026-11-${day}T00:00:00Z`, mistakes: 0, version: "test",
    });
    const overview = learnerOverview({
      progress: { [earlier.key]: result(2, "21"), [recent.key]: result(3, "23"), "unknown/point": result(3, "23") },
      started: { [recent.key]: "2026-11-22", [started.key]: "2026-11-22", [resumed.key]: "2026-11-23", "unknown/point": "2026-11-23" },
    });
    expect(overview.completed.map(lesson => lesson.key)).toEqual([recent.key, earlier.key]);
    expect(overview.pending.map(lesson => lesson.key)).toEqual([resumed.key, started.key]);
    expect(overview.stars).toBe(5);
  });
});

describe("首页课程", () => {
  it("没有记录时取第一本已开放的册，推荐第一节", () => {
    const course = homeCourse({ progress: {}, started: {} });
    expect(course.book.id).toBe(openLessons()[0].book.id);
    expect(course.next?.key).toBe(course.chapters[0].lessons[0].key);
    expect(course.resuming).toBe(false);
  });

  it("取最近活动的册，优先继续未完成的一节", () => {
    const lessons = openLessons().filter(lesson => lesson.book.id === "rj-g8a");
    const done: LabResult = { stars: 2, completedAt: "2026-11-22T00:00:00Z", mistakes: 1, version: "test" };
    const course = homeCourse({ progress: { [lessons[0].key]: done }, started: { [lessons[2].key]: "2026-11-23T00:00:00Z" } });
    expect(course.book.id).toBe("rj-g8a");
    expect(course.next?.key).toBe(lessons[2].key);
    expect(course.resuming).toBe(true);
    expect(course.stats.done).toBe(1);
    expect(course.stars).toBe(2);
    expect(course.chapters.reduce((sum, item) => sum + item.lessons.length, 0)).toBe(lessons.length);
  });
});
