import { describe, expect, it } from "vitest";
import { ROUND, STAGES, allowsRetry, bandLabel, checkLatlon, coordLabel, directionOf, hemisphereLabel, latlonQuestion, polarXY, stageAt, wrapLon, type LatlonQuestion } from "./latlon";
import { createPlay, gradeFor, maxScore, replay, submit } from "./play";
import { verifyArenaRun } from "./leaderboard";

const right = (q: LatlonQuestion) => q.answer;
const wrong = (q: LatlonQuestion) => (q.click ? [wrapLon(q.answer[0] + 20), q.answer[1]] as [number, number] : q.choices.find(c => c !== q.answer)!);
const all = Array.from({ length: 200 }, (_, s) => Array.from({ length: ROUND }, (_, i) => latlonQuestion(s + 1, i))).flat();

describe("经纬度定位出题", () => {
  it("同一种子出同样的题；15 题分三段，每段题型轮换不重复", () => {
    expect(latlonQuestion(42, 7)).toEqual(latlonQuestion(42, 7));
    expect([0, 4, 5, 9, 10, 14].map(stageAt)).toEqual([0, 0, 1, 1, 2, 2]);
    for (let seed = 1; seed <= 50; seed++) for (const st of STAGES) {
      const types = Array.from({ length: st.types.length }, (_, k) => latlonQuestion(seed, st.from + k).type);
      expect(new Set(types).size).toBe(st.types.length);
    }
  });
  it("覆盖全部 11 种题型", () => {
    expect(new Set(all.map(q => q.type)).size).toBe(11);
  });
  it("选择题选项互不相同，答案唯一且与规则一致", () => {
    for (const q of all) {
      if (q.click) continue;
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices).toContain(q.answer);
      const [a, b] = q.pins.map(p => p.at);
      if (q.type === "pick" || q.type === "plain" || (q.type === "polar" && q.prompt.includes("经纬度"))) expect(q.answer).toBe(coordLabel(a));
      if (q.type === "hemi" || (q.type === "polar" && q.prompt.endsWith("位于"))) { expect(q.answer).toBe(hemisphereLabel(a)); expect(a[1]).not.toBe(0); }
      if (q.type === "band") { expect(q.answer).toBe(bandLabel(a[1])); expect([30, 60]).not.toContain(Math.abs(a[1])); }
      if (q.type === "multi") {
        const fit = q.pins.filter(p => (q.prompt.includes("半球") ? q.prompt.includes(hemisphereLabel(p.at)) : q.prompt.includes(bandLabel(p.at[1]))));
        expect(fit.map(p => p.label)).toEqual([q.answer]);
      }
      if (q.type === "direction" || q.type === "polarDir") { expect(q.choices).toContain(q.answer); expect(a).not.toEqual(b); }
    }
  });
  it("点击题的目标在窗口内部，容差内算对", () => {
    for (const q of all) {
      if (!q.click) continue;
      const { lon0, lat0, step, cols, rows } = q.view, dx = ((q.answer[0] - lon0) % 360 + 360) % 360;
      expect(dx).toBeGreaterThan(0); expect(dx).toBeLessThan(step * cols);
      expect(q.answer[1]).toBeGreaterThan(lat0); expect(q.answer[1]).toBeLessThan(lat0 + step * rows);
      expect(checkLatlon(q, [q.answer[0] + 2, q.answer[1] - 2])).toBe(true);
      expect(checkLatlon(q, [q.answer[0] + 4, q.answer[1]])).toBe(false);
    }
  });
  it("坐标、半球、方向的规则", () => {
    expect(coordLabel([120, 30])).toBe("30°N，120°E");
    expect(coordLabel([-180, 0])).toBe("0°，180°");
    expect(hemisphereLabel([-10, 40])).toBe("东半球、北半球");
    expect(hemisphereLabel([170, -20])).toBe("西半球、南半球");
    expect([bandLabel(29), bandLabel(-45), bandLabel(75)]).toEqual(["低纬度", "中纬度", "高纬度"]);
    expect(directionOf([100, 30], [110, 40])).toBe("北东");
    expect(directionOf([170, 0], [-170, 0])).toBe("东");
    expect(directionOf([0, -60], [0, -75])).toBe("南");
  });
  it("极地俯视：北极上空东经逆时针，南极上空东经顺时针", () => {
    expect(polarXY(0, 60, "N", 0, 90).map(Math.round)).toEqual([0, 30]);
    expect(polarXY(90, 60, "N", 0, 90).map(Math.round)).toEqual([30, 0]);
    expect(Math.round(polarXY(90, -60, "S", 0, 90)[0])).toBe(-30);
  });
  it("两个选项的题答错不给第二次机会", () => {
    const fact = all.find(q => q.type === "fact")!, pick = all.find(q => q.type === "pick")!;
    expect([allowsRetry(fact), allowsRetry(pick)]).toEqual([false, true]);
  });
});

describe("闯关与重放", () => {
  it("答错可再试一次，两次答错才跳题；Perfect 看首次作答用时", () => {
    let seed = 1; while (!allowsRetry(latlonQuestion(seed, 1))) seed++;
    let s = createPlay(seed);
    s = submit(s, right(latlonQuestion(seed, 0)), 1000).state;
    expect([s.index, s.combo, s.score, s.perfect]).toEqual([1, 1, 100, 1]);
    let r = submit(s, wrong(latlonQuestion(seed, 1)), 2000);
    expect([r.state.index, r.event.type === "wrong" && r.event.retry]).toEqual([1, true]);
    r = submit(r.state, right(latlonQuestion(seed, 1)), 2500);
    expect(r.event.type === "correct" && r.event.judge).toBe("great");
  });
  it("全对且都在目标用时内为 SSS；重放与逐题提交一致", () => {
    const subs = Array.from({ length: ROUND }, (_, i) => ({ input: right(latlonQuestion(9, i)), at: (i + 1) * 2000 }));
    const result = replay(9, subs)!;
    expect(result).toMatchObject({ correct: ROUND, perfect: ROUND, accuracy: 1, maxCombo: ROUND, grade: "SSS", elapsedMs: 30000 });
    expect(result.score).toBe(maxScore());
    expect(replay(9, subs.slice(0, 5))).toBeNull();
    expect(replay(9, [...subs.slice(0, 3), { ...subs[3], at: 10 }])).toBeNull();
    expect(gradeFor(0)).toBe("C");
  });
});

describe("房间成绩核验", () => {
  it("按服务端种子重放，拒绝无效坐标与超时或倒序记录", () => {
    const seed = 9;
    const evidence = Array.from({ length: ROUND }, (_, index) => ({ input: right(latlonQuestion(seed, index)), at: (index + 1) * 1000 }));
    expect(verifyArenaRun(seed, evidence, 20_000)?.score).toBe(maxScore());
    expect(verifyArenaRun(seed, evidence, 10_000)).toBeNull();
    expect(verifyArenaRun(seed, evidence.slice().reverse(), 20_000)).toBeNull();
    expect(verifyArenaRun(seed, [{ input: [0, 91], at: 1000 }, ...evidence.slice(1)], 20_000)).toBeNull();
    expect(verifyArenaRun(seed, evidence.slice(1), 20_000)).toBeNull();
  });
});
