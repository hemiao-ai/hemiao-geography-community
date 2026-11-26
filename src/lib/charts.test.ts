import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClimateChart, PrecipChart, TempChart } from "../components/geo/Charts";

const labelsAt = (html: string, x: number) => [...html.matchAll(new RegExp(`<text x="${x}" y="[^"]+"[^>]*>(-?\\d+(?:\\.\\d+)?)<\\/text>`, "g"))].map(m => Number(m[1]));
describe("图表坐标刻度", () => {
  it("气温刻度为 5 的倍数", () => {
    const html = renderToStaticMarkup(createElement(TempChart, { values: Array(12).fill(null), range: [-15, 25] }));
    const ticks = labelsAt(html, 45); expect(ticks).toContain(0); expect(ticks.length).toBeGreaterThan(4); expect(ticks.every(v => v % 5 === 0)).toBe(true);
  });
  it("降水刻度为 50 或 100 的倍数", () => {
    for (const max of [100, 250, 350, 600]) {
      const html = renderToStaticMarkup(createElement(PrecipChart, { values: Array(12).fill(null), max }));
      const ticks = labelsAt(html, 45); expect(ticks[0]).toBe(0); expect(ticks.length).toBeGreaterThan(1); expect(ticks.every(v => v % 50 === 0)).toBe(true);
    }
  });
  it("新气候图有 10℃ 刻度和 15℃ 参考线，旧版刻度不变", () => {
    const data = { t: [-5, 0, 6, 10, 20, 25, 29, 28, 23, 14, 5, 0], p: [20, 25, 30, 40, 50, 75, 100, 80, 50, 40, 30, 25] };
    const nice = renderToStaticMarkup(createElement(ClimateChart, { ...data, niceTicks: true }));
    expect(labelsAt(nice, 26)).toEqual([-10, 0, 10, 20, 30]); expect(labelsAt(nice, 254)).toEqual([50, 100]); expect(nice).toContain("15 ℃");
    const old = renderToStaticMarkup(createElement(ClimateChart, data));
    expect(labelsAt(old, 26)).toEqual([30, 10, -10]); expect(labelsAt(old, 254)).toEqual([100, 200, 300]); expect(old).not.toContain("15 ℃");
  });
});
