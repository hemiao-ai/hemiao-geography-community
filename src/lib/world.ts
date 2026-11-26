import { degDist } from "./mercator";
import type { LonLat } from "./china";

export const PLANETS = { mercury: "水星", venus: "金星", earth: "地球", mars: "火星", jupiter: "木星", saturn: "土星", uranus: "天王星", neptune: "海王星" };
export const HIERARCHY = { earth: "地球", solar: "太阳系", galaxy: "银河系", universe: "宇宙" };
export const HABITABLE = { near: "距离太阳不远不近，温度适宜", mass: "体积和质量适中，能吸引住大气", water: "有液态水", closest: "离太阳最近", biggest: "体积最大", fastest: "自转最快" };
export const SPACE_EVENTS = {
  sputnik: [1957, "苏联发射第一颗人造地球卫星"],
  gagarin: [1961, "苏联“东方 1 号”首次载人航天飞行"],
  apollo: [1969, "美国“阿波罗 11 号”载人登月"],
  dfh1: [1970, "我国“东方红一号”卫星发射成功"],
  sz5: [2003, "“神舟五号”完成我国首次载人航天飞行"],
  ce1: [2007, "我国首个月球探测器“嫦娥一号”发射"],
  fast: [2016, "“中国天眼”在贵州平塘建成"],
  zhurong: [2021, "“祝融号”火星车着陆火星"],
  tiangong: [2022, "“天宫”空间站全面建成"],
} as const;
export const TRICKY_POINTS: LonLat[] = [[-10, 40], [170, -20], [-15, 10], [165, -35]];
export const HEMI_POINTS: LonLat[] = [[150, 35], [-60, -15], [100, 5], [-170, 60], [30, -25], [-100, 40]];
export const CITIES: Record<string, { name: string; at: LonLat }> = {
  tokyo: { name: "东京", at: [140, 36] }, cairo: { name: "开罗", at: [31, 30] }, newyork: { name: "纽约", at: [-74, 41] },
  sydney: { name: "悉尼", at: [151, -34] }, singapore: { name: "新加坡", at: [104, 1] }, buenos: { name: "布宜诺斯艾利斯", at: [-58, -35] },
  nairobi: { name: "内罗毕", at: [37, -1] }, moscow: { name: "莫斯科", at: [38, 56] },
};
export const WORLD_FORMS: Record<string, { name: string; zone: LonLat[]; tol: number }> = {
  tibet: { name: "青藏高原", zone: [[88, 33]], tol: 7 }, brazil: { name: "巴西高原", zone: [[-48, -14]], tol: 9 },
  amazon: { name: "亚马孙平原", zone: [[-62, -4]], tol: 9 }, congo: { name: "刚果盆地", zone: [[22, -1]], tol: 6 },
  easteu: { name: "东欧平原", zone: [[40, 54]], tol: 9 }, himalaya: { name: "喜马拉雅山脉", zone: [[75, 35], [81, 30.5], [88, 28], [95, 28]], tol: 3 },
  alps: { name: "阿尔卑斯山脉", zone: [[7, 45.5], [10, 46.5], [14, 47]], tol: 3 },
  rocky: { name: "落基山脉", zone: [[-122, 55], [-115, 47], [-108, 38]], tol: 5 },
  andes: { name: "安第斯山脉", zone: [[-75, 5], [-77, -8], [-70, -20], [-71, -35], [-72, -48]], tol: 5 },
};
export const MOUNTAINS = ["himalaya", "alps", "rocky", "andes"];
export function hemisphereOf([lon, lat]: LonLat) { return `${lon >= -20 && lon < 160 ? "E" : "W"}-${lat >= 0 ? "N" : "S"}`; }
export const coordLabel = ([lon, lat]: LonLat) => `${Math.abs(lat)}°${lat >= 0 ? "N" : "S"}，${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`;
/** 局部经度按纬度缩放，再求点到折线的最短距离。 */
export function zoneDistance(p: LonLat, zone: LonLat[]) {
  if (!zone.length) return Infinity;
  if (zone.length === 1) return degDist(p, zone[0]);
  let best = Infinity;
  for (let i = 1; i < zone.length; i++) {
    const a = zone[i - 1], b = zone[i], c = Math.cos((p[1] + (a[1] + b[1]) / 2) * Math.PI / 360);
    const ax = (a[0] - p[0]) * c, ay = a[1] - p[1], dx = (b[0] - a[0]) * c, dy = b[1] - a[1];
    const u = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(ax + u * dx, ay + u * dy));
  }
  return best;
}
