import type { LessonSpec } from "./lessons";
import { shuffleClimate as shuffle } from "./lessons-g7a-climate";
import { BELTS, CONTINENTS, direction, nearestRegion, OCEANS, STRAITS, SYMBOL_NAMES, TOWN_PAIRS, TOWNS, type MapPoint, type MapSymbolKey } from "./world-maps";
import type { LonLat } from "./china";

export type G7aMapsType = "mapread" | "mapchoose" | "continents" | "plates";
const n = (seed: number) => Math.abs(Math.floor(seed));
const pick = <T,>(a: readonly T[], seed: number) => a[n(seed) % a.length];
export const directionQuestions = (seed: number) => {
  const pairs = shuffle(TOWN_PAIRS, seed + 17);
  return { default: pairs[0], arrow: pairs[1], graticule: pairs[2] };
};
export const mapRotation = (seed: number, mode: "default" | "arrow" | "graticule") => mode === "default" ? 0 : mode === "arrow" ? (n(seed) % 7 + 1) * 45 : (n(Math.floor(seed / 7)) % 3 + 1) * 90;
export const directionsAnswer = (seed: number) => Object.fromEntries(Object.entries(directionQuestions(seed)).map(([k, [to, from]]) => [k, direction(TOWNS[from].at, TOWNS[to].at)]));
export const scaleRule = (seed: number) => {
  const segment = pick([10, 20, 50], seed), denominator = pick([50000, 100000, 200000, 500000], Math.floor(n(seed) / 3));
  const [a, b] = [TOWNS.he.at, TOWNS.dong.at];
  return { segment, denominator, dist: Math.hypot(a[0] - b[0], a[1] - b[1]) / 100 * segment, perCm: denominator / 100000 };
};
export const legendTargets = (seed: number) => shuffle(Object.keys(SYMBOL_NAMES) as MapSymbolKey[], seed + 37).slice(0, 5);
export const SCALE_MAPS = { county: { title: "全县", denominator: 500000 }, town: { title: "东湖镇", denominator: 100000 }, center: { title: "东湖镇中心", denominator: 25000 } };
export const SCALE_ORDER = ["center", "town", "county"];
export const scaleLabels = (seed: number) => Object.fromEntries(shuffle(Object.keys(SCALE_MAPS), seed + 43).map((k, i) => [k, "甲乙丙"[i]]));
export const MAP_CHOICES = { region: ["查一个地区下辖哪些区县", "admin"], water: ["了解某地有哪些河流和湖泊", "hydro"], trip: ["规划坐火车去外地的路线", "transport"], news: ["看国际新闻时找出事件发生在哪个国家", "world"], park: ["在景区里找到想去的景点", "guide"], climb: ["准备登山，了解山的高低起伏", "topo"] } as const;
export const MAP_TYPES = { admin: "行政区划图", hydro: "河流湖泊分布图", transport: "交通图", world: "世界的国家和地区图", guide: "景区导游图", topo: "地形图" };
export const choiceTargets = (seed: number) => shuffle(Object.keys(MAP_CHOICES) as (keyof typeof MAP_CHOICES)[], seed + 61).slice(0, 4);
const SPEEDS = Array.from({ length: 56 }, (_, i) => i + 5).filter(v => Math.abs(v - 15) >= 3 && Math.abs(v - 30) >= 3);
export const trafficSpeeds = (seed: number) => shuffle(SPEEDS, seed + 79).slice(0, 4);
export const trafficColor = (speed: number) => speed > 30 ? "green" : speed >= 15 ? "yellow" : "red";
export const continentOrder = (seed: number) => shuffle(Object.keys(CONTINENTS), seed + 97);
export const oceanOrder = (seed: number) => shuffle(Object.keys(OCEANS), seed + 101);
export const straitTargets = (seed: number) => shuffle(Object.keys(STRAITS), seed + 109).slice(0, 4);
export const CHANGES = { fossil: ["高山岩石中发现海洋生物化石", "crust"], forest: ["浅海海底发现古河道和古森林遗迹", "sea"], reclaim: ["围海造陆形成新的土地", "human"], uplift: ["地震后海岸抬升，原来的浅滩露出水面", "crust"], ice: ["冰期海平面下降，浅海变成陆地", "sea"], island: ["在海上修建人工岛", "human"] } as const;
export const fitStart = (seed: number): MapPoint => [90 + n(seed) % 31, -35 + n(Math.floor(seed / 31)) % 71];
export const FOSSIL_ANSWER = "两块大陆曾经相连";
export const PLATE_CASES = {
  everest: { text: "珠穆朗玛峰仍在升高", move: "collide", pair: "eurasia-indian" },
  redsea: { text: "红海在不断扩张", move: "rift", pair: "african-indian" },
  med: { text: "地中海在不断缩小", move: "collide", pair: "african-eurasia" },
};
export const MOVES = { collide: "碰撞挤压", rift: "张裂" };
export const PLATE_PAIRS = { "eurasia-indian": "亚欧板块与印度洋板块", "african-indian": "非洲板块与印度洋板块", "african-eurasia": "非洲板块与亚欧板块", "pacific-eurasia": "太平洋板块与亚欧板块" };
export const BELT_NAMES = { pacific: "环太平洋地带", med: "地中海—喜马拉雅地带" };
export const beltTargets = (seed: number) => shuffle([...shuffle(Object.keys(BELTS).filter(k => BELTS[k].belt === "pacific"), seed + 131).slice(0, 2), ...shuffle(Object.keys(BELTS).filter(k => BELTS[k].belt === "med"), seed + 137).slice(0, 2)], seed + 139);
export const answersOfPairs = (o: Record<string, readonly [string, string]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1]]));
const obj = (x: unknown) => x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : {};
const same = (x: unknown, want: Record<string, string>) => { const v = obj(x); return Object.keys(v).length === Object.keys(want).length && Object.entries(want).every(([k, a]) => v[k] === a); };
const close = (x: unknown, value: number, tol: number) => typeof x === "number" && Number.isFinite(x) && Math.abs(x - value) <= tol + 1e-9;
const arraySame = (x: unknown, want: string[]) => Array.isArray(x) && x.length === want.length && want.every((v, i) => x[i] === v);
const point = (x: unknown): x is LonLat => Array.isArray(x) && x.length === 2 && x.every(v => typeof v === "number" && Number.isFinite(v)) && Math.abs(x[0]) <= 180 && Math.abs(x[1]) <= 90;
const regionFound = (x: unknown, regions: typeof CONTINENTS) => { const v = obj(x); return Object.keys(v).length === Object.keys(regions).length && Object.keys(regions).every(k => point(v[k]) && nearestRegion(v[k] as LonLat, regions) === k); };
const quiz = (...q: [string, string[], string][]) => q.map(([q, options, answer]) => ({ q, options, answer }));
export const G7A_MAP_LESSONS: Record<G7aMapsType, LessonSpec> = {
  mapread: {
    tasks: 3, conclusion: ["西", "指向标", "实地距离", "图例"],
    quiz: quiz(["数字比例尺 1:100 000 表示图上 1 厘米代表实地距离", ["1 千米", "10 千米", "100 米"], "1 千米"], ["在有经纬网的地图上，判断方向要依据", ["经纬网", "图名", "图例"], "经纬网"], ["与东北方向相反的方向是", ["西南", "东南", "西北"], "西南"]),
    check: (seed, d) => {
      if (!same(d.dirs, directionsAnswer(seed))) return "地图方向判断不正确";
      const scale = obj(d.scale), want = scaleRule(seed); if (!close(scale.dist, want.dist, want.dist * 0.08) || !close(scale.perCm, want.perCm, 0.001)) return "比例尺距离计算不正确";
      if (!same(d.legend, Object.fromEntries(legendTargets(seed).map(k => [k, SYMBOL_NAMES[k]])))) return "地图图例识别不正确";
      return null;
    },
  },
  mapchoose: {
    tasks: 3, conclusion: ["小", "详细", "行政区划图", "位置和速度"],
    quiz: quiz(["想知道杭州在全国的大致位置，应选用", ["比例尺较小的中国地图", "西湖景区导游图", "杭州市地铁线路图"], "比例尺较小的中国地图"], ["下列不属于数字地图应用的是", ["用纸质地图册查找地名", "手机实时导航", "灾害预警平台确定影响范围"], "用纸质地图册查找地名"], ["图幅相同时，1:1 000 与 1:100 000 相比，比例尺较大的是", ["1:1 000", "1:100 000", "一样大"], "1:1 000"]),
    check: (seed, d) => {
      if (!arraySame(d.scaleOrder, SCALE_ORDER)) return "比例尺顺序不正确";
      if (d.detail !== "center") return "地图详略判断不正确";
      if (!same(d.choose, Object.fromEntries(choiceTargets(seed).map(k => [k, MAP_CHOICES[k][1]])))) return "地图选择不正确";
      if (!same(d.traffic, Object.fromEntries(trafficSpeeds(seed).map((v, i) => [i, trafficColor(v)])))) return "实时路况颜色不正确";
      return null;
    },
  },
  continents: {
    tasks: 4, conclusion: ["71%", "亚洲", "太平洋", "苏伊士运河"],
    quiz: quiz(["唯一没有人类定居的大洲是", ["南极洲", "大洋洲", "北美洲"], "南极洲"], ["面积最小的大洋是", ["北冰洋", "印度洋", "大西洋"], "北冰洋"], ["下列大洲中，赤道没有穿过的是", ["欧洲", "非洲", "南美洲"], "欧洲"]),
    check: (seed, d) => {
      if (!close(d.ocean, 71, 3)) return "海陆比例不正确";
      if (!regionFound(d.cont, CONTINENTS)) return "大洲位置不正确";
      if (!regionFound(d.ocean4, OCEANS)) return "大洋位置不正确";
      const v = obj(d.straits), targets = straitTargets(seed); if (Object.keys(v).length !== targets.length || targets.some(k => { const a = obj(v[k]); return a.name !== STRAITS[k].name || a.role !== STRAITS[k].role; })) return "海峡和运河判断不正确";
      return null;
    },
  },
  plates: {
    tasks: 4, conclusion: ["海平面升降", "大陆漂移", "六", "活跃", "山脉"],
    quiz: quiz(["喜马拉雅山脉是由哪两个板块碰撞挤压形成的", ["亚欧板块和印度洋板块", "非洲板块和亚欧板块", "太平洋板块和亚欧板块"], "亚欧板块和印度洋板块"], ["世界上的火山、地震主要集中在", ["板块交界地带", "板块内部", "大陆中心"], "板块交界地带"], ["红海在不断扩张，是因为", ["板块张裂", "板块碰撞", "海平面下降"], "板块张裂"]),
    check: (seed, d) => {
      if (!same(d.change, answersOfPairs(CHANGES))) return "海陆变迁原因分类不正确";
      if (!Array.isArray(d.fit) || d.fit.length !== 2 || !d.fit.every(v => typeof v === "number" && Number.isFinite(v)) || Math.hypot(d.fit[0], d.fit[1]) > 12) return "大陆拼合位置不正确";
      if (d.fossil !== FOSSIL_ANSWER) return "化石证据解释不正确";
      const plates = obj(d.plates); if (Object.keys(plates).length !== 3 || Object.entries(PLATE_CASES).some(([k, a]) => { const v = obj(plates[k]); return v.move !== a.move || v.pair !== a.pair; })) return "板块运动判断不正确";
      if (!same(d.belts, Object.fromEntries(beltTargets(seed).map(k => [k, BELTS[k].belt])))) return "火山地震带分类不正确";
      return null;
    },
  },
};
