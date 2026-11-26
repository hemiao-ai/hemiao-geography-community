import { describe, expect, it } from "vitest";
import { G7A_LESSONS, FORMS, hemiPoints, labelAnswer, LINES, pairsAnswer, planeSpeed, SCENES, SEAFLOOR, timelineAnswer, treasureCities, worldTargets, type G7aType } from "./lessons-g7a";
import { CITIES, HIERARCHY, PLANETS, WORLD_FORMS, hemisphereOf, zoneDistance } from "./world";
import { bridgeLine, roadLine, settlementRiver, siteBest, sitePoints, siteRating } from "./settlement";
import { featurePoint, heightAt, makeTerrain, type Pt } from "./terrain";
import { verifyLesson } from "./verify";
import { project, unproject } from "../components/geo/Globe";

function answers(type: G7aType, seed: number): Record<string, unknown> {
  switch (type) {
    case "cosmos": return { hierarchy: Object.keys(HIERARCHY), planets: Object.keys(PLANETS), habitable: ["near", "mass", "water"], timeline: timelineAnswer(seed) };
    case "globe": return { hours: 40000 / planeSpeed(seed), lines: pairsAnswer(LINES), hemi: Object.fromEntries(hemiPoints(seed).map((p, i) => [i, hemisphereOf(p)])), found: Object.fromEntries(treasureCities(seed).map(k => [k, CITIES[k].at])) };
    case "landform": return { forms: labelAnswer(Object.keys(FORMS), seed + 101), found: Object.fromEntries(worldTargets(seed).map(k => [k, WORLD_FORMS[k].zone[0]])), seafloor: labelAnswer(Object.keys(SEAFLOOR), seed + 131) };
    case "settlement": return { scene: pairsAnswer(SCENES), site: siteBest(seed), stages: ["village", "town", "city"] };
  }
}
describe("七上课程验算", () => {
  const errors: Record<G7aType, Record<string, string>> = {
    cosmos: { hierarchy: "天体层级顺序不正确", planets: "八大行星顺序不正确", habitable: "宜居条件选择不正确", timeline: "太空探索时间顺序不正确" },
    globe: { hours: "飞行时间不正确", lines: "经纬线分类不正确", hemi: "半球判断不正确", found: "寻宝位置不正确" },
    landform: { forms: "基本地形分类不正确", found: "地形区位置不正确", seafloor: "海底地形分类不正确" },
    settlement: { scene: "城乡景观分类不正确", site: "选址不符合条件", stages: "城镇发展顺序不正确" },
  };
  for (const type of Object.keys(G7A_LESSONS) as G7aType[]) {
    it(`${type} 对 100 个种子重放并拒绝错误数据`, () => {
      const spec = G7A_LESSONS[type];
      for (let seed = 0; seed < 100; seed++) {
        const data = answers(type, seed);
        expect(spec.check(seed, data), `${type} seed ${seed}`).toBeNull();
        for (const key of Object.keys(data)) expect(spec.check(seed, { ...data, [key]: null }), `${type} ${key} seed ${seed}`).toBe(errors[type][key]);
      }
      const specData = answers(type, 42);
      expect(verifyLesson(type, 42, { done: spec.tasks, data: specData, conclusion: spec.conclusion, quiz: spec.quiz.map(q => q.answer), mistakes: 0 }).stars).toBe(3);
    });
  }
});
describe("村落选址", () => {
  it("72 种地形均恰有一个合适地点，各反例体现特定风险", () => {
    const distance = (p: Pt, line: Pt[]) => Math.min(...line.slice(1).map((b, i) => {
      const a = line[i], dx = b[0] - a[0], dy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
    }));
    for (let seed = 0; seed < 72; seed++) {
      const t = makeTerrain(seed), points = sitePoints(t);
      const river = settlementRiver(t), road = roadLine(t), bridge = bridgeLine(t);
      const r = Object.fromEntries(Object.entries(points).map(([k, p]) => [k, siteRating(t, p)]));
      expect(Object.keys(r).filter(k => Object.values(r[k]).every(Boolean)), `seed ${seed}`).toEqual(["good"]);
      expect(siteBest(seed)).toBe("good");
      expect(r.flood.safe).toBe(false);
      expect(r.ridge.flat).toBe(false);
      expect(r.ridge.water).toBe(false);
      expect(r.far.flat).toBe(true);
      expect(r.far.water).toBe(false);
      expect(r.far.road).toBe(false);
      expect(Math.hypot(points.ridge[0] - featurePoint(t, "ridge")[0], points.ridge[1] - featurePoint(t, "ridge")[1])).toBeLessThan(0.025);
      expect(distance(points.good, river)).toBeGreaterThanOrEqual(0.04);
      expect(distance(points.good, river)).toBeLessThanOrEqual(0.07);
      expect(distance(points.good, road)).toBeLessThan(0.05);
      expect(r.good.safe).toBe(true);
      expect(river.slice(1).every((p, i) => heightAt(t, p) < heightAt(t, river[i]))).toBe(true);
      const middle: Pt = [(bridge[0][0] + bridge[1][0]) / 2, (bridge[0][1] + bridge[1][1]) / 2];
      expect(distance(middle, river)).toBeLessThan(0.004);
      expect(distance(middle, road)).toBeLessThan(0.004);
    }
  });
});
describe("世界坐标", () => {
  it("东西半球界线和南北半球", () => {
    expect(hemisphereOf([-20, 1])).toBe("E-N"); expect(hemisphereOf([160, -1])).toBe("W-S");
    expect(hemisphereOf([-20.01, 1])).toBe("W-N"); expect(hemisphereOf([159.99, -1])).toBe("E-S");
  });
  it("点到折线的距离按纬度缩放，并包括端点", () => {
    expect(zoneDistance([5, 1], [[0, 0], [10, 0]])).toBeCloseTo(1, 4);
    expect(zoneDistance([11, 0], [[0, 0], [10, 0]])).toBeCloseTo(1, 4);
    expect(zoneDistance([1, 60], [[0, 59], [0, 61]])).toBeCloseTo(0.5, 3);
    expect(zoneDistance([1, 60], [[0, 60]])).toBeCloseTo(0.5, 3);
  });
});
describe("正射投影", () => {
  it("可见点与逆投影往返，圆外返回 null", () => {
    for (const view of [{ lon0: 100, lat0: 20 }, { lon0: -170, lat0: -50 }, { lon0: 0, lat0: 0 }]) {
      for (let lat = -80; lat <= 80; lat += 10) for (let lon = -180; lon < 180; lon += 10) {
        const p = project(lat, lon, view, 184); if (!p.vis || Math.hypot(p.x, p.y) > 183.99) continue;
        const q = unproject(p.x, p.y, view, 184)!;
        expect(Math.abs(q.lat - lat)).toBeLessThan(0.01);
        expect(Math.abs(((q.lon - lon + 540) % 360) - 180)).toBeLessThan(0.01);
      }
    }
    expect(unproject(185, 0, { lon0: 0, lat0: 0 }, 184)).toBeNull();
  });
});
