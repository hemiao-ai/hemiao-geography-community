import { heightAt, makeTerrain, toMap, type Pt, type Terrain } from "./terrain";

export type Site = "good" | "flood" | "ridge" | "far";
const SITES: Record<Site, Pt> = { good: [0.39, 0.82], flood: [0.335, 0.73], ridge: [0.25, 0.626], far: [0.92, 0.9] };
const RIVER: Pt[] = [[0.34, 0.58], [0.33, 0.88], [0.326, 1]];
const ROAD: Pt[] = [[0, 0.92], [0.330667, 0.86], [0.41, 0.82], [0.56, 0.78], [1, 0.7]];
const BRIDGE: Pt[] = [[0.318, 0.8623], [0.3433, 0.8536]];
export const WATER_LIMIT = 0.075, ROAD_LIMIT = 0.05, SLOPE_LIMIT = 1800, SAFE_HEIGHT = 10, DELTA = 0.005;
export const sitePoints = (t: Terrain) => Object.fromEntries(Object.entries(SITES).map(([k, p]) => [k, toMap(t, p)])) as Record<Site, Pt>;
export const settlementRiver = (t: Terrain) => RIVER.map(p => toMap(t, p));
export const roadLine = (t: Terrain) => ROAD.map(p => toMap(t, p));
export const bridgeLine = (t: Terrain) => BRIDGE.map(p => toMap(t, p));
function nearest(p: Pt, line: Pt[]) {
  let point = line[0], dist = Infinity;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const q: Pt = [a[0] + u * dx, a[1] + u * dy], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < dist) { dist = d; point = q; }
  }
  return { point, dist };
}
export function siteRating(t: Terrain, p: Pt) {
  const river = nearest(p, settlementRiver(t));
  const slope = Math.hypot(heightAt(t, [p[0] + DELTA, p[1]]) - heightAt(t, [p[0] - DELTA, p[1]]), heightAt(t, [p[0], p[1] + DELTA]) - heightAt(t, [p[0], p[1] - DELTA])) / (2 * DELTA);
  return { water: river.dist <= WATER_LIMIT, flat: slope <= SLOPE_LIMIT, road: nearest(p, roadLine(t)).dist <= ROAD_LIMIT, safe: heightAt(t, p) - heightAt(t, river.point) >= SAFE_HEIGHT };
}
export function siteBest(seed: number): Site | undefined {
  const t = makeTerrain(seed), sites = sitePoints(t);
  return (Object.keys(sites) as Site[]).find(k => Object.values(siteRating(t, sites[k])).every(Boolean));
}
