import { describe, expect, it } from "vitest";
import { STATIONS, type ClimateType } from "./climate-data";
import { RAIN_SEASON, stats } from "./climate";
import { CLIMATE_SCENES, climateStations, dailyRule, FACTORS, G7A_CLIMATE_LESSONS, gaugeLevel, isoRule, lapseRule, pairsAnswer, rainPairs, rainStation, SYMBOLS, symbolTargets, tempStation, turnAnswer, WEATHER_KIND, wettestMonths, windRule, ZONES, type G7aClimateType } from "./lessons-g7a-climate";
import { verifyLesson } from "./verify";

function answers(type: G7aClimateType, seed: number): Record<string, unknown> {
  switch (type) {
    case "weather": return { kind: pairsAnswer(WEATHER_KIND), symbols: Object.fromEntries(symbolTargets(seed).map(k => [k, SYMBOLS[k]])), turn: turnAnswer(seed), wind: windRule(seed), plan: { kite: "breezy", umbrella: "rain" } };
    case "temperature": { const day = dailyRule(seed), st = STATIONS[tempStation(seed)], s = stats(st); return { daily: { peak: 14, mean: day.mean, range: day.range }, curve: st.t, annual: { max: s.maxT, min: s.minT, range: s.range }, iso: isoRule(seed), sand: { water: 3, sand: 12, jan: "低", jul: "高" } }; }
    case "precipitation": { const key = rainStation(seed), st = STATIONS[key]; return { gauge: gaugeLevel(seed), bars: st.p, rain: { annual: stats(st).annualP, wettest: wettestMonths(key), season: RAIN_SEASON[key] }, pairs: rainPairs(seed) }; }
    case "climate": return { types: Object.fromEntries(climateStations(seed).map(k => [k, (STATIONS[k] as { type: ClimateType }).type])), zones: ZONES, factors: pairsAnswer(FACTORS), lapse: lapseRule(seed).answer, scenes: CLIMATE_SCENES };
  }
}
describe("七上天气与气候验算", () => {
  const errors: Record<G7aClimateType, Record<string, string>> = {
    weather: { kind: "天气与气候分类不正确", symbols: "天气符号判断不正确", turn: "天气变化符号判断不正确", wind: "风向或风力判断不正确", plan: "天气活动安排不正确" },
    temperature: { daily: "日气温计算不正确", curve: "气温曲线描点不正确", annual: "气温年变化计算不正确", iso: "等温线判断不正确", sand: "水沙实验判断不正确" },
    precipitation: { gauge: "雨量筒读数不正确", bars: "降水柱状图不正确", rain: "降水年变化判断不正确", pairs: "世界降水分布判断不正确" },
    climate: { types: "气候类型判断不正确", zones: "气候类型分布不正确", factors: "气候影响因素判断不正确", lapse: "山顶气温计算不正确", scenes: "气候与景观匹配不正确" },
  };
  for (const type of Object.keys(G7A_CLIMATE_LESSONS) as G7aClimateType[]) it(`${type} 的 100 个种子及各子项`, () => {
    const spec = G7A_CLIMATE_LESSONS[type];
    for (let seed = 0; seed < 100; seed++) {
      const data = answers(type, seed);
      expect(spec.check(seed, data), `${type} ${seed}`).toBeNull();
      for (const key of Object.keys(data)) expect(spec.check(seed, { ...data, [key]: null }), `${type} ${seed} ${key}`).toBe(errors[type][key]);
    }
    expect(verifyLesson(type, 42, { done: spec.tasks, data: answers(type, 42), conclusion: spec.conclusion, quiz: spec.quiz.map(q => q.answer), mistakes: 0 }).stars).toBe(3);
  });
});
