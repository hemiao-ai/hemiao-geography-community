import { degDist } from "./mercator";
import type { LonLat } from "./china";

export type MapPoint = [number, number];
export const TOWNS = {
  he: { name: "禾苗镇", at: [180, 240] as MapPoint }, dong: { name: "东湖镇", at: [340, 240] as MapPoint },
  bei: { name: "北山镇", at: [180, 80] as MapPoint }, lin: { name: "林溪镇", at: [340, 80] as MapPoint },
  nan: { name: "南湾镇", at: [180, 360] as MapPoint }, xi: { name: "西岭镇", at: [60, 240] as MapPoint },
};
export type TownKey = keyof typeof TOWNS;
export const TOWN_PAIRS: [TownKey, TownKey][] = [["dong", "he"], ["bei", "he"], ["lin", "he"], ["nan", "he"], ["xi", "he"], ["he", "lin"]];
export const MAP_FEATURES = {
  river: [[450, 0], [430, 80], [460, 150], [420, 230], [440, 310], [400, 400]] as MapPoint[],
  rail: [[0, 145], [120, 190], [180, 220], [340, 240], [600, 300]] as MapPoint[],
  highway: [[0, 330], [180, 280], [340, 240], [600, 115]] as MapPoint[],
  road: [[180, 80], [180, 240], [180, 360], [300, 400]] as MapPoint[],
  lake: { at: [485, 205] as MapPoint, rx: 42, ry: 28 },
  reservoir: { at: [105, 120] as MapPoint, rx: 30, ry: 20 },
  peak: { at: [245, 130] as MapPoint, height: 618 },
  airport: [500, 85] as MapPoint, port: [445, 315] as MapPoint,
  streets: [[[280, 232], [400, 232]], [[280, 248], [400, 248]], [[332, 200], [332, 280]], [[348, 200], [348, 280]]] as MapPoint[][],
  buildings: [[326, 231], [337, 231], [350, 231], [326, 242], [337, 242], [350, 242]] as MapPoint[],
};
export const COMPASS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"] as const;
export function bearing(from: MapPoint, to: MapPoint) { return (Math.atan2(to[0] - from[0], from[1] - to[1]) * 180 / Math.PI + 360) % 360; }
export const direction = (from: MapPoint, to: MapPoint) => COMPASS[Math.round(bearing(from, to) / 45) % 8];
export const SYMBOL_NAMES = { rail: "铁路", highway: "高速公路", road: "普通公路", river: "河流", lake: "湖泊", reservoir: "水库", peak: "山峰", town: "居民点", airport: "机场", port: "港口", desert: "沙漠", waterfall: "瀑布" };
export type MapSymbolKey = keyof typeof SYMBOL_NAMES;
export const CONTINENTS: Record<string, { name: string; points: LonLat[] }> = {
  asia: { name: "亚洲", points: [[100, 60], [90, 35], [105, 25], [75, 22], [45, 30], [115, 45], [130, 62]] },
  europe: { name: "欧洲", points: [[10, 50], [25, 55], [40, 57], [-3, 41], [15, 62], [2, 47]] },
  africa: { name: "非洲", points: [[20, 10], [25, -15], [5, 25], [35, 0], [25, -28], [-5, 12]] },
  northAmerica: { name: "北美洲", points: [[-100, 45], [-110, 60], [-85, 35], [-100, 22], [-75, 55], [-150, 64]] },
  southAmerica: { name: "南美洲", points: [[-60, -10], [-65, -30], [-70, -45], [-55, 0], [-45, -12]] },
  oceania: { name: "大洋洲", points: [[134, -25], [145, -30], [120, -25], [175, -40], [145, -6]] },
  antarctica: { name: "南极洲", points: [[0, -72], [90, -70], [-60, -72], [150, -72], [-120, -74]] },
};
export const OCEANS: Record<string, { name: string; points: LonLat[] }> = {
  pacific: { name: "太平洋", points: [[-150, 10], [-130, -20], [170, 20], [160, -30], [-170, 40], [-100, -40]] },
  atlantic: { name: "大西洋", points: [[-35, 30], [-25, 0], [-15, -30], [-40, 45], [-50, 15]] },
  indian: { name: "印度洋", points: [[75, -15], [65, -30], [90, -25], [60, 5], [100, -35]] },
  arctic: { name: "北冰洋", points: [[30, 76], [160, 76], [-150, 75], [0, 80]] },
};
export function nearestRegion(p: LonLat, regions: Record<string, { points: LonLat[] }>) {
  let result: string | null = null, best = Infinity;
  for (const [key, r] of Object.entries(regions)) for (const q of r.points) { const d = degDist(p, q); if (d < best) { best = d; result = key; } }
  return best <= 15 ? result : null;
}
export const STRAITS: Record<string, { name: string; at: LonLat; role: string }> = {
  suez: { name: "苏伊士运河", at: [32.5, 30.5], role: "亚洲与非洲的分界" },
  panama: { name: "巴拿马运河", at: [-79.7, 9.1], role: "北美洲与南美洲的分界" },
  bering: { name: "白令海峡", at: [-169, 65.8], role: "亚洲与北美洲的分界" },
  malacca: { name: "马六甲海峡", at: [100.5, 3], role: "沟通太平洋与印度洋" },
  gibraltar: { name: "直布罗陀海峡", at: [-5.6, 35.95], role: "沟通地中海与大西洋" },
  turkish: { name: "土耳其海峡", at: [29, 41], role: "亚洲与欧洲的分界" },
};
export const BELTS: Record<string, { name: string; at: LonLat; belt: string }> = {
  japan: { name: "日本", at: [138, 36], belt: "pacific" }, chile: { name: "智利", at: [-71, -33], belt: "pacific" },
  alaska: { name: "阿拉斯加南部", at: [-150, 61], belt: "pacific" }, nz: { name: "新西兰", at: [175, -39], belt: "pacific" },
  italy: { name: "意大利南部", at: [15, 38], belt: "med" }, himalaya: { name: "喜马拉雅山区", at: [86, 28], belt: "med" }, iran: { name: "伊朗高原", at: [52, 35], belt: "med" },
};
