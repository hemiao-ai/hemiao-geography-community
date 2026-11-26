/** 地球的运动：太阳直射点、昼长、正午太阳高度、地方时。纯函数，不依赖 DOM。按 365 天计，不考虑均时差。 */
const RAD = Math.PI / 180;
export const TILT = 23.44;

/** 太阳直射点纬度（°），n 为一年中的第几天（1～365） */
export const declination = (n: number) => TILT * Math.sin((2 * Math.PI * (284 + n)) / 365);

/** 昼长（小时）：极昼 24，极夜 0 */
export function dayLength(lat: number, n: number) {
  const c = -Math.tan(lat * RAD) * Math.tan(declination(n) * RAD);
  if (c <= -1) return 24;
  if (c >= 1) return 0;
  return (2 * Math.acos(c)) / RAD / 15;
}
/** 正午太阳高度（°） */
export const noonAltitude = (lat: number, n: number) => 90 - Math.abs(lat - declination(n));
/** 地方时（0～24 小时）：utc 为世界时（0°经线的地方时） */
export const localTime = (lon: number, utc: number) => (((utc + lon / 15) % 24) + 24) % 24;
/** 太阳直射点经度：地方时 12 点的经线 */
export const subsolarLon = (utc: number) => { const l = (12 - utc) * 15; return ((((l + 180) % 360) + 360) % 360) - 180; };
/** 太阳高度（°），大于 0 为白天 */
export function solarElevation(lat: number, lon: number, n: number, utc: number) {
  const d = declination(n) * RAD, h = (localTime(lon, utc) - 12) * 15 * RAD, p = lat * RAD;
  return Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h)) / RAD;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function dateOf(n: number) { let m = 0, d = n; while (d > MONTH_DAYS[m]) { d -= MONTH_DAYS[m]; m++; } return { month: m + 1, day: d }; }
export const dateLabel = (n: number) => { const { month, day } = dateOf(n); return `${month} 月 ${day} 日`; };
export const SOLAR_TERMS = { spring: { name: "春分", day: 80, lat: 0, line: "赤道" }, summer: { name: "夏至", day: 172, lat: TILT, line: "北回归线" }, autumn: { name: "秋分", day: 265, lat: 0, line: "赤道" }, winter: { name: "冬至", day: 355, lat: -TILT, line: "南回归线" } } as const;
export type Term = keyof typeof SOLAR_TERMS;
export const CITIES = { beijing: { name: "北京", lat: 39.9, lon: 116.4 }, sydney: { name: "悉尼", lat: -33.9, lon: 151.2 }, london: { name: "伦敦", lat: 51.5, lon: -0.1 }, singapore: { name: "新加坡", lat: 1.3, lon: 103.8 } } as const;
/** 昼长比较：相差不到 0.3 小时视为一样长 */
export function longerDay(a: number, b: number) { return Math.abs(a - b) < 0.3 ? "equal" : a > b ? "a" : "b"; }
