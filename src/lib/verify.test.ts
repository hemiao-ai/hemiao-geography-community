import { describe, expect, it } from "vitest";
import { CITIES, dayLength, longerDay, SOLAR_TERMS } from "./astro";
import { earthTerm, LESSONS, summerIndex } from "./lessons";
import { FEATURES, featurePoint, gentlestRoute, makeTerrain, profileOptions, type Feature } from "./terrain";
import { verifyLesson } from "./verify";

const wrap = (type: "earth" | "contour", data: Record<string, unknown>, extra = {}) => ({ done: LESSONS[type].tasks, data, conclusion: LESSONS[type].conclusion, quiz: LESSONS[type].quiz.map(q => q.answer), mistakes: 0, ...extra });

describe("验算", () => {
  for (const seed of [0, 1, 2, 3, 9, 46]) {
    it(`地球的运动 · 种子 ${seed}`, () => {
      const day = SOLAR_TERMS[earthTerm(seed)].day, bj = dayLength(CITIES.beijing.lat, day), sy = dayLength(CITIES.sydney.lat, day);
      const data = { day: day + 1, longer: longerDay(bj, sy), bjHours: Math.round(bj * 2) / 2, utc: 4.2, summerPos: summerIndex(seed) };
      expect(verifyLesson("earth", seed, wrap("earth", data)).stars).toBe(3);
      expect(() => verifyLesson("earth", seed, wrap("earth", { ...data, day: day + 40 }))).toThrow("日期");
      expect(() => verifyLesson("earth", seed, wrap("earth", { ...data, utc: 12 }))).toThrow("正午");
      expect(() => verifyLesson("earth", seed, wrap("earth", { ...data, summerPos: (summerIndex(seed) + 1) % 4 }))).toThrow("公转");
      expect(() => verifyLesson("earth", seed, wrap("earth", data, { quiz: [] }))).toThrow("巩固题");
    });
    it(`地形图的判读 · 种子 ${seed}`, () => {
      const t = makeTerrain(seed), marks = Object.fromEntries((Object.keys(FEATURES) as Feature[]).map(f => [f, featurePoint(t, f)]));
      const data = { marks, profile: profileOptions(seed).indexOf(0), river: "valley", route: gentlestRoute(t) };
      expect(verifyLesson("contour", seed, wrap("contour", data, { mistakes: 2 })).stars).toBe(2);
      expect(() => verifyLesson("contour", seed, wrap("contour", { ...data, marks: { ...marks, saddle: marks.peak } }))).toThrow("鞍部");
      expect(() => verifyLesson("contour", seed, wrap("contour", { ...data, route: "cliff" }))).toThrow("路线");
      expect(() => verifyLesson("contour", seed, wrap("contour", data, { done: 2 }))).toThrow("任务");
    });
  }
});
