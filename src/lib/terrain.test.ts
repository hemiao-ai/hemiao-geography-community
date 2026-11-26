import { describe, expect, it } from "vitest";
import { contours, featurePoint, gentlestRoute, heightAt, heightGrid, hits, makeTerrain, profile, profileLine, routeSteepness, routes, type Pt } from "./terrain";

describe("等高线沙盘", () => {
  for (const seed of [0, 5, 13, 30, 77]) {
    const t = makeTerrain(seed);
    it(`种子 ${seed}：地形部位符合定义`, () => {
      const h = (p: Pt) => heightAt(t, p), at = (f: Parameters<typeof featurePoint>[1]) => featurePoint(t, f);
      const peak = at("peak");
      for (const [dx, dy] of [[0.04, 0], [-0.04, 0], [0, 0.04], [0, -0.04]]) expect(h([peak[0] + dx, peak[1] + dy])).toBeLessThan(h(peak));
      const cliff = at("cliff"), around = [[0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02]].map(([dx, dy]) => h([cliff[0] + dx, cliff[1] + dy]));
      expect(Math.max(...around) - Math.min(...around)).toBeGreaterThan(250);
      const line = profile(t, ...profileLine(t), 40), mid = line.slice(12, 30), low = Math.min(...mid);
      expect(Math.max(...line.slice(0, 12))).toBeGreaterThan(low + 300);
      expect(Math.max(...line.slice(30))).toBeGreaterThan(low + 150);
      expect(gentlestRoute(t)).toBe("ridge");
      const r = routes(t); expect(routeSteepness(t, r.cliff)).toBeGreaterThan(routeSteepness(t, r.ridge) * 2);
      expect(hits(t, "saddle", at("saddle"))).toBe(true);
      expect(hits(t, "saddle", at("peak"))).toBe(false);
    });
  }
  it("等高线线段落在图幅内，越高的等高线越短", () => {
    const c = contours(heightGrid(makeTerrain(3), 32));
    expect(c.length).toBeGreaterThan(5);
    for (const { segs } of c) for (const s of segs) for (const [x, y] of s) { expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(1); }
    expect(c[c.length - 1].segs.length).toBeLessThan(c[0].segs.length);
  });
});
