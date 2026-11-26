/** 等高线沙盘：由种子生成山体，计算等高线、地形部位、剖面和坡度。坐标为 0～1 的平面，高度单位 m。纯函数，不依赖 DOM。 */
export type Pt = [number, number];
export type Feature = "peak" | "ridge" | "valley" | "saddle" | "cliff";
export const FEATURES: Record<Feature, string> = { peak: "山峰", ridge: "山脊", valley: "山谷", saddle: "鞍部", cliff: "陡崖" };
export const INTERVAL = 100, GRID = 48;

const g = (x: number, y: number, cx: number, cy: number, sx: number, sy = sx) => Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));
/** 沿方向 (dx,dy) 拉长的高斯：山脊 */
function ridgeG(x: number, y: number, cx: number, cy: number, dx: number, dy: number, len: number, w: number) {
  const px = x - cx, py = y - cy, t = Math.max(0, Math.min(len, px * dx + py * dy)), qx = px - t * dx, qy = py - t * dy;
  return Math.exp(-(qx * qx + qy * qy) / (2 * w * w)) * (1 - (0.55 * t) / len);
}
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** 标准布局（未旋转）：主峰 A、次峰 B、A 向西南和东南伸出两条山脊，中间是山谷，B 的北侧是陡崖 */
const A: Pt = [0.36, 0.46], B: Pt = [0.7, 0.4];
const R1 = [-0.55, 0.83], R2 = [0.35, 0.94];
function canonicalHeight(x: number, y: number, s: { ha: number; hb: number }) {
  let h = 80 + 0.55 * s.ha * g(x, y, A[0], A[1], 0.12) + s.hb * g(x, y, B[0], B[1], 0.1)
    + 0.42 * s.ha * ridgeG(x, y, A[0], A[1], R1[0], R1[1], 0.42, 0.06) + 0.36 * s.ha * ridgeG(x, y, A[0], A[1], R2[0], R2[1], 0.4, 0.06);
  // B 北侧的陡崖：在很窄的范围内高度骤降
  const inX = smooth(0.56, 0.6, x) * (1 - smooth(0.82, 0.86, x));
  h -= 0.55 * s.hb * inX * (1 - smooth(0.268, 0.282, y));
  return Math.max(30, h);
}
const CANON: Record<Feature, Pt> = { peak: A, ridge: [A[0] + R1[0] * 0.22, A[1] + R1[1] * 0.22], valley: [A[0] - 0.02, A[1] + 0.2], saddle: [0.545, 0.43], cliff: [0.7, 0.275] };
/** 河流候选：甲沿山谷，乙沿山脊 */
const CANON_LINES = { valley: [[A[0] - 0.02, A[1] + 0.12], [A[0] - 0.03, A[1] + 0.42]] as Pt[], ridge: [[A[0] + R1[0] * 0.1, A[1] + R1[1] * 0.1], [A[0] + R1[0] * 0.4, A[1] + R1[1] * 0.4]] as Pt[] };
/** 登山路线：从山脚到主峰 A */
const CANON_ROUTES: Record<string, Pt[]> = {
  ridge: [[0.12, 0.88], [0.2, 0.74], [0.27, 0.6], [A[0], A[1]]],
  cliff: [[0.72, 0.12], [0.62, 0.3], [0.5, 0.4], [A[0], A[1]]],
  direct: [[0.36, 0.06], [0.36, 0.2], [0.36, 0.34], [A[0], A[1]]],
};

export interface Terrain { seed: number; rot: number; flip: boolean; ha: number; hb: number }
export function makeTerrain(seed: number): Terrain {
  const s = Math.abs(Math.floor(seed));
  return { seed, rot: s % 4, flip: Math.floor(s / 4) % 2 === 1, ha: [820, 900, 760][Math.floor(s / 8) % 3], hb: [560, 620, 520][Math.floor(s / 24) % 3] };
}
/** 标准坐标 → 实际坐标（旋转 rot×90°、可镜像） */
export function toMap(t: Terrain, [x, y]: Pt): Pt {
  let u = x - 0.5, v = y - 0.5;
  if (t.flip) u = -u;
  for (let i = 0; i < t.rot; i++) [u, v] = [-v, u];
  return [u + 0.5, v + 0.5];
}
function toCanon(t: Terrain, [x, y]: Pt): Pt {
  let u = x - 0.5, v = y - 0.5;
  for (let i = 0; i < t.rot; i++) [u, v] = [v, -u];
  if (t.flip) u = -u;
  return [u + 0.5, v + 0.5];
}
export const heightAt = (t: Terrain, p: Pt) => { const [x, y] = toCanon(t, p); return canonicalHeight(x, y, t); };
export const featurePoint = (t: Terrain, f: Feature) => toMap(t, CANON[f]);
export const riverLines = (t: Terrain) => ({ valley: CANON_LINES.valley.map(p => toMap(t, p)), ridge: CANON_LINES.ridge.map(p => toMap(t, p)) });
export const routes = (t: Terrain) => Object.fromEntries(Object.entries(CANON_ROUTES).map(([k, v]) => [k, v.map(p => toMap(t, p))])) as Record<string, Pt[]>;

export function heightGrid(t: Terrain, n = GRID) {
  return Array.from({ length: n + 1 }, (_, j) => Array.from({ length: n + 1 }, (_, i) => heightAt(t, [i / n, j / n])));
}
/** 等高线：marching squares，返回每个高度上的线段 */
export function contours(grid: number[][], interval = INTERVAL) {
  const n = grid.length - 1, max = Math.max(...grid.flat()), out: { level: number; segs: [Pt, Pt][] }[] = [];
  for (let level = interval; level < max; level += interval) {
    const segs: [Pt, Pt][] = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const c = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]], P: Pt[] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], cross: Pt[] = [];
      for (let k = 0; k < 4; k++) {
        const a = c[k], b = c[(k + 1) % 4];
        if ((a < level) !== (b < level)) { const r = (level - a) / (b - a), p = P[k], q = P[(k + 1) % 4]; cross.push([(p[0] + (q[0] - p[0]) * r) / n, (p[1] + (q[1] - p[1]) * r) / n]); }
      }
      if (cross.length === 2) segs.push([cross[0], cross[1]]);
      else if (cross.length === 4) { segs.push([cross[0], cross[1]]); segs.push([cross[2], cross[3]]); }
    }
    out.push({ level, segs });
  }
  return out;
}
export function profile(t: Terrain, a: Pt, b: Pt, samples = 60) {
  return Array.from({ length: samples + 1 }, (_, k) => heightAt(t, [a[0] + ((b[0] - a[0]) * k) / samples, a[1] + ((b[1] - a[1]) * k) / samples]));
}
/** 路线的最大坡度（每 1/100 图幅的高差，m） */
export function routeSteepness(t: Terrain, route: Pt[]) {
  let worst = 0;
  for (let k = 0; k < route.length - 1; k++) {
    const [a, b] = [route[k], route[k + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(2, Math.ceil(len * 100));
    for (let s = 0; s < steps; s++) {
      const p: Pt = [a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps], q: Pt = [a[0] + ((b[0] - a[0]) * (s + 1)) / steps, a[1] + ((b[1] - a[1]) * (s + 1)) / steps];
      worst = Math.max(worst, Math.abs(heightAt(t, q) - heightAt(t, p)) / (Math.hypot(q[0] - p[0], q[1] - p[1]) * 100));
    }
  }
  return worst;
}
export const gentlestRoute = (t: Terrain) => Object.entries(routes(t)).sort((a, b) => routeSteepness(t, a[1]) - routeSteepness(t, b[1]))[0][0];
/** 点击判定：离该地形部位不超过 0.07 图幅 */
export const hits = (t: Terrain, f: Feature, p: Pt) => Math.hypot(p[0] - featurePoint(t, f)[0], p[1] - featurePoint(t, f)[1]) <= 0.07;
/** 剖面题：沿 A 峰穿过鞍部到 B 峰的线；三个候选里只有一个是真实剖面 */
export function profileLine(t: Terrain): [Pt, Pt] { return [toMap(t, [0.12, 0.48]), toMap(t, [0.94, 0.38])]; }
export const profileOptions = (seed: number) => [[0, 1, 2], [1, 2, 0], [2, 0, 1]][Math.abs(Math.floor(seed / 72)) % 3];
