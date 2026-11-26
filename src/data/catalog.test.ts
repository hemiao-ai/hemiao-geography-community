import { describe, expect, it } from "vitest";
import { BOOKS, findPoint } from "./catalog";
import { LESSON_PLANS } from "./lessons";

describe("地理教材目录", () => {
  it("四册、知识点 ID 唯一", () => {
    expect(BOOKS.map(b => b.id)).toEqual(["rj-g7a", "rj-g7b", "rj-g8a", "rj-g8b"]);
    for (const b of BOOKS) { const ids = b.chapters.flatMap(c => c.points.map(p => p.id)); expect(new Set(ids).size).toBe(ids.length); }
  });
  it("已开放的知识点都在目录里，且标题对得上", () => {
    for (const [key, plan] of Object.entries(LESSON_PLANS)) { const [b, p] = key.split("/"); expect(findPoint(b, p)?.point.title).toBe(plan.title); }
  });
  it("跨学科主题学习标为项目课", () => {
    expect(findPoint("rj-g7a", "c2s4")?.point).toMatchObject({ title: "美化校园", kind: "project" });
  });
});
