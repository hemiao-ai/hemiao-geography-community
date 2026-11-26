import type { ClimateType, Station } from "./climate-data";

const HIGHLAND_ALT = 3000, POLAR_MAX = 10, DESERT_RAIN = 250, DESERT_MIN = 10, TROPICAL_MIN = 15;
const RAINFOREST_MONTH = 60, MONSOON_RAIN = 1500, OCEANIC_MAX = 22, CONTINENTAL_RAIN = 400;
const TEMPERATE_MIN = 0, DRY_SUMMER_RATIO = 0.5;
const round1 = (x: number) => Math.round(x * 10) / 10;
export function stats(s: Station) {
  const maxT = Math.max(...s.t), minT = Math.min(...s.t);
  return { maxT, minT, range: round1(maxT - minT), annualP: round1(s.p.reduce((a, b) => a + b, 0)), hottest: s.t.indexOf(maxT) + 1, coldest: s.t.indexOf(minT) + 1 };
}
export function classifyStation(s: Station): ClimateType {
  const { maxT, minT, annualP } = stats(s);
  const sum = (months: number[]) => months.reduce((a, month) => a + s.p[month - 1], 0);
  const summer = sum(s.at[1] >= 0 ? [6, 7, 8] : [12, 1, 2]), winter = sum(s.at[1] >= 0 ? [12, 1, 2] : [6, 7, 8]);
  if (s.alt >= HIGHLAND_ALT) return "highland";
  if (maxT < POLAR_MAX) return "polar";
  if (annualP < DESERT_RAIN && minT > DESERT_MIN) return "desert";
  if (minT >= TROPICAL_MIN) return s.p.every(p => p >= RAINFOREST_MONTH) ? "rainforest" : annualP >= MONSOON_RAIN ? "tropicalMonsoon" : "savanna";
  if (minT >= TEMPERATE_MIN) return summer < winter * DRY_SUMMER_RATIO ? "mediterranean" : maxT < OCEANIC_MAX ? "oceanic" : "subtropicalMonsoon";
  return annualP < CONTINENTAL_RAIN ? "continental" : "temperateMonsoon";
}
export const snapTemp = (value: number) => Math.round(value * 2) / 2;
export const snapRain = (value: number) => Math.round(value / 5) * 5;
export const RAIN_SEASON = { beijing: "summer", shanghai: "summer", bamako: "summer", london: "even", algiers: "winter" } as const;
