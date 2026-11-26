/** 竞技场「经纬度定位」出题与判定：纯函数，按种子生成，服务端可重放。坐标为 [经度, 纬度]，东经、北纬为正。 */
export type LonLat = [number, number];
export type Stage = 0 | 1 | 2;
export interface FlatView { kind: "flat"; lon0: number; lat0: number; step: number; cols: number; rows: number; plain?: boolean }
export interface PolarView { kind: "polar"; pole: "N" | "S"; rot: number; plain?: boolean; arrow?: boolean }
export interface Pin { at: LonLat; label?: string }
export type QuestionType = "pick" | "hemi" | "band" | "fact" | "click" | "plain" | "multi" | "direction" | "polar" | "pole" | "polarDir";
interface Base { index: number; stage: Stage; points: number; targetMs: number; type: QuestionType; prompt: string; pins: Pin[] }
export type LatlonQuestion =
  | Base & { view: FlatView | PolarView | null; choices: string[]; answer: string; click?: undefined }
  | Base & { view: FlatView; choices?: undefined; answer: LonLat; click: true };

/** 闯关 15 题，每段 5 题，题型在段内按种子轮换 */
export const ROUND = 15;
export const STAGES = [
  { from: 0, points: 100, targetMs: 4000, label: "看图读数", types: ["pick", "hemi", "band", "fact"] },
  { from: 5, points: 150, targetMs: 6000, label: "推理判断", types: ["click", "plain", "multi", "direction"] },
  { from: 10, points: 200, targetMs: 8000, label: "极地俯视", types: ["polar", "pole", "polarDir"] },
] as const satisfies readonly { from: number; points: number; targetMs: number; label: string; types: readonly QuestionType[] }[];
export const stageAt = (index: number): Stage => (index >= STAGES[2].from ? 2 : index >= STAGES[1].from ? 1 : 0);
export const CLICK_TOLERANCE = 2.5;

function rng(seed: number) {
  let a = (Math.floor(seed) >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
type R = () => number;
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: R, list: readonly T[]) => list[Math.floor(r() * list.length)];
function shuffle<T>(r: R, list: T[]) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }

export const wrapLon = (lon: number) => { const x = ((lon + 180) % 360 + 360) % 360 - 180; return x === -180 ? 180 : x; };
export const latLabel = (lat: number, plain = false) => (lat === 0 || plain ? `${Math.abs(lat)}°` : `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`);
export const lonLabel = (lon: number, plain = false) => { const l = wrapLon(lon); return l === 0 || l === 180 || plain ? `${Math.abs(l)}°` : `${Math.abs(l)}°${l > 0 ? "E" : "W"}`; };
export const coordLabel = ([lon, lat]: LonLat) => `${latLabel(lat)}，${lonLabel(lon)}`;
/** 东西半球以 20°W 和 160°E 组成的经线圈划分 */
export const isEast = (lon: number) => { const l = wrapLon(lon); return l >= -20 && l < 160; };
export const hemisphereLabel = ([lon, lat]: LonLat) => `${isEast(lon) ? "东" : "西"}半球、${lat >= 0 ? "北" : "南"}半球`;
export const HEMI_CHOICES = ["东半球、北半球", "东半球、南半球", "西半球、北半球", "西半球、南半球"];
export const bandLabel = (lat: number) => (Math.abs(lat) < 30 ? "低纬度" : Math.abs(lat) < 60 ? "中纬度" : "高纬度");
export const DIRECTIONS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
const LETTERS = ["甲", "乙", "丙", "丁"];
/** 经纬线、经纬度的判断题 */
export const FACTS: [string, boolean][] = [
  ["所有经线的长度都相等", true], ["所有纬线的长度都相等", false], ["经线指示南北方向", true], ["纬线指示南北方向", false],
  ["赤道是最长的纬线", true], ["0° 经线又叫本初子午线", true], ["东西半球的分界线是 0° 和 180° 经线", false],
  ["纬度越高，纬线越长", false], ["北极点是地球上的最北点", true], ["30°N～60°N 属于中纬度地区", true],
  ["60°S～90°S 属于低纬度地区", false], ["经度的范围是 0°～90°", false], ["纬度向北增大的是北纬", true], ["经度向西增大的是东经", false],
];

/** 局部经纬网：4×3 格，每格 10°。opts 控制是否允许跨赤道、本初子午线和 180° 经线 */
function flatView(r: R, simple = false): FlatView {
  if (!simple) return { kind: "flat", lon0: int(r, -18, 17) * 10, lat0: int(r, -7, 4) * 10, step: 10, cols: 4, rows: 3 };
  const east = r() < 0.5, north = r() < 0.5, lon0 = east ? int(r, 1, 13) * 10 : -int(r, 5, 17) * 10, lat0 = north ? int(r, 1, 4) * 10 : -int(r, 4, 7) * 10;
  return { kind: "flat", lon0, lat0, step: 10, cols: 4, rows: 3 };
}
function pointIn(r: R, v: FlatView, half: boolean): LonLat {
  const unit = half ? v.step / 2 : v.step, nx = (v.cols * v.step) / unit, ny = (v.rows * v.step) / unit;
  return [wrapLon(v.lon0 + int(r, 1, nx - 1) * unit), v.lat0 + int(r, 1, ny - 1) * unit];
}
/** 取窗口内满足条件的点（排除分界线上的歧义位置） */
function pointWhere(r: R, v: FlatView, half: boolean, ok: (p: LonLat) => boolean): LonLat {
  for (let i = 0; i < 50; i++) { const p = pointIn(r, v, half); if (ok(p)) return p; }
  return pointIn(r, v, half);
}
const clearHemi = ([lon, lat]: LonLat) => lat !== 0 && wrapLon(lon) !== -20 && wrapLon(lon) !== 160;
const clearBand = ([, lat]: LonLat) => Math.abs(lat) !== 30 && Math.abs(lat) !== 60 && Math.abs(lat) !== 90;
function coordOptions(r: R, at: LonLat, step: number) {
  const right = coordLabel(at), set = new Set([right]);
  for (const p of shuffle(r, [[at[0], -at[1]], [-at[0], at[1]], [-at[0], -at[1]], [at[0] + step, at[1]], [at[0] - step, at[1]], [at[0], at[1] + step]] as LonLat[])) {
    if (set.size >= 4) break; if (Math.abs(p[1]) <= 90) set.add(coordLabel([wrapLon(p[0]), p[1]]));
  }
  for (let k = 1; set.size < 4; k++) set.add(coordLabel([wrapLon(at[0] + step * k), at[1]]));
  return { choices: shuffle(r, [...set]), answer: right };
}
export function directionOf(from: LonLat, to: LonLat) {
  const dx = Math.sign(wrapLon(to[0] - from[0])), dy = Math.sign(to[1] - from[1]);
  return (dy > 0 ? "北" : dy < 0 ? "南" : "") + (dx > 0 ? "东" : dx < 0 ? "西" : "") || "原地";
}
const dirName = (d: string) => (d === "北东" ? "东北" : d === "北西" ? "西北" : d === "南东" ? "东南" : d === "南西" ? "西南" : d);

function makeQuestion(r: R, type: QuestionType, base: Omit<Base, "type" | "prompt" | "pins">): LatlonQuestion {
  const q = (o: { prompt: string; pins: Pin[]; view: FlatView | PolarView | null; choices: string[]; answer: string }): LatlonQuestion => ({ ...base, type, ...o });
  switch (type) {
    case "pick": { const view = flatView(r), at = pointIn(r, view, false); return q({ prompt: "图中红点的经纬度是", view, pins: [{ at }], ...coordOptions(r, at, view.step) }); }
    case "hemi": { const view = flatView(r), at = pointWhere(r, view, true, clearHemi); return q({ prompt: "图中红点位于", view, pins: [{ at }], choices: HEMI_CHOICES, answer: hemisphereLabel(at) }); }
    case "band": { const view = flatView(r), at = pointWhere(r, view, false, clearBand); return q({ prompt: "图中红点位于", view, pins: [{ at }], choices: ["低纬度", "中纬度", "高纬度"], answer: bandLabel(at[1]) }); }
    case "fact": { const [text, ok] = pick(r, FACTS); return q({ prompt: text, view: null, pins: [], choices: ["对", "错"], answer: ok ? "对" : "错" }); }
    case "click": { const view = flatView(r), at = pointIn(r, view, true); return { ...base, type, prompt: `在经纬网上点出 ${coordLabel(at)}`, pins: [], view, answer: at, click: true }; }
    case "plain": { const view = { ...flatView(r, true), plain: true }, at = pointIn(r, view, false);
      return q({ prompt: "图中只标了度数。根据度数的变化，红点的经纬度是", view, pins: [{ at }], ...coordOptions(r, at, view.step) }); }
    case "multi": {
      const byHemi = r() < 0.6;
      if (byHemi) {
        const view: FlatView = { kind: "flat", lon0: r() < 0.5 ? pick(r, [-50, -40, -30]) : pick(r, [130, 140, 150]), lat0: pick(r, [-20, -10]), step: 10, cols: 4, rows: 3 };
        const cut = view.lon0 < 0 ? -20 : 160, cells: LonLat[] = [];
        for (let i = 1; i < 8; i++) for (let j = 1; j < 6; j++) { const p: LonLat = [wrapLon(view.lon0 + i * 5), view.lat0 + j * 5]; if (p[1] !== 0 && wrapLon(p[0]) !== cut) cells.push(p); }
        const groups = HEMI_CHOICES.map(h => shuffle(r, cells.filter(c => hemisphereLabel(c) === h)));
        const target = int(r, 0, 3), pts = shuffle(r, groups.map(g => g[0]));
        return q({ prompt: `位于${HEMI_CHOICES[target]}的是`, view, pins: pts.map((at, i) => ({ at, label: LETTERS[i] })), choices: LETTERS, answer: LETTERS[pts.findIndex(p => hemisphereLabel(p) === HEMI_CHOICES[target])] });
      }
      const band = pick(r, ["低纬度", "中纬度", "高纬度"] as const);
      // 每个窗口恰有一行纬度在目标纬度带内，其余三行在带外（30°、60° 分界线上不放点）
      const lat0 = pick(r, ({ 低纬度: [20, -50], 中纬度: [10, 50, -40], 高纬度: [40, -70] } as const)[band]), view: FlatView = { kind: "flat", lon0: int(r, -18, 14) * 10, lat0, step: 10, cols: 4, rows: 3 };
      const lats = [5, 10, 15, 20, 25].map(k => lat0 + k).filter(l => clearBand([0, l])), lons = shuffle(r, [1, 2, 3, 4, 5, 6, 7].map(k => wrapLon(view.lon0 + k * 5)));
      const inBand = shuffle(r, lats.filter(l => bandLabel(l) === band)), outBand = shuffle(r, lats.filter(l => bandLabel(l) !== band));
      const pts = shuffle(r, [inBand[0], ...outBand.slice(0, 3)].map((lat, i) => [lons[i], lat] as LonLat));
      return q({ prompt: `位于${band}的是`, view, pins: pts.map((at, i) => ({ at, label: LETTERS[i] })), choices: LETTERS, answer: LETTERS[pts.findIndex(p => bandLabel(p[1]) === band)] });
    }
    case "direction": {
      const view = flatView(r, true), a = pointIn(r, view, false);
      let b = pointIn(r, view, false); while (b[0] === a[0] && b[1] === a[1]) b = pointIn(r, view, false);
      return q({ prompt: "乙地在甲地的什么方向", view, pins: [{ at: a, label: "甲" }, { at: b, label: "乙" }], choices: DIRECTIONS, answer: dirName(directionOf(a, b)) });
    }
    case "polar": {
      const view: PolarView = { kind: "polar", pole: r() < 0.5 ? "N" : "S", rot: int(r, 0, 11) * 30 };
      const at: LonLat = [wrapLon(int(r, -5, 6) * 30), (view.pole === "N" ? 1 : -1) * pick(r, [15, 30, 45, 60, 75])];
      if (r() < 0.5) return q({ prompt: "图中红点位于", view, pins: [{ at }], choices: HEMI_CHOICES, answer: hemisphereLabel(at) });
      return q({ prompt: "图中红点的经纬度是", view, pins: [{ at }], ...coordOptions(r, at, 30) });
    }
    case "pole": {
      const view: PolarView = { kind: "polar", pole: r() < 0.5 ? "N" : "S", rot: int(r, 0, 11) * 30, plain: true, arrow: true };
      return q({ prompt: "箭头表示地球自转方向。这幅图是从哪个极点上空看到的", view, pins: [], choices: ["北极上空", "南极上空"], answer: view.pole === "N" ? "北极上空" : "南极上空" });
    }
    case "polarDir": {
      const view: PolarView = { kind: "polar", pole: r() < 0.5 ? "N" : "S", rot: int(r, 0, 11) * 30 }, s = view.pole === "N" ? 1 : -1;
      const lon = wrapLon(int(r, -5, 6) * 30), lat = s * pick(r, [30, 45, 60]);
      const sameMeridian = r() < 0.5, a: LonLat = [lon, lat], b: LonLat = sameMeridian ? [lon, lat + s * pick(r, [15, -15])] : [wrapLon(lon + pick(r, [30, -30, 60, -60])), lat];
      return q({ prompt: "乙地在甲地的什么方向", view, pins: [{ at: a, label: "甲" }, { at: b, label: "乙" }], choices: ["北", "东", "南", "西"], answer: directionOf(a, b) });
    }
  }
}

export function latlonQuestion(seed: number, index: number): LatlonQuestion {
  const stage = stageAt(index), s = STAGES[stage], order = shuffle(rng(Math.floor(seed) * 31 + stage + 7), [...s.types]);
  const r = rng(Math.imul(Math.floor(seed) | 0, 2654435761) ^ (index + 1) * 40503);
  return makeQuestion(r, order[(index - s.from) % order.length], { index, stage, points: s.points, targetMs: s.targetMs });
}

export type LatlonInput = string | LonLat;
export function checkLatlon(q: LatlonQuestion, input: LatlonInput) {
  if (!q.click) return input === q.answer;
  if (!Array.isArray(input) || input.length !== 2 || !input.every(Number.isFinite)) return false;
  return Math.abs(wrapLon(input[0] - q.answer[0])) <= CLICK_TOLERANCE && Math.abs(input[1] - q.answer[1]) <= CLICK_TOLERANCE;
}
/** 选项少于 3 个的题（对错、南北极）答错直接跳题，不给第二次机会 */
export const allowsRetry = (q: LatlonQuestion) => !!q.click || q.choices.length > 2;

/**
 * 极地俯视图坐标：以极点为圆心的等距方位投影，赤道在外圈半径 R。
 * 北极上空看，经度向东逆时针增大；南极上空看，向东顺时针增大。rot 为 0° 经线相对正下方的旋转角。返回 SVG 坐标（y 向下）。
 */
export function polarXY(lon: number, lat: number, pole: "N" | "S", rot: number, R: number): [number, number] {
  const d = (R * (90 - Math.abs(lat))) / 90, a = ((lon + rot) * Math.PI) / 180;
  return pole === "N" ? [d * Math.sin(a), d * Math.cos(a)] : [-d * Math.sin(a), d * Math.cos(a)];
}
