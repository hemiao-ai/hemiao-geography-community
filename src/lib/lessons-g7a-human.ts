import type { LessonSpec } from "./lessons";
import { shuffle } from "./lessons-g7a";
import { ADAPT, CARGO7, COOP, CUSTOMS, DEVELOPED, DEVELOPING, FOODS, GEO_TOOLS, HOUSE_ANSWER, MATERIALS, POP_TREND, POP_YEARS, QUESTIONS, RELIGIONS, ROUTE_COUNTRIES, SPAN_COUNTRIES, SPARSE, UN_LANGUAGES } from "./world-human";

export type G7aHumanType = "population7" | "culture" | "develop" | "intro";
const n = (seed: number) => Math.abs(Math.floor(seed));
export const pairAnswers = (o: Record<string, readonly [string, string]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1]]));
export const intervalYears = POP_YEARS.slice(1).map((v, i) => v - POP_YEARS[i]);
export const intervalTargets = (seed: number) => shuffle([1, 2, 3, 4, 5, 6, 7], seed + 17).slice(0, 3);
export const growthRule = (seed: number) => {
  const v = n(seed), birth = (10 + v % 21) / 10, death = (5 + Math.floor(v / 21) % 8) / 10, inbound = Math.floor(v / 168) % 2 === 0;
  return { birth, death, natural: Math.round((birth - death) * 10) / 10, inbound, compare: inbound ? "高" : "低" };
};
export const densityRule = (seed: number) => {
  const v = n(seed), population = 100 + v % 39 * 50, area = 1 + Math.floor(v / 39) % 50;
  return { population, area, density: Math.round(population / area) };
};
export const housingLabels = (seed: number) => n(seed) % 2 ? { 甲: "cairo", 乙: "yangon" } : { 甲: "yangon", 乙: "cairo" };
export const hdiRule = (seed: number) => {
  const v = n(seed), high = { income: 35000 + v % 26 * 1000, life: 78 + Math.floor(v / 26) % 9, school: 12 + Math.floor(v / 234) % 6 };
  const low = { income: 2000 + v % 11 * 1000, life: 60 + Math.floor(v / 11) % 13, school: 5 + Math.floor(v / 143) % 5 };
  return v % 2 ? { 甲: low, 乙: high, answer: "乙" } : { 甲: high, 乙: low, answer: "甲" };
};
export const devTargets = (seed: number) => shuffle([...shuffle(DEVELOPED, seed + 31).slice(0, 3), ...shuffle(DEVELOPING, seed + 41).slice(0, 3)], seed + 43);
export const cargoTargets = (seed: number) => shuffle(Object.keys(CARGO7) as (keyof typeof CARGO7)[], seed + 53).slice(0, 3);
const obj = (x: unknown) => x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : {};
const same = (x: unknown, want: Record<string, string>) => { const v = obj(x); return Object.keys(v).length === Object.keys(want).length && Object.entries(want).every(([k, a]) => v[k] === a); };
const set = (x: unknown, want: readonly string[]) => Array.isArray(x) && x.length === want.length && want.every(v => x.includes(v));
const order = (x: unknown, want: readonly string[]) => Array.isArray(x) && x.length === want.length && want.every((v, i) => x[i] === v);
const close = (x: unknown, value: number, tol: number) => typeof x === "number" && Number.isFinite(x) && Math.abs(x - value) <= tol + 1e-9;
const quiz = (...q: [string, string[], string][]) => q.map(([q, options, answer]) => ({ q, options, answer }));
export const G7A_HUMAN_LESSONS: Record<G7aHumanType, LessonSpec> = {
  population7: {
    tasks: 4, conclusion: ["增长", "死亡率", "平方千米", "稀疏", "没有"],
    quiz: quiz(["下列属于世界人口稠密地区的是", ["亚洲东部和南部", "撒哈拉沙漠", "南极洲"], "亚洲东部和南部"], ["人口增长过快可能带来的问题是", ["就业困难、资源消耗多", "劳动力短缺", "养老负担过重"], "就业困难、资源消耗多"], ["某地每年迁入的人口多于迁出的人口，它的人口增长率会", ["高于自然增长率", "低于自然增长率", "等于自然增长率"], "高于自然增长率"]),
    check: (seed, d) => {
      const v = obj(d.intervals), targets = intervalTargets(seed); if (Object.keys(v).length !== 3 || targets.some(i => v[i] !== intervalYears[i - 1])) return "人口增长间隔计算不正确";
      if (d.trend !== POP_TREND) return "人口增长趋势判断不正确";
      const growth = obj(d.growth), rule = growthRule(seed); if (!close(growth.natural, rule.natural, .01)) return "人口自然增长率计算不正确";
      if (growth.compare !== rule.compare) return "人口增长率与自然增长率的比较不正确";
      if (!close(d.density, densityRule(seed).density, 1)) return "人口密度计算不正确";
      if (!same(d.sparse, Object.fromEntries(Object.entries(SPARSE).map(([k, x]) => [k, x.reason])))) return "人口稀少原因判断不正确";
      return null;
    },
  },
  culture: {
    tasks: 4, conclusion: ["汉语", "英语", "佛教", "就地取材"],
    quiz: quiz(["下列不属于联合国工作语言的是", ["德语", "阿拉伯语", "西班牙语"], "德语"], ["亚洲东部和东南部的主要粮食作物是", ["水稻", "小麦", "玉米"], "水稻"], ["湿热地区的传统民居大多", ["底层架空、墙体透风", "墙体厚、窗户小", "用冰块砌成"], "底层架空、墙体透风"]),
    check: (_seed, d) => {
      const lang = obj(d.lang); if (lang.most !== "汉语") return "使用人数最多的语言判断不正确";
      if (lang.widest !== "英语") return "使用范围最广的语言判断不正确";
      if (!set(lang.un, UN_LANGUAGES)) return "联合国工作语言选择不正确";
      if (!same(d.religion, pairAnswers(RELIGIONS))) return "宗教起源地判断不正确";
      if (!same(d.custom, pairAnswers(CUSTOMS))) return "衣食住行与环境匹配不正确";
      if (!same(d.food, pairAnswers(FOODS))) return "主食与地区匹配不正确";
      if (!same(d.houses, HOUSE_ANSWER)) return "民居与气候匹配不正确";
      if (!same(d.material, MATERIALS)) return "民居材料来源判断不正确";
      return null;
    },
  },
  develop: {
    tasks: 4, conclusion: ["发展中国家", "南南合作", "交通运输", "国际合作"],
    quiz: quiz(["人类发展指数的计算指标不包括", ["国土面积", "预期寿命", "受教育程度"], "国土面积"], ["与海运相比，铁路运输的特点是", ["运时少、运量小", "运时多、运量大", "运价更低"], "运时少、运量小"], ["2013 年我国提出的国际合作倡议是", ["“一带一路”倡议", "南北对话", "《蒙特利尔议定书》"], "“一带一路”倡议"]),
    check: (seed, d) => {
      if (d.hdi !== hdiRule(seed).answer) return "人类发展指数比较不正确";
      if (!same(d.dev, Object.fromEntries(devTargets(seed).map(k => [k, DEVELOPED.includes(k) ? "developed" : "developing"])))) return "国家发展水平分类不正确";
      if (!order(d.route, ROUTE_COUNTRIES)) return "中欧班列国家顺序不正确";
      if (!set(d.span, SPAN_COUNTRIES)) return "地跨两洲国家选择不正确";
      if (!same(d.mode, Object.fromEntries(cargoTargets(seed).map(k => [k, CARGO7[k][1]])))) return "运输方式选择不正确";
      if (!same(d.coop, pairAnswers(COOP))) return "国际合作方式匹配不正确";
      return null;
    },
  },
  intro: {
    tasks: 3, conclusion: ["人类活动", "图表", "和谐共生"],
    quiz: quiz(["“上知天文，下知地理”形容一个人", ["知识渊博", "喜欢旅行", "擅长运动"], "知识渊博"], ["要了解一片区域的实时状态，可以借助", ["遥感影像", "历史小说", "字典"], "遥感影像"], ["下列不是学好地理的方法的是", ["只背课本，不观察生活", "善于观察，发现问题", "联系实际，勤于实践"], "只背课本，不观察生活"]),
    check: (_seed, d) => {
      if (!same(d.questions, pairAnswers(QUESTIONS))) return "地理问题分类不正确";
      if (!same(d.adapt, pairAnswers(ADAPT))) return "人地关系匹配不正确";
      if (!same(d.tools, pairAnswers(GEO_TOOLS))) return "地理工具选择不正确";
      return null;
    },
  },
};
