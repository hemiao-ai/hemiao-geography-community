import type { LessonSpec } from "./lessons";
import { CLIMATE_TYPES, STATIONS, type ClimateType, type StationKey } from "./climate-data";
import { RAIN_SEASON, stats } from "./climate";

export type G7aClimateType = "weather" | "temperature" | "precipitation" | "climate";
export const shuffleClimate = <T,>(list: readonly T[], seed: number) => { const a = [...list]; let s = Math.abs(Math.floor(seed)) % 2147483646 + 1; for (let i = a.length - 1; i > 0; i--) { s = s * 16807 % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = <T,>(a: readonly T[], seed: number) => a[Math.abs(Math.floor(seed)) % a.length];
export const WEATHER_KIND = { a: ["今天晴转多云", "weather"], b: ["昆明四季如春", "climate"], c: ["明天有小到中雪", "weather"], d: ["海南岛终年如夏", "climate"], e: ["夜里下了一场冰雹", "weather"], f: ["长江中下游地区夏季高温多雨", "climate"] } as const;
export const SYMBOLS = { sunny: "晴", cloudy: "多云", overcast: "阴", lightRain: "小雨", moderateRain: "中雨", heavyRain: "大雨", storm: "暴雨", thunder: "雷阵雨", sleet: "雨夹雪", lightSnow: "小雪", moderateSnow: "中雪", heavySnow: "大雪", hail: "冰雹", fog: "雾", frost: "霜冻", dust: "沙尘" };
export type SymbolKey = keyof typeof SYMBOLS;
export const symbolTargets = (seed: number) => shuffleClimate(Object.keys(SYMBOLS) as SymbolKey[], seed + 13).slice(0, 6);
const TURN_PAIRS: [SymbolKey, SymbolKey][] = [["sunny", "cloudy"], ["lightRain", "moderateRain"], ["cloudy", "overcast"], ["lightSnow", "moderateSnow"]];
export const turnPair = (seed: number) => pick(TURN_PAIRS, Math.floor(Math.abs(seed) / 7));
export const turnAnswer = (seed: number) => { const [a, b] = turnPair(seed); return `${SYMBOLS[a]}转${SYMBOLS[b]}`; };
export const WIND_DIRS = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"];
export const windRule = (seed: number) => ({ dir: pick(WIND_DIRS, seed), level: Math.abs(Math.floor(seed / 8)) % 8 + 1 });
export const FORECASTS = { rain: { symbol: "moderateRain" as const, wind: 2, temp: "18～23 ℃" }, calm: { symbol: "sunny" as const, wind: 1, temp: "19～27 ℃" }, breezy: { symbol: "cloudy" as const, wind: 4, temp: "17～24 ℃" } };
export const TEMP_STATIONS = ["beijing", "harbin", "urumqi", "moscow"] as const;
export const tempStation = (seed: number) => pick(TEMP_STATIONS, Math.floor(Math.abs(seed) / 7));
export const rainStation = (seed: number) => pick(Object.keys(RAIN_SEASON) as (keyof typeof RAIN_SEASON)[], Math.floor(Math.abs(seed) / 11));
const r1 = (n: number) => Math.round(n * 10) / 10;
export function dailyRule(seed: number) {
  const min = 8 + Math.abs(Math.floor(seed)) % 13, range = 6 + Math.abs(Math.floor(seed / 13)) % 7;
  const value = (hour: number) => { const since = (hour - 6 + 24) % 24, factor = since <= 8 ? (1 - Math.cos(Math.PI * since / 8)) / 2 : (1 + Math.cos(Math.PI * (since - 8) / 16)) / 2; return min + range * factor; };
  const obs = [2, 8, 14, 20].map(h => r1(value(h)));
  return { min, range, value, obs, mean: obs.reduce((a, b) => a + b, 0) / 4 };
}
export const isoRule = (seed: number) => ({ dir: Math.abs(seed) % 2 ? "由北向南" : "由南向北", dense: Math.floor(Math.abs(seed) / 2) % 2 ? "乙" : "甲", center: Math.floor(Math.abs(seed) / 4) % 2 ? "低温中心" : "高温中心" });
export const sandStart = (seed: number) => 18 + Math.abs(Math.floor(seed / 17)) % 7;
export const gaugeLevel = (seed: number) => 3 + Math.abs(Math.floor(seed)) % 46;
export const wettestMonths = (key: keyof typeof RAIN_SEASON) => STATIONS[key].p.map((p, i) => ({ p, month: i + 1 })).sort((a, b) => b.p - a.p || a.month - b.month).slice(0, 3).map(x => x.month);
export const rainPairs = (seed: number) => Object.fromEntries(["equator", "tropic", "midlat"].map((k, i) => [k, Math.floor(Math.abs(seed) / (2 ** i)) % 2 ? "乙" : "甲"]));
export const ZONES = { rainforest: "tropic", savanna: "tropic", desert: "tropic", subtropicalMonsoon: "east", temperateMonsoon: "east", continental: "inland", oceanic: "west", mediterranean: "west", polar: "polar" };
export const FACTORS = { kili: ["乞力马扎罗山位于赤道附近，山顶却终年积雪", "terrain"], sgmo: ["新加坡终年炎热，莫斯科冬季漫长寒冷", "latitude"], inland: ["亚欧大陆内部比同纬度的西欧沿海降水少得多", "sea"] } as const;
export const CLIMATE_SCENES = { rainforest: "茂密的常绿森林", savanna: "高草和稀疏的树木", desert: "荒漠，植被稀少", temperateMonsoon: "四季分明的落叶阔叶林", polar: "冰雪覆盖或苔原" };
export function climateStations(seed: number) {
  const keys = (Object.keys(STATIONS) as StationKey[]).filter(k => "type" in STATIONS[k]);
  return shuffleClimate(keys, seed + 89).slice(0, 3);
}
export const lapseRule = (seed: number) => {
  const n = Math.abs(Math.floor(seed)), base = n % 6 * 100, temp = 20 + Math.floor(n / 6) % 9, height = 1000 + Math.floor(n / 54) % 5 * 500;
  return { base, temp, height, answer: r1(temp - height / 100 * 0.6) };
};
export const pairsAnswer = (o: Record<string, readonly [string, string]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1]]));
const obj = (x: unknown) => x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : {};
const same = (x: unknown, want: Record<string, string>) => { const v = obj(x); return Object.keys(v).length === Object.keys(want).length && Object.entries(want).every(([k, a]) => v[k] === a); };
const close = (x: unknown, v: number, tol: number) => typeof x === "number" && Number.isFinite(x) && Math.abs(x - v) <= tol + 1e-9;
const series = (x: unknown, values: number[], tol: (v: number) => number) => Array.isArray(x) && x.length === 12 && values.every((v, i) => close(x[i], v, tol(v)));
const set = (x: unknown, want: number[]) => Array.isArray(x) && x.length === want.length && want.every(v => x.includes(v));
const quiz = (...q: [string, string[], string][]) => q.map(([q, options, answer]) => ({ q, options, answer }));

export const G7A_CLIMATE_LESSONS: Record<G7aClimateType, LessonSpec> = {
  weather: {
    tasks: 4, conclusion: ["短时间里", "降水", "来向", "强"],
    quiz: quiz(["“昆明四季如春”描述的是", ["气候", "天气", "天气预报"], "气候"], ["刮北风时，风是从哪里吹来的？", ["北方", "南方", "东方"], "北方"], ["下列哪种天气最适合晾晒衣物？", ["晴，微风", "小雨", "阴转中雨"], "晴，微风"]),
    check: (seed, d) => {
      if (!same(d.kind, pairsAnswer(WEATHER_KIND))) return "天气与气候分类不正确";
      if (!same(d.symbols, Object.fromEntries(symbolTargets(seed).map(k => [k, SYMBOLS[k]])))) return "天气符号判断不正确";
      if (d.turn !== turnAnswer(seed)) return "天气变化符号判断不正确";
      const w = obj(d.wind), want = windRule(seed); if (w.dir !== want.dir || w.level !== want.level) return "风向或风力判断不正确";
      const p = obj(d.plan); if (p.kite !== "breezy" || p.umbrella !== "rain") return "天气活动安排不正确";
      return null;
    },
  },
  temperature: {
    tasks: 4, conclusion: ["午后 2 时", "7", "气温年较差", "降低", "低"],
    quiz: quiz(["等温线密集的地区，气温差异", ["大", "小", "没有差异"], "大"], ["气象观测时，百叶箱里的温度计离地面约", ["1.5 米", "0.5 米", "3 米"], "1.5 米"], ["北半球海洋上气温最高的月份通常是", ["8 月", "7 月", "1 月"], "8 月"]),
    check: (seed, d) => {
      const daily = obj(d.daily), rule = dailyRule(seed); if (daily.peak !== 14 || !close(daily.mean, rule.mean, 0.1) || !close(daily.range, rule.range, 0.2)) return "日气温计算不正确";
      const station = STATIONS[tempStation(seed)], s = stats(station); if (!series(d.curve, station.t, () => 1)) return "气温曲线描点不正确";
      const a = obj(d.annual); if (!close(a.max, s.maxT, 0.1) || !close(a.min, s.minT, 0.1) || !close(a.range, s.range, 0.2)) return "气温年变化计算不正确";
      if (!same(d.iso, isoRule(seed))) return "等温线判断不正确";
      const sand = obj(d.sand); if (!close(sand.water, 3, 0.1) || !close(sand.sand, 12, 0.1) || sand.jan !== "低" || sand.jul !== "高") return "水沙实验判断不正确";
      return null;
    },
  },
  precipitation: {
    tasks: 3, conclusion: ["毫米", "多", "东岸", "内陆"],
    quiz: quiz(["雨、雪、冰雹等统称为", ["降水", "降雨", "天气"], "降水"], ["表示一个地区一年内降水的季节变化，常用", ["各月降水量柱状图", "气温曲线图", "等高线地形图"], "各月降水量柱状图"], ["某日降水量为 50 毫米，平铺在地面上的水深约", ["5 厘米", "50 厘米", "5 米"], "5 厘米"]),
    check: (seed, d) => {
      if (!close(d.gauge, gaugeLevel(seed), 1)) return "雨量筒读数不正确";
      const key = rainStation(seed), station = STATIONS[key]; if (!series(d.bars, station.p, p => Math.max(10, p * 0.1))) return "降水柱状图不正确";
      const r = obj(d.rain); if (!close(r.annual, stats(station).annualP, stats(station).annualP * 0.05) || !set(r.wettest, wettestMonths(key)) || r.season !== RAIN_SEASON[key]) return "降水年变化判断不正确";
      if (!same(d.pairs, rainPairs(seed))) return "世界降水分布判断不正确";
      return null;
    },
  },
  climate: {
    tasks: 4, conclusion: ["降水", "南、北回归线", "干旱", "0.6 ℃"],
    quiz: quiz(["全年高温多雨的气候类型是", ["热带雨林气候", "热带沙漠气候", "地中海气候"], "热带雨林气候"], ["冬季温和多雨、夏季炎热干燥的气候类型是", ["地中海气候", "温带季风气候", "温带海洋性气候"], "地中海气候"], ["下列不属于影响气候主要因素的是", ["人口数量", "纬度位置", "海陆位置"], "人口数量"]),
    check: (seed, d) => {
      const types = Object.fromEntries(climateStations(seed).map(k => [k, (STATIONS[k] as { type: ClimateType }).type]));
      if (!same(d.types, types)) return "气候类型判断不正确";
      if (!same(d.zones, ZONES)) return "气候类型分布不正确";
      if (!same(d.factors, pairsAnswer(FACTORS))) return "气候影响因素判断不正确";
      if (!close(d.lapse, lapseRule(seed).answer, 0.2)) return "山顶气温计算不正确";
      if (!same(d.scenes, CLIMATE_SCENES)) return "气候与景观匹配不正确";
      return null;
    },
  },
};
export const climateNames = Object.fromEntries(Object.entries(ZONES).map(([k]) => [k, CLIMATE_TYPES[k as ClimateType]]));
