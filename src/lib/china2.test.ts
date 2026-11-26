import { describe, expect, it } from "vitest";
import { CARGO, ENV_MEASURES, ETHNIC, EXTREMES, FESTIVALS, INDUSTRY_BASES, INDUSTRY_SITES, LAND_REGIONS, LOW_CARBON, MINES, PROVINCES, RAIL_LINES, SAVE_WATER, SEA_RESOURCES, SEAS, TRANSFER_ROUTES } from "./china2";
import { LESSONS, provinceSet, type LessonType } from "./lessons";
import { verifyLesson } from "./verify";

const wrap = (type: LessonType, data: Record<string, unknown>) => ({ done: LESSONS[type].tasks, data, conclusion: LESSONS[type].conclusion, quiz: LESSONS[type].quiz.map(q => q.answer), mistakes: 0 });
const ans = (o: Record<string, { answer: string }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.answer]));
const sec = (o: Record<string, readonly [string, ...unknown[]]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1] as string]));
const at = (o: Record<string, { at: [number, number] }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [v.at[0] + 0.6, v.at[1] - 0.6]]));
const ids = (o: Record<string, unknown>) => Object.fromEntries(Object.keys(o).map(k => [k, k]));
const ok = (o: Record<string, readonly [string, boolean]>) => Object.keys(o).filter(k => o[k][1]);

describe("八上其余 10 节验算", () => {
  for (const seed of [0, 4, 19]) {
    const good: Record<string, Record<string, unknown>> = {
      territory: { extremes: at(EXTREMES), abbr: Object.fromEntries(provinceSet(seed).map(i => [i, PROVINCES[i][1]])), neighbors: "14-6" },
      population: { pop2020: 14.1, dense: "east", pyramid: "y2020" },
      ethnic: { map: ans(ETHNIC), fest: FESTIVALS },
      land: { largest: "林地", regions: ans(LAND_REGIONS) },
      water: { routes: ids(TRANSFER_ROUTES), save: ok(SAVE_WATER), space: "南多北少" },
      mineral: { mines: ans(MINES), pipe: "西气东输" },
      ocean: { seas: at(SEAS), res: ans(SEA_RESOURCES) },
      industry: { bases: at(INDUSTRY_BASES), sites: sec(INDUSTRY_SITES) },
      transport: { cargo: sec(CARGO), lines: ids(RAIL_LINES), hub: "郑州" },
      environment: { measures: sec(ENV_MEASURES), carbon: ok(LOW_CARBON), target: "2030-2060" },
    };
    for (const [type, data] of Object.entries(good)) it(`${type} · 种子 ${seed}`, () => {
      expect(verifyLesson(type as LessonType, seed, wrap(type as LessonType, data)).stars).toBe(3);
      expect(() => verifyLesson(type as LessonType, seed, wrap(type as LessonType, {}))).toThrow();
    });
  }
  it("四至点击太远会被拒绝", () => {
    const far = { ...at(EXTREMES), south: [112.3, 15] };
    expect(() => verifyLesson("territory", 0, wrap("territory", { extremes: far, abbr: Object.fromEntries(provinceSet(0).map(i => [i, PROVINCES[i][1]])), neighbors: "14-6" }))).toThrow("四至");
  });
});
