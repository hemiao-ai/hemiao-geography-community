import { describe, expect, it } from "vitest";
import { STATIONS } from "./climate-data";
import { classifyStation, RAIN_SEASON, snapRain, snapTemp, stats } from "./climate";

describe("气候统计和分类", () => {
  it("求气温年较差、年降水与极值月份", () => {
    expect(stats(STATIONS.beijing)).toEqual({ maxT: 27.2, minT: -2.7, range: 29.9, annualP: 528, hottest: 7, coldest: 1 });
    expect(stats(STATIONS.singapore).annualP).toBe(2113.3);
  });
  it("11 个已标注测站与分类流程一致", () => {
    const stations = Object.values(STATIONS).filter(s => "type" in s);
    expect(stations).toHaveLength(11);
    for (const s of stations) expect(classifyStation(s), s.name).toBe(s.type);
  });
  it("按半球交换夏季和冬季", () => {
    const s = STATIONS.algiers;
    expect(classifyStation({ ...s, at: [s.at[0], -s.at[1]] })).toBe("subtropicalMonsoon");
  });
  it("气温与降水吸附", () => {
    expect(snapTemp(-2.26)).toBe(-2.5); expect(snapTemp(12.24)).toBe(12);
    expect(snapRain(12)).toBe(10); expect(snapRain(13)).toBe(15);
  });
  it("降水季节结论与数据一致", () => {
    for (const key of Object.keys(RAIN_SEASON) as (keyof typeof RAIN_SEASON)[]) {
      const p = STATIONS[key].p, annual = p.reduce((a, b) => a + b, 0), summer = (p[5] + p[6] + p[7]) / annual, winter = (p[11] + p[0] + p[1]) / annual;
      if (RAIN_SEASON[key] === "summer") expect(summer, key).toBeGreaterThanOrEqual(0.4);
      if (key === "algiers") { expect(winter).toBeGreaterThanOrEqual(0.35); expect(summer).toBeLessThan(0.15); }
      if (key === "london") expect(Math.max(...p) / Math.min(...p)).toBeLessThan(2);
    }
  });
});
