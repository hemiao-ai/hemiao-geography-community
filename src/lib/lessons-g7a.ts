import type { LessonSpec } from "./lessons";
import { CITIES, HEMI_POINTS, HIERARCHY, MOUNTAINS, PLANETS, SPACE_EVENTS, TRICKY_POINTS, WORLD_FORMS, hemisphereOf, zoneDistance } from "./world";
import { degDist } from "./mercator";
import { siteBest } from "./settlement";
import type { LonLat } from "./china";

export type G7aType = "cosmos" | "globe" | "landform" | "settlement";
export const LABELS = ["甲", "乙", "丙", "丁", "戊"];
export const shuffle = <T,>(list: readonly T[], seed: number) => { const a = [...list]; let s = Math.abs(Math.floor(seed)) % 2147483646 + 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const timeline = (seed: number) => shuffle(Object.keys(SPACE_EVENTS), seed + 31).slice(0, 4);
export const timelineAnswer = (seed: number) => [...timeline(seed)].sort((a, b) => SPACE_EVENTS[a as keyof typeof SPACE_EVENTS][0] - SPACE_EVENTS[b as keyof typeof SPACE_EVENTS][0]);
export const planeSpeed = (seed: number) => [800, 900, 1000][Math.abs(Math.floor(seed)) % 3];
export const hemiPoints = (seed: number) => shuffle([shuffle(TRICKY_POINTS, seed + 11)[0], ...shuffle(HEMI_POINTS, seed + 23).slice(0, 2)], seed + 41);
export const treasureCities = (seed: number) => shuffle(Object.keys(CITIES), seed + 53).slice(0, 2);
export const worldTargets = (seed: number) => shuffle([shuffle(MOUNTAINS, seed + 61)[0], ...shuffle(Object.keys(WORLD_FORMS).filter(k => !MOUNTAINS.includes(k)), seed + 71).slice(0, 2)], seed + 79);
export const FORMS = { mountain: "山地", plateau: "高原", hill: "丘陵", plain: "平原", basin: "盆地" };
export const SEAFLOOR = { shelf: "大陆架", slope: "大陆坡", trench: "海沟", basin: "洋盆", ridge: "洋中脊" };
export const LINES = { shapeLon: ["半圆弧，连接南北两极", "lon"], shapeLat: ["圆圈，与赤道平行", "lat"], lenLon: ["长度都相等", "lon"], lenLat: ["赤道最长，向两极逐渐缩短", "lat"], dirLon: ["指示南北方向", "lon"], dirLat: ["指示东西方向", "lat"], rangeLon: ["0°～180°，分东经（E）和西经（W）", "lon"], rangeLat: ["0°～90°，分北纬（N）和南纬（S）", "lat"] } as const;
export const SCENES = { low: ["房屋低矮，多为独门独院", "rural"], tall: ["高楼众多，建筑密度大", "urban"], farm: ["周围有农田、果林、池塘", "rural"], road: ["道路纵横交错，有的呈立体化", "urban"], agri: ["人们主要从事耕种、放牧、捕鱼", "rural"], service: ["商店、医院、学校等设施齐全", "urban"], industry: ["人们主要从事工业、服务业", "urban"], nature: ["保留了更多自然风貌", "rural"] } as const;
export const labelOrder = (keys: string[], seed: number) => shuffle(keys, seed);
export const labelAnswer = (keys: string[], seed: number) => Object.fromEntries(labelOrder(keys, seed).map((k, i) => [LABELS[i], k]));
export const pairsAnswer = (o: Record<string, readonly [string, string]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1]]));
const same = (v: unknown, answer: Record<string, string>) => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === Object.keys(answer).length && Object.entries(answer).every(([k, x]) => (v as Record<string, unknown>)[k] === x);
const order = (v: unknown, answer: string[]) => Array.isArray(v) && v.length === answer.length && answer.every((x, i) => v[i] === x);
const set = (v: unknown, answer: string[]) => Array.isArray(v) && v.length === answer.length && answer.every(x => v.includes(x));
const point = (v: unknown): LonLat | null => Array.isArray(v) && v.length === 2 && v.every(x => typeof x === "number" && Number.isFinite(x)) && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90 ? [v[0], v[1]] : null;
function found(v: unknown, keys: string[], hit: (key: string, p: LonLat) => boolean) {
  if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).length !== keys.length) return false;
  return keys.every(k => { const p = point((v as Record<string, unknown>)[k]); return !!p && hit(k, p); });
}
const quiz = (...q: [string, string[], string][]) => q.map(([q, options, answer]) => ({ q, options, answer }));

export const G7A_LESSONS: Record<G7aType, LessonSpec> = {
  cosmos: {
    tasks: 4, conclusion: ["银河系", "水星", "不大不小", "东方红一号"],
    quiz: quiz(["太阳系中，距离太阳第三近的行星是", ["地球", "火星", "金星"], "地球"], ["下列不属于地球适宜生命存在的条件的是", ["离太阳最近", "适宜的温度", "有液态水"], "离太阳最近"], ["2021 年成功着陆火星的我国火星车是", ["祝融号", "玉兔号", "嫦娥号"], "祝融号"]),
    check: (seed, d) => {
      if (!order(d.hierarchy, Object.keys(HIERARCHY))) return "天体层级顺序不正确";
      if (!order(d.planets, Object.keys(PLANETS))) return "八大行星顺序不正确";
      if (!set(d.habitable, ["near", "mass", "water"])) return "宜居条件选择不正确";
      if (!order(d.timeline, timelineAnswer(seed))) return "太空探索时间顺序不正确";
      return null;
    },
  },
  globe: {
    tasks: 4, conclusion: ["经线", "赤道", "20°W 和 160°E", "经纬度"],
    quiz: quiz(["0° 经线又叫", ["本初子午线", "赤道", "北回归线"], "本初子午线"], ["30°N～60°N 属于", ["中纬度地区", "低纬度地区", "高纬度地区"], "中纬度地区"], ["10°W，20°N 位于", ["东半球、北半球", "西半球、北半球", "东半球、南半球"], "东半球、北半球"]),
    check: (seed, d) => {
      if (typeof d.hours !== "number" || !Number.isFinite(d.hours) || Math.abs(d.hours - 40000 / planeSpeed(seed)) > 1) return "飞行时间不正确";
      if (!same(d.lines, pairsAnswer(LINES))) return "经纬线分类不正确";
      if (!same(d.hemi, Object.fromEntries(hemiPoints(seed).map((p, i) => [String(i), hemisphereOf(p)])))) return "半球判断不正确";
      if (!found(d.found, treasureCities(seed), (k, p) => degDist(p, CITIES[k].at) <= 4)) return "寻宝位置不正确";
      return null;
    },
  },
  landform: {
    tasks: 3, conclusion: ["盆地", "巴西高原", "青藏高原", "大陆架"],
    quiz: quiz(["世界上面积最大的平原是", ["亚马孙平原", "东欧平原", "西西伯利亚平原"], "亚马孙平原"], ["四周高、中间低的地形是", ["盆地", "高原", "平原"], "盆地"], ["安第斯山脉位于", ["南美洲西部", "北美洲西部", "欧洲南部"], "南美洲西部"]),
    check: (seed, d) => {
      if (!same(d.forms, labelAnswer(Object.keys(FORMS), seed + 101))) return "基本地形分类不正确";
      if (!found(d.found, worldTargets(seed), (k, p) => zoneDistance(p, WORLD_FORMS[k].zone) <= WORLD_FORMS[k].tol)) return "地形区位置不正确";
      if (!same(d.seafloor, labelAnswer(Object.keys(SEAFLOOR), seed + 131))) return "海底地形分类不正确";
      return null;
    },
  },
  settlement: {
    tasks: 3, conclusion: ["农业", "大", "平坦", "增加"],
    quiz: quiz(["下列属于乡村景观特征的是", ["房屋低矮，周围有农田", "高楼林立，道路立体化", "商场、医院密集"], "房屋低矮，周围有农田"], ["村落选址一般要避开", ["地势低洼、容易被洪水淹没的地方", "靠近水源的平地", "交通便利的地方"], "地势低洼、容易被洪水淹没的地方"], ["保护特色城乡景观，下列做法合理的是", ["修缮传统民居，控制周边新建筑的高度", "拆掉老街，全部建成高楼", "把古村落改成停车场"], "修缮传统民居，控制周边新建筑的高度"]),
    check: (seed, d) => {
      if (!same(d.scene, pairsAnswer(SCENES))) return "城乡景观分类不正确";
      if (typeof d.site !== "string" || d.site !== siteBest(seed)) return "选址不符合条件";
      if (!order(d.stages, ["village", "town", "city"])) return "城镇发展顺序不正确";
      return null;
    },
  },
};
