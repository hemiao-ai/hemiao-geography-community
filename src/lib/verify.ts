/** 验算：只根据种子和学生的操作记录重算，不相信客户端给出的结论或星级 */
import { LESSONS, type LessonType } from "./lessons";

export const LAB_VERSION = "2026-11-21.1";
export class EvidenceError extends Error {}
export interface LabResult { stars: 1 | 2 | 3; mistakes: number; version: string; completedAt: string }
const fail = (m: string): never => { throw new EvidenceError(m); };

export function verifyLesson(type: LessonType, seed: number, raw: unknown): LabResult {
  const e = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : fail("证据格式无效"), spec = LESSONS[type];
  if (e.done !== spec.tasks) fail("还有探究任务没有完成");
  const bad = spec.check(seed, e.data && typeof e.data === "object" ? e.data as Record<string, unknown> : {});
  if (bad) fail(bad);
  const c = e.conclusion, q = e.quiz;
  if (!Array.isArray(c) || c.length !== spec.conclusion.length || c.some((a, i) => a !== spec.conclusion[i])) fail("结论不正确");
  if (!Array.isArray(q) || q.length !== spec.quiz.length || spec.quiz.some((x, i) => q[i] !== x.answer)) fail("巩固题答案不正确");
  const m = typeof e.mistakes === "number" && Number.isInteger(e.mistakes) && e.mistakes >= 0 && e.mistakes <= 200 ? e.mistakes : fail("证据格式无效");
  return { stars: m === 0 ? 3 : m <= 2 ? 2 : 1, mistakes: m, version: LAB_VERSION, completedAt: new Date().toISOString() };
}
