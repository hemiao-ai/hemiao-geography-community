/** 两个演示知识点的答案与种子规则；客户端与服务端共用 */
import { CITIES, dayLength, localTime, longerDay, SOLAR_TERMS, type Term } from "./astro";
import { FEATURES, gentlestRoute, heightAt, hits, makeTerrain, profileOptions, featurePoint, type Feature, type Pt } from "./terrain";
import { CLIMATE_CITIES, classifyChina, DISASTERS, FARM_REGIONS, LANDFORMS, PROFILE_32N, QUAKE_ACTIONS, RAIN_BELT_LABEL, RIVER_SPLITS, STEP_BOUNDS, stepOf, type LonLat } from "./china";
import { degDist } from "./mercator";
import { CARGO, ENV_MEASURES, ETHNIC, EXTREMES, FESTIVALS, INDUSTRY_BASES, INDUSTRY_SITES, LAND_REGIONS, LOW_CARBON, MINES, PROVINCES, RAIL_LINES, SAVE_WATER, SEA_RESOURCES, SEAS, TRANSFER_ROUTES } from "./china2";
import { G7A_LESSONS, type G7aType } from "./lessons-g7a";
import { G7A_CLIMATE_LESSONS, type G7aClimateType } from "./lessons-g7a-climate";
import { G7A_MAP_LESSONS, type G7aMapsType } from "./lessons-g7a-maps";
import { G7A_HUMAN_LESSONS, type G7aHumanType } from "./lessons-g7a-human";

export type LessonType = "earth" | "contour" | "terrain3" | "monsoon" | "river" | "farm" | "disaster" | "territory" | "population" | "ethnic" | "land" | "water" | "mineral" | "ocean" | "industry" | "transport" | "environment" | G7aType | G7aClimateType | G7aMapsType | G7aHumanType;
export interface QuizItem { q: string; options: string[]; answer: string }
export interface LessonSpec { tasks: number; conclusion: string[]; quiz: QuizItem[]; check: (seed: number, data: Record<string, unknown>) => string | null }
const pick = <T,>(list: readonly T[], seed: number) => list[((Math.floor(seed) % list.length) + list.length) % list.length];
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

export const earthTerm = (seed: number): Term => pick(["summer", "winter", "spring", "autumn"] as const, seed);
/** 公转图上四个位置的编号起点；北半球夏至时地球在太阳左侧（角度 180°） */
export const orbitOffset = (seed: number) => Math.abs(Math.floor(seed / 4)) % 4;
export const ORBIT_LABELS = ["甲", "乙", "丙", "丁"] as const;
export const summerIndex = (seed: number) => (2 - orbitOffset(seed) + 4) % 4;
export const riverLabel = (seed: number) => (Math.abs(Math.floor(seed / 3)) % 2 === 0 ? { valley: "甲", ridge: "乙" } : { valley: "乙", ridge: "甲" });

const same = (a: unknown, b: Record<string, string>) => !!a && typeof a === "object" && Object.keys(b).length === Object.keys(a).length && Object.keys(b).every(k => (a as Record<string, unknown>)[k] === b[k]);
const sameSet = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && b.every(x => a.includes(x));
const shuffle = <T,>(list: readonly T[], seed: number) => { const a = [...list]; let s = Math.abs(Math.floor(seed)) + 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 八上：种子规则 ---------- */
export const landformTargets = (seed: number) => shuffle(Object.keys(LANDFORMS), seed).slice(0, 3);
export const PROFILE_SAMPLES = [86, 96, 102.5, 109, 115, 119];
export const profileSamples = (seed: number) => [pick([86, 96], seed), pick([102.5, 109], seed >> 1), pick([115, 119], seed >> 2)];
export function elevationAt(lon: number) {
  const p = PROFILE_32N; if (lon <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) if (lon <= p[i][0]) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + ((lon - x0) / (x1 - x0)) * (y1 - y0); }
  return p[p.length - 1][1];
}
export const RAIN_TARGETS = ["华南", "长江中下游（梅雨）", "华北、东北"] as const;
export const rainTarget = (seed: number) => pick(RAIN_TARGETS, seed);
export const climateCities = (seed: number) => shuffle(Object.keys(CLIMATE_CITIES), seed).slice(0, 3);
export const flowOrder = (seed: number) => (Math.abs(Math.floor(seed)) % 2 === 0 ? ["changjiang", "huanghe"] : ["huanghe", "changjiang"]) as ("changjiang" | "huanghe")[];
/** 洪水避险：四个候选点（甲乙丙丁），最高处才安全 */
export const FLOOD_SPOTS: Feature[] = ["peak", "saddle", "valley", "ridge"];
export const floodSpots = (seed: number) => shuffle(FLOOD_SPOTS, seed + 11);
export const safeSpot = (seed: number) => { const t = makeTerrain(seed); return [...FLOOD_SPOTS].sort((a, b) => heightAt(t, featurePoint(t, b)) - heightAt(t, featurePoint(t, a)))[0]; };
const lonlat = (v: unknown): LonLat | null => Array.isArray(v) && v.length === 2 && v.every(x => typeof x === "number" && Number.isFinite(x)) ? [v[0], v[1]] : null;
const second = <T extends Record<string, { answer: string }>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.answer]));

/* ---------- 八上其余知识点：种子规则与判定工具 ---------- */
export const provinceSet = (seed: number) => shuffle(PROVINCES.map((_, i) => i), seed + 3).slice(0, 6);
export const lineLabels = (keys: string[], seed: number) => shuffle(keys, seed + 5);
const pairs = <T extends Record<string, readonly [string, ...unknown[]]>>(o: T, i = 1) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[i] as string]));
const trueKeys = (o: Record<string, readonly [string, boolean]>) => Object.keys(o).filter(k => o[k][1]);
function clicked(found: unknown, targets: Record<string, { at: LonLat }>, tol = 3) {
  const f = found && typeof found === "object" ? found as Record<string, unknown> : {};
  return Object.entries(targets).every(([k, v]) => { const p = lonlat(f[k]); return !!p && degDist(p, v.at) <= tol; });
}
const selfMap = (o: Record<string, { name: string }>) => Object.fromEntries(Object.keys(o).map(k => [k, k]));
const quiz3 = (...q: [string, string[], string][]) => q.map(([qq, options, answer]) => ({ q: qq, options, answer }));

export const LESSONS: Record<LessonType, LessonSpec> = {
  ...G7A_LESSONS,
  ...G7A_CLIMATE_LESSONS,
  ...G7A_MAP_LESSONS,
  ...G7A_HUMAN_LESSONS,
  territory: {
    tasks: 3, conclusion: ["东半球", "温带", "960", "34", "14"],
    quiz: quiz3(["我国最大的岛屿是", ["台湾岛", "海南岛", "崇明岛"], "台湾岛"], ["我国的内海是", ["渤海", "黄海", "东海"], "渤海"], ["简称“豫”的省级行政区是", ["河南省", "湖北省", "湖南省"], "河南省"]),
    check: (seed, d) => {
      if (!clicked(d.extremes, EXTREMES, 3.5)) return "四至的位置不正确";
      const a = d.abbr && typeof d.abbr === "object" ? d.abbr as Record<string, unknown> : {};
      if (provinceSet(seed).some(i => a[i] !== PROVINCES[i][1])) return "省级行政区简称不正确";
      return d.neighbors === "14-6" ? null : "邻国数量不正确";
    },
  },
  population: {
    tasks: 3, conclusion: ["人口众多", "东多西少", "黑河—腾冲", "老龄化"],
    quiz: quiz3(["我国人口最稠密的地区在", ["东部沿海", "青藏高原", "西北内陆"], "东部沿海"], ["黑河—腾冲线以东，人口约占全国的", ["94%", "43%", "50%"], "94%"], ["应对人口老龄化，可以", ["完善养老服务体系", "减少学校数量", "限制老人出行"], "完善养老服务体系"]),
    check: (_, d) => Math.abs(Number(d.pop2020) - 14.1) <= 0.5 && d.dense === "east" && d.pyramid === "y2020" ? null : "人口读图判断不正确",
  },
  ethnic: {
    tasks: 3, conclusion: ["56", "汉族", "大杂居、小聚居", "西南、西北和东北"],
    quiz: quiz3(["我国人口最多的少数民族是", ["壮族", "回族", "满族"], "壮族"], ["“那达慕”是哪个民族的传统盛会", ["蒙古族", "藏族", "傣族"], "蒙古族"], ["我国处理民族关系的基本原则是", ["平等、团结、互助、和谐", "各自发展", "只发展汉族地区"], "平等、团结、互助、和谐"]),
    check: (_, d) => same(d.map, second(ETHNIC)) && same(d.fest, FESTIVALS) ? null : "民族分布或节日判断不正确",
  },
  land: {
    tasks: 3, conclusion: ["类型齐全", "林地", "人均", "东部", "西部"],
    quiz: quiz3(["我国的一项基本国策是", ["十分珍惜、合理利用土地和切实保护耕地", "多开垦草原", "扩大城市用地"], "十分珍惜、合理利用土地和切实保护耕地"], ["我国耕地主要分布在", ["东部季风区的平原和盆地", "西北荒漠", "青藏高原"], "东部季风区的平原和盆地"], ["要守住的耕地红线是", ["18 亿亩", "8 亿亩", "30 亿亩"], "18 亿亩"]),
    check: (_, d) => d.largest === "林地" && same(d.regions, second(LAND_REGIONS)) ? null : "土地资源判断不正确",
  },
  water: {
    tasks: 4, conclusion: ["南多北少", "夏秋多", "南水北调", "水库", "节约用水"],
    quiz: quiz3(["南水北调中线工程的水源地是", ["丹江口水库", "三峡水库", "太湖"], "丹江口水库"], ["解决水资源时间分配不均的主要措施是", ["修建水库", "跨流域调水", "海水淡化"], "修建水库"], ["我国水资源的特点是", ["总量丰富，人均不足", "总量少，人均多", "人均很多"], "总量丰富，人均不足"]),
    check: (_, d) => same(d.routes, selfMap(TRANSFER_ROUTES)) && sameSet(d.save, trueKeys(SAVE_WATER)) && d.space === "南多北少" ? null : "水资源判断不正确",
  },
  mineral: {
    tasks: 3, conclusion: ["丰富", "不足", "西气东输", "可持续"],
    quiz: quiz3(["我国最大的油田是", ["大庆油田", "胜利油田", "辽河油田"], "大庆油田"], ["山西省以哪种矿产著称", ["煤炭", "石油", "铁矿"], "煤炭"], ["矿产资源属于", ["非可再生资源", "可再生资源", "取之不尽的资源"], "非可再生资源"]),
    check: (_, d) => same(d.mines, second(MINES)) && d.pipe === "西气东输" ? null : "矿产资源判断不正确",
  },
  ocean: {
    tasks: 3, conclusion: ["渤海", "南海", "海洋渔业", "保护"],
    quiz: quiz3(["我国最大的渔场是", ["舟山渔场", "渤海渔场", "北部湾渔场"], "舟山渔场"], ["我国面积最大、最深的海是", ["南海", "东海", "黄海"], "南海"], ["保护海洋渔业资源的措施是", ["实行伏季休渔", "大量捕捞幼鱼", "向海洋排放污水"], "实行伏季休渔"]),
    check: (_, d) => clicked(d.seas, SEAS, 4) && same(d.res, second(SEA_RESOURCES)) ? null : "海洋判断不正确",
  },
  industry: {
    tasks: 3, conclusion: ["东部沿海", "沪宁杭", "原料", "高新技术"],
    quiz: quiz3(["我国最大的综合性工业基地是", ["沪宁杭工业基地", "辽中南工业基地", "京津唐工业基地"], "沪宁杭工业基地"], ["以重工业为主的工业基地是", ["辽中南工业基地", "珠江三角洲工业基地", "沪宁杭工业基地"], "辽中南工业基地"], ["北京中关村是我国著名的", ["高新技术产业园区", "钢铁基地", "煤炭基地"], "高新技术产业园区"]),
    check: (_, d) => clicked(d.bases, INDUSTRY_BASES, 3) && same(d.sites, pairs(INDUSTRY_SITES)) ? null : "工业判断不正确",
  },
  transport: {
    tasks: 3, conclusion: ["航空", "铁路", "水路", "郑州"],
    quiz: quiz3(["运量大、运价最低的运输方式是", ["水路运输", "航空运输", "公路运输"], "水路运输"], ["京广线和陇海线交会于", ["郑州", "武汉", "徐州"], "郑州"], ["“门到门”运输最灵活的是", ["公路运输", "铁路运输", "管道运输"], "公路运输"]),
    check: (_, d) => same(d.cargo, pairs(CARGO)) && same(d.lines, selfMap(RAIL_LINES)) && d.hub === "郑州" ? null : "交通运输判断不正确",
  },
  environment: {
    tasks: 3, conclusion: ["人地协调", "清洁能源", "2030", "2060"],
    quiz: quiz3(["“三北”防护林工程主要是为了", ["防风固沙", "防治水污染", "治理雾霾"], "防风固沙"], ["“绿水青山就是金山银山”体现的是", ["人与自然和谐共生", "先污染后治理", "只追求经济增长"], "人与自然和谐共生"], ["下列属于清洁能源的是", ["太阳能", "煤炭", "石油"], "太阳能"]),
    check: (_, d) => same(d.measures, pairs(ENV_MEASURES)) && sameSet(d.carbon, trueKeys(LOW_CARBON)) && d.target === "2030-2060" ? null : "环境保护判断不正确",
  },

  terrain3: {
    tasks: 4, conclusion: ["西高东低", "三级阶梯", "青藏高原", "自西向东"],
    quiz: [
      { q: "我国面积最大的高原是", options: ["青藏高原", "内蒙古高原", "黄土高原"], answer: "青藏高原" },
      { q: "四川盆地位于我国地势的", options: ["第二级阶梯", "第一级阶梯", "第三级阶梯"], answer: "第二级阶梯" },
      { q: "地势西高东低、面向海洋倾斜，有利于", options: ["海洋湿润气流深入内地", "冬季风南下", "河流向西流"], answer: "海洋湿润气流深入内地" },
    ],
    check: (seed, d) => {
      const b = d.bounds && typeof d.bounds === "object" ? d.bounds as Record<string, unknown> : {};
      if (!sameSet(b.first, STEP_BOUNDS.first) || !sameSet(b.second, STEP_BOUNDS.second)) return "阶梯分界线不正确";
      const found = d.found && typeof d.found === "object" ? d.found as Record<string, unknown> : {};
      for (const id of landformTargets(seed)) { const p = lonlat(found[id]); if (!p || degDist(p, LANDFORMS[id].at) > 3.2) return `${LANDFORMS[id].name}的位置不正确`; }
      const steps = d.steps && typeof d.steps === "object" ? d.steps as Record<string, unknown> : {};
      if (profileSamples(seed).some(lon => steps[lon] !== stepOf(elevationAt(lon)))) return "剖面上的阶梯判断不正确";
      return null;
    },
  },
  monsoon: {
    tasks: 4, conclusion: ["季风", "南北", "东南风", "雨带", "秦岭—淮河"],
    quiz: [
      { q: "“梅雨”主要出现在", options: ["6～7 月的长江中下游", "7～8 月的华北", "12 月的华南"], answer: "6～7 月的长江中下游" },
      { q: "拉萨的气候类型是", options: ["高原山地气候", "温带季风气候", "亚热带季风气候"], answer: "高原山地气候" },
      { q: "我国冬季气温的分布特点是", options: ["南北温差大", "全国普遍高温", "南北温差小"], answer: "南北温差大" },
    ],
    check: (seed, d) => {
      if (d.winter !== "西北风" || d.summer !== "东南风") return "季风风向不正确";
      if (RAIN_BELT_LABEL(Number(d.month)) !== rainTarget(seed)) return "雨带位置不正确";
      const types = d.types && typeof d.types === "object" ? d.types as Record<string, unknown> : {};
      if (climateCities(seed).some(c => types[c] !== classifyChina(CLIMATE_CITIES[c]))) return "气候类型判断不正确";
      return null;
    },
  },
  river: {
    tasks: 4, conclusion: ["宜昌", "湖口", "凌汛", "地上河", "水土流失"],
    quiz: [
      { q: "长江被称为“黄金水道”，主要因为", options: ["航运价值大", "水能资源少", "含沙量大"], answer: "航运价值大" },
      { q: "黄河中游流经", options: ["黄土高原", "青藏高原", "华北平原"], answer: "黄土高原" },
      { q: "“束水攻沙”是让河道变窄、水流加快，从而", options: ["把泥沙冲入大海", "让泥沙淤积更多", "让河水变清"], answer: "把泥沙冲入大海" },
    ],
    check: (seed, d) => {
      if (!Array.isArray(d.changjiang) || d.changjiang.join() !== RIVER_SPLITS.changjiang.join()) return "长江上中下游分界不正确";
      if (!Array.isArray(d.huanghe) || d.huanghe.join() !== RIVER_SPLITS.huanghe.join()) return "黄河上中下游分界不正确";
      if (d.huanghePos !== flowOrder(seed).indexOf("huanghe")) return "流量曲线判断不正确";
      return null;
    },
  },
  farm: {
    tasks: 3, conclusion: ["因地制宜", "秦岭—淮河", "水田", "旱地", "畜牧业"],
    quiz: [
      { q: "东北平原的熟制一般是", options: ["一年一熟", "两年三熟", "一年三熟"], answer: "一年一熟" },
      { q: "我国茶叶主要产在", options: ["南方低山丘陵", "内蒙古高原", "东北平原"], answer: "南方低山丘陵" },
      { q: "黄土高原的陡坡耕地应该", options: ["退耕还林还草", "继续开垦", "改成水田"], answer: "退耕还林还草" },
    ],
    check: (_, d) => same(d.assign, second(FARM_REGIONS)) && d.north === "旱地" && d.south === "水田" ? null : "农业布局判断不正确",
  },
  disaster: {
    tasks: 4, conclusion: ["东南沿海", "地震", "高处", "电梯"],
    quiz: [
      { q: "寒潮主要发生在", options: ["冬半年", "夏季", "全年均匀"], answer: "冬半年" },
      { q: "遇到泥石流时，应该", options: ["向沟谷两侧的山坡上跑", "顺着沟谷往下游跑", "躲在沟底大石后"], answer: "向沟谷两侧的山坡上跑" },
      { q: "台风来临前，正确的做法是", options: ["关好门窗，远离广告牌", "到海边看浪", "在大树下躲雨"], answer: "关好门窗，远离广告牌" },
    ],
    check: (seed, d) => {
      if (!same(d.regions, second(DISASTERS))) return "灾害多发区判断不正确";
      if (!sameSet(d.quake, Object.keys(QUAKE_ACTIONS).filter(k => QUAKE_ACTIONS[k][1]))) return "地震避险做法不正确";
      if (d.spot !== safeSpot(seed)) return "洪水避险位置不正确";
      return null;
    },
  },

  earth: {
    tasks: 4, conclusion: ["自西向东", "昼夜交替", "公转", "北回归线", "相反"],
    quiz: [
      { q: "北京时间是哪条经线的地方时？", options: ["120°E", "116°E", "0°"], answer: "120°E" },
      { q: "夏至日这一天，北半球的昼夜长短是", options: ["昼长夜短", "昼短夜长", "昼夜等长"], answer: "昼长夜短" },
      { q: "北半球是夏季时，澳大利亚是", options: ["冬季", "夏季", "春季"], answer: "冬季" },
    ],
    check: (seed, d) => {
      const term = SOLAR_TERMS[earthTerm(seed)], day = num(d.day);
      if (!(Math.abs(day - term.day) <= 2)) return "直射点的日期不正确";
      const bj = dayLength(CITIES.beijing.lat, day), sy = dayLength(CITIES.sydney.lat, day);
      if (d.longer !== longerDay(bj, sy) || !(Math.abs(num(d.bjHours) - bj) <= 0.5)) return "昼长比较不正确";
      if (!(Math.abs(localTime(CITIES.beijing.lon, num(d.utc)) - 12) <= 0.5)) return "北京还没有到正午";
      if (d.summerPos !== summerIndex(seed)) return "公转位置判断不正确";
      return null;
    },
  },
  contour: {
    tasks: 4, conclusion: ["山谷", "山脊", "陡", "鞍部", "山谷"],
    quiz: [
      { q: "等高线越密集，表示坡度", options: ["越陡", "越缓", "不变"], answer: "越陡" },
      { q: "等高线向海拔低处凸出的部位是", options: ["山脊", "山谷", "鞍部"], answer: "山脊" },
      { q: "几条等高线重合在一起的地方是", options: ["陡崖", "山峰", "盆地"], answer: "陡崖" },
    ],
    check: (seed, d) => {
      const t = makeTerrain(seed), marks = d.marks && typeof d.marks === "object" ? d.marks as Record<string, unknown> : {};
      for (const f of Object.keys(FEATURES) as Feature[]) {
        const p = marks[f];
        if (!Array.isArray(p) || p.length !== 2 || !hits(t, f, [num(p[0]), num(p[1])] as Pt)) return `${FEATURES[f]}的位置不正确`;
      }
      if (d.profile !== profileOptions(seed).indexOf(0)) return "剖面图选择不正确";
      if (d.river !== "valley") return "河流位置判断不正确";
      if (d.route !== gentlestRoute(t)) return "登山路线不是最缓的";
      return null;
    },
  },
};
