/** 竞技场对局：固定题数，答错可再试一次、连击加分，按得分评级。本机与服务端共用。 */
import { ROUND, allowsRetry, checkLatlon, latlonQuestion, type LatlonInput, type LatlonQuestion } from "./latlon";

export const ARENA_VERSION = "geo-arena-2026-11-24.2";
export type Judge = "perfect" | "great";
export type Grade = "SSS" | "SS" | "S" | "A" | "B" | "C";
export const JUDGE_BASE: Record<Judge, number> = { perfect: 100, great: 70 };
export const COMBO_TIERS: ReadonlyArray<readonly [number, number]> = [[3, 1.1], [5, 1.2], [7, 1.3], [10, 1.5], [15, 1.8], [20, 2]];
export function comboMultiplier(combo: number) { let m = 1; for (const [t, x] of COMBO_TIERS) if (combo >= t) m = x; return m; }

export interface PlayState { seed: number; index: number; tries: number; questionStart: number; combo: number; maxCombo: number; score: number; correct: number; perfect: number; misses: number; skipped: number; done: boolean }
export type PlayEvent =
  | { type: "correct"; judge: Judge; combo: number; gained: number; tierUp: boolean; done: boolean }
  | { type: "wrong"; retry: boolean; brokeCombo: boolean; question: LatlonQuestion; done: boolean };

export const createPlay = (seed: number): PlayState => ({ seed, index: 0, tries: 0, questionStart: 0, combo: 0, maxCombo: 0, score: 0, correct: 0, perfect: 0, misses: 0, skipped: 0, done: false });
export const currentQuestion = (s: PlayState) => latlonQuestion(s.seed, s.index);

/** 提交当前题。at 为开局到提交的毫秒数。首次作答且在目标用时内答对为 Perfect，否则为 Great。 */
export function submit(state: PlayState, input: LatlonInput, at: number): { state: PlayState; event: PlayEvent } {
  if (state.done) throw new Error("对局已结束");
  const q = currentQuestion(state);
  if (checkLatlon(q, input)) {
    const judge: Judge = state.tries === 0 && at - state.questionStart <= q.targetMs ? "perfect" : "great";
    const combo = state.combo + 1, gained = Math.round(q.points * (JUDGE_BASE[judge] / 100) * comboMultiplier(combo)), index = state.index + 1;
    const next = { ...state, index, tries: 0, questionStart: at, combo, maxCombo: Math.max(state.maxCombo, combo), score: state.score + gained, correct: state.correct + 1, perfect: state.perfect + (judge === "perfect" ? 1 : 0), done: index >= ROUND };
    return { state: next, event: { type: "correct", judge, combo, gained, tierUp: COMBO_TIERS.some(([t]) => t === combo), done: next.done } };
  }
  const retry = state.tries === 0 && allowsRetry(q), index = retry ? state.index : state.index + 1;
  const next = { ...state, index, tries: retry ? 1 : 0, questionStart: retry ? state.questionStart : at, combo: 0, misses: state.misses + 1, skipped: state.skipped + (retry ? 0 : 1), done: index >= ROUND };
  return { state: next, event: { type: "wrong", retry, brokeCombo: state.combo >= 3, question: q, done: next.done } };
}

/** 满分：每题都在首次作答、目标用时内答对时的得分 */
export function maxScore() {
  let total = 0;
  for (let i = 0; i < ROUND; i++) total += Math.round(latlonQuestion(0, i).points * comboMultiplier(i + 1));
  return total;
}
export function gradeFor(score: number): Grade {
  const r = score / maxScore();
  return r >= 0.95 ? "SSS" : r >= 0.85 ? "SS" : r >= 0.75 ? "S" : r >= 0.6 ? "A" : r >= 0.4 ? "B" : "C";
}

export interface RunResult { score: number; grade: Grade; correct: number; perfect: number; misses: number; total: number; accuracy: number; maxCombo: number; elapsedMs: number }
export function finish(s: PlayState, elapsedMs: number): RunResult {
  const submits = s.correct + s.misses;
  return { score: s.score, grade: gradeFor(s.score), correct: s.correct, perfect: s.perfect, misses: s.misses, total: ROUND, accuracy: submits ? s.correct / submits : 0, maxCombo: s.maxCombo, elapsedMs: Math.round(elapsedMs) };
}

export interface Submission { input: LatlonInput; at: number }
/** 按种子重放全部提交；时间倒流或超出题数的提交视为无效。 */
export function replay(seed: number, submissions: Submission[]): RunResult | null {
  let s = createPlay(seed), last = 0;
  for (const { input, at } of submissions) {
    if (s.done || !(at >= last)) return null;
    s = submit(s, input, at).state; last = at;
  }
  return s.done ? finish(s, last) : null;
}
