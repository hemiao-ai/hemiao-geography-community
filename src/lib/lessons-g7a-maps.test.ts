import { describe, expect, it } from "vitest";
import { BELTS, bearing, CONTINENTS, nearestRegion, OCEANS, STRAITS, SYMBOL_NAMES, TOWN_PAIRS, TOWNS } from "./world-maps";
import { answersOfPairs, beltTargets, CHANGES, choiceTargets, directionsAnswer, FOSSIL_ANSWER, G7A_MAP_LESSONS, legendTargets, MAP_CHOICES, PLATE_CASES, scaleRule, SCALE_ORDER, straitTargets, trafficColor, trafficSpeeds, type G7aMapsType } from "./lessons-g7a-maps";
import { verifyLesson } from "./verify";

function answers(type: G7aMapsType, seed: number): Record<string, unknown> {
  switch (type) {
    case "mapread": { const s = scaleRule(seed); return { dirs: directionsAnswer(seed), scale: { dist: s.dist, perCm: s.perCm }, legend: Object.fromEntries(legendTargets(seed).map(k => [k, SYMBOL_NAMES[k]])) }; }
    case "mapchoose": return { scaleOrder: SCALE_ORDER, detail: "center", choose: Object.fromEntries(choiceTargets(seed).map(k => [k, MAP_CHOICES[k][1]])), traffic: Object.fromEntries(trafficSpeeds(seed).map((v, i) => [i, trafficColor(v)])) };
    case "continents": return { ocean: 71, cont: Object.fromEntries(Object.entries(CONTINENTS).map(([k, v]) => [k, v.points[0]])), ocean4: Object.fromEntries(Object.entries(OCEANS).map(([k, v]) => [k, v.points[0]])), straits: Object.fromEntries(straitTargets(seed).map(k => [k, { name: STRAITS[k].name, role: STRAITS[k].role }])) };
    case "plates": return { change: answersOfPairs(CHANGES), fit: [0, 0], fossil: FOSSIL_ANSWER, plates: Object.fromEntries(Object.entries(PLATE_CASES).map(([k, v]) => [k, { move: v.move, pair: v.pair }])), belts: Object.fromEntries(beltTargets(seed).map(k => [k, BELTS[k].belt])) };
  }
}
describe("七上地图与海陆验算", () => {
  const errors: Record<G7aMapsType, Record<string, string>> = {
    mapread: { dirs: "地图方向判断不正确", scale: "比例尺距离计算不正确", legend: "地图图例识别不正确" },
    mapchoose: { scaleOrder: "比例尺顺序不正确", detail: "地图详略判断不正确", choose: "地图选择不正确", traffic: "实时路况颜色不正确" },
    continents: { ocean: "海陆比例不正确", cont: "大洲位置不正确", ocean4: "大洋位置不正确", straits: "海峡和运河判断不正确" },
    plates: { change: "海陆变迁原因分类不正确", fit: "大陆拼合位置不正确", fossil: "化石证据解释不正确", plates: "板块运动判断不正确", belts: "火山地震带分类不正确" },
  };
  for (const type of Object.keys(G7A_MAP_LESSONS) as G7aMapsType[]) it(`${type} 的 100 个种子及各子项`, () => {
    const spec = G7A_MAP_LESSONS[type];
    for (let seed = 0; seed < 100; seed++) {
      const data = answers(type, seed); expect(spec.check(seed, data), `${type} ${seed}`).toBeNull();
      for (const key of Object.keys(data)) expect(spec.check(seed, { ...data, [key]: null }), `${type} ${seed} ${key}`).toBe(errors[type][key]);
    }
    expect(verifyLesson(type, 42, { done: spec.tasks, data: answers(type, 42), conclusion: spec.conclusion, quiz: spec.quiz.map(q => q.answer), mistakes: 0 }).stars).toBe(3);
  });
});
describe("地图题数据", () => {
  it("镇对方位角远离扇区边界", () => {
    for (const [to, from] of TOWN_PAIRS) {
      const angle = bearing(TOWNS[from].at, TOWNS[to].at);
      const gap = Math.min(...Array.from({ length: 8 }, (_, i) => { const diff = Math.abs(angle - (22.5 + i * 45)); return Math.min(diff, 360 - diff); }));
      expect(gap, `${from} → ${to}`).toBeGreaterThanOrEqual(10);
    }
  });
  it("各参考点归入自身的大洲或大洋", () => {
    for (const regions of [CONTINENTS, OCEANS]) for (const [k, r] of Object.entries(regions)) for (const p of r.points) expect(nearestRegion(p, regions), `${k} ${p}`).toBe(k);
    expect(nearestRegion([0, -50], CONTINENTS)).toBeNull();
  });
  it("车速避开边界且颜色规则涵盖边界", () => {
    for (let seed = 0; seed < 1000; seed++) for (const speed of trafficSpeeds(seed)) { expect(speed).toBeGreaterThanOrEqual(5); expect(speed).toBeLessThanOrEqual(60); expect(Math.abs(speed - 15)).toBeGreaterThanOrEqual(3); expect(Math.abs(speed - 30)).toBeGreaterThanOrEqual(3); }
    expect([14, 15, 30, 31].map(trafficColor)).toEqual(["red", "yellow", "yellow", "green"]);
  });
});
