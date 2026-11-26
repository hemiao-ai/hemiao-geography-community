import { describe, expect, it } from "vitest";
import { CLIMATE_CITIES, classifyChina, DISASTERS, FARM_REGIONS, LANDFORMS, QUAKE_ACTIONS, RAIN_BELT_LABEL, RIVER_SPLITS, STEP_BOUNDS, stepOf } from "./china";
import { climateCities, elevationAt, flowOrder, LESSONS, profileSamples, rainTarget, safeSpot, landformTargets } from "./lessons";
import { frameOf, proj, toWorld } from "./mercator";
import { verifyLesson } from "./verify";

const wrap = (type: keyof typeof LESSONS, data: Record<string, unknown>, extra = {}) => ({ done: LESSONS[type].tasks, data, conclusion: LESSONS[type].conclusion, quiz: LESSONS[type].quiz.map(q => q.answer), mistakes: 0, ...extra });
const answers = <T extends Record<string, { answer: string }>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.answer]));

describe("八上中国地理", () => {
  it("墨卡托投影与天地图瓦片对齐", () => {
    expect(toWorld(-180, 0, 1)).toEqual([0, 256]);
    const f = frameOf([72, 3, 136, 54.5], 4);
    expect(proj(f, 72, 54.5).map(Math.round)).toEqual([0, 0]);
    expect(f.w).toBeGreaterThan(700);
  });
  it("气候类型判读", () => {
    const got = Object.fromEntries(Object.entries(CLIMATE_CITIES).map(([k, c]) => [k, classifyChina(c)]));
    expect(got).toEqual({ harbin: "温带季风气候", beijing: "温带季风气候", wuhan: "亚热带季风气候", haikou: "热带季风气候", urumqi: "温带大陆性气候", lhasa: "高原山地气候" });
  });
  it("剖面上的阶梯", () => {
    expect([86, 96, 102.5, 109, 115, 119].map(l => stepOf(elevationAt(l)))).toEqual([1, 1, 2, 2, 3, 3]);
    expect(LANDFORMS.sichuan.step).toBe(2);
  });
  it("雨带：6 月梅雨、7～8 月到华北", () => { expect(RAIN_BELT_LABEL(6)).toContain("梅雨"); expect(RAIN_BELT_LABEL(7)).toBe("华北、东北"); expect(RAIN_BELT_LABEL(1)).toBe("雨带不在大陆上空"); });

  for (const seed of [0, 1, 2, 7, 33]) {
    it(`验算 · 种子 ${seed}`, () => {
      const t3 = { bounds: { first: [...STEP_BOUNDS.first], second: [...STEP_BOUNDS.second] }, found: Object.fromEntries(landformTargets(seed).map(id => [id, [LANDFORMS[id].at[0] + 0.5, LANDFORMS[id].at[1] - 0.5]])), steps: Object.fromEntries(profileSamples(seed).map(l => [l, stepOf(elevationAt(l))])) };
      expect(verifyLesson("terrain3", seed, wrap("terrain3", t3)).stars).toBe(3);
      expect(() => verifyLesson("terrain3", seed, wrap("terrain3", { ...t3, bounds: { first: ["kunlun", "qinling"], second: [...STEP_BOUNDS.second] } }))).toThrow("分界线");
      const month = { 华南: 5, "长江中下游（梅雨）": 6, "华北、东北": 7 }[rainTarget(seed)];
      const mo = { winter: "西北风", summer: "东南风", month, types: Object.fromEntries(climateCities(seed).map(c => [c, classifyChina(CLIMATE_CITIES[c])])) };
      expect(verifyLesson("monsoon", seed, wrap("monsoon", mo)).stars).toBe(3);
      expect(() => verifyLesson("monsoon", seed, wrap("monsoon", { ...mo, month: 1 }))).toThrow("雨带");
      const rv = { changjiang: [...RIVER_SPLITS.changjiang], huanghe: [...RIVER_SPLITS.huanghe], huanghePos: flowOrder(seed).indexOf("huanghe") };
      expect(verifyLesson("river", seed, wrap("river", rv)).stars).toBe(3);
      expect(() => verifyLesson("river", seed, wrap("river", { ...rv, changjiang: ["wuhan", "hukou"] }))).toThrow("长江");
      const fm = { assign: answers(FARM_REGIONS), north: "旱地", south: "水田" };
      expect(verifyLesson("farm", seed, wrap("farm", fm)).stars).toBe(3);
      expect(() => verifyLesson("farm", seed, wrap("farm", { ...fm, south: "旱地" }))).toThrow();
      expect(safeSpot(seed)).toBe("peak");
      const ds = { regions: answers(DISASTERS), quake: Object.keys(QUAKE_ACTIONS).filter(k => QUAKE_ACTIONS[k][1]), spot: "peak" };
      expect(verifyLesson("disaster", seed, wrap("disaster", ds)).stars).toBe(3);
      expect(() => verifyLesson("disaster", seed, wrap("disaster", { ...ds, quake: ["elevator"] }))).toThrow("地震");
      expect(() => verifyLesson("disaster", seed, wrap("disaster", { ...ds, spot: "valley" }))).toThrow("洪水");
    });
  }
});
