import { describe, expect, it } from "vitest";
import { ADAPT, CARGO7, COOP, CUSTOMS, DEVELOPED, FOODS, GEO_TOOLS, HOUSE_ANSWER, MATERIALS, POP_TREND, QUESTIONS, RELIGIONS, ROUTE_COUNTRIES, SPAN_COUNTRIES, SPARSE, UN_LANGUAGES } from "./world-human";
import { cargoTargets, densityRule, devTargets, G7A_HUMAN_LESSONS, growthRule, hdiRule, intervalTargets, intervalYears, pairAnswers, type G7aHumanType } from "./lessons-g7a-human";
import { verifyLesson } from "./verify";

function answers(type: G7aHumanType, seed: number): Record<string, unknown> {
  switch (type) {
    case "population7": { const g = growthRule(seed); return { intervals: Object.fromEntries(intervalTargets(seed).map(i => [i, intervalYears[i - 1]])), trend: POP_TREND, growth: { natural: g.natural, compare: g.compare }, density: densityRule(seed).density, sparse: Object.fromEntries(Object.entries(SPARSE).map(([k, v]) => [k, v.reason])) }; }
    case "culture": return { lang: { most: "汉语", widest: "英语", un: UN_LANGUAGES }, religion: pairAnswers(RELIGIONS), custom: pairAnswers(CUSTOMS), food: pairAnswers(FOODS), houses: HOUSE_ANSWER, material: MATERIALS };
    case "develop": return { hdi: hdiRule(seed).answer, dev: Object.fromEntries(devTargets(seed).map(k => [k, DEVELOPED.includes(k) ? "developed" : "developing"])), route: ROUTE_COUNTRIES, span: SPAN_COUNTRIES, mode: Object.fromEntries(cargoTargets(seed).map(k => [k, CARGO7[k][1]])), coop: pairAnswers(COOP) };
    case "intro": return { questions: pairAnswers(QUESTIONS), adapt: pairAnswers(ADAPT), tools: pairAnswers(GEO_TOOLS) };
  }
}
describe("七上人文课程验算", () => {
  const errors: Record<G7aHumanType, Record<string, string>> = {
    population7: { intervals: "人口增长间隔计算不正确", trend: "人口增长趋势判断不正确", growth: "人口自然增长率计算不正确", density: "人口密度计算不正确", sparse: "人口稀少原因判断不正确" },
    culture: { lang: "使用人数最多的语言判断不正确", religion: "宗教起源地判断不正确", custom: "衣食住行与环境匹配不正确", food: "主食与地区匹配不正确", houses: "民居与气候匹配不正确", material: "民居材料来源判断不正确" },
    develop: { hdi: "人类发展指数比较不正确", dev: "国家发展水平分类不正确", route: "中欧班列国家顺序不正确", span: "地跨两洲国家选择不正确", mode: "运输方式选择不正确", coop: "国际合作方式匹配不正确" },
    intro: { questions: "地理问题分类不正确", adapt: "人地关系匹配不正确", tools: "地理工具选择不正确" },
  };
  for (const type of Object.keys(G7A_HUMAN_LESSONS) as G7aHumanType[]) it(`${type} 的 100 个种子及各子项`, () => {
    const spec = G7A_HUMAN_LESSONS[type];
    for (let seed = 0; seed < 100; seed++) {
      const data = answers(type, seed); expect(spec.check(seed, data), `${type} ${seed}`).toBeNull();
      for (const key of Object.keys(data)) expect(spec.check(seed, { ...data, [key]: null }), `${type} ${seed} ${key}`).toBe(errors[type][key]);
    }
    expect(verifyLesson(type, 42, { done: spec.tasks, data: answers(type, 42), conclusion: spec.conclusion, quiz: spec.quiz.map(q => q.answer), mistakes: 0 }).stars).toBe(3);
  });
  it("人口里程碑间隔正确", () => expect(intervalYears).toEqual([123, 33, 14, 13, 12, 12, 11]));
  it("人口增长与语言子项分别验算", () => {
    const pop = answers("population7", 42), growth = pop.growth as Record<string, unknown>;
    expect(G7A_HUMAN_LESSONS.population7.check(42, { ...pop, growth: { ...growth, compare: "错误" } })).toBe("人口增长率与自然增长率的比较不正确");
    const culture = answers("culture", 42), lang = culture.lang as Record<string, unknown>;
    expect(G7A_HUMAN_LESSONS.culture.check(42, { ...culture, lang: { ...lang, widest: "错误" } })).toBe("使用范围最广的语言判断不正确");
    expect(G7A_HUMAN_LESSONS.culture.check(42, { ...culture, lang: { ...lang, un: [] } })).toBe("联合国工作语言选择不正确");
  });
  it("人口数据覆盖取值范围及容差边界", () => {
    const births = new Set<number>(), deaths = new Set<number>(), areas = new Set<number>(), migrations = new Set<boolean>();
    for (let seed = 0; seed < 2000; seed++) {
      const g = growthRule(seed), d = densityRule(seed); births.add(g.birth); deaths.add(g.death); areas.add(d.area); migrations.add(g.inbound);
      const a = answers("population7", seed);
      expect(G7A_HUMAN_LESSONS.population7.check(seed, { ...a, growth: { natural: g.natural + .01, compare: g.compare }, density: d.density + 1 })).toBeNull();
      expect(G7A_HUMAN_LESSONS.population7.check(seed, { ...a, growth: { natural: g.natural + .02, compare: g.compare } })).toBe("人口自然增长率计算不正确");
      expect(G7A_HUMAN_LESSONS.population7.check(seed, { ...a, density: d.density + 2 })).toBe("人口密度计算不正确");
    }
    expect(births.size).toBe(21); expect(deaths.size).toBe(8); expect(areas.size).toBe(50); expect(migrations.size).toBe(2);
  });
  it("每个种子均有一国三项指标更高", () => {
    for (let seed = 0; seed < 1000; seed++) {
      const r = hdiRule(seed), high = r[r.answer as "甲" | "乙"], low = r[r.answer === "甲" ? "乙" : "甲"];
      expect(high.income).toBeGreaterThan(low.income); expect(high.life).toBeGreaterThan(low.life); expect(high.school).toBeGreaterThan(low.school);
    }
  });
});
