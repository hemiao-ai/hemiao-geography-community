"use client";
import type { PointerEvent } from "react";
import { latLabel, lonLabel, polarXY, wrapLon, type FlatView, type LonLat, type PolarView } from "@/lib/arena/latlon";

const CELL = 96, PAD = 50, f = (n: number) => n.toFixed(1);
type Tone = "mark" | "good" | "bad" | "pin";
const TONE: Record<Tone, string> = { mark: "var(--danger)", good: "var(--good)", bad: "var(--accent-2)", pin: "var(--accent)" };
export interface Dot { at: LonLat; tone: Tone; label?: string }

function DotMark({ x, y, tone, label, alt }: { x: number; y: number; tone: Tone; label?: string; alt?: boolean }) {
  return <g transform={`translate(${f(x)} ${f(y)})`}>
    <circle r={13} fill={TONE[tone]} fillOpacity={0.18} /><circle r={6.5} fill={TONE[tone]} stroke="#fff" strokeWidth={2.5} />
    {label && <text x={alt ? -12 : 10} y={alt ? 26 : -10} textAnchor={alt ? "end" : "start"} fontSize={19} fontWeight={900} fill="var(--ink)" paintOrder="stroke" stroke="var(--canvas)" strokeWidth={5}>{label}</text>}
  </g>;
}

/** 局部经纬网：东在右、北在上；经度按窗口左缘向东累加（可跨 180°）。plain 时只标度数，不标 N/S/E/W。 */
export function FlatGrid({ view, dots = [], onPick }: { view: FlatView; dots?: Dot[]; onPick?: (p: LonLat) => void }) {
  const { lon0, lat0, step, cols, rows, plain } = view, W = cols * CELL, H = rows * CELL;
  const xOf = (lon: number) => ((((lon - lon0) % 360) + 360) % 360 / step) * CELL, yOf = (lat: number) => H - ((lat - lat0) / step) * CELL;
  const pick = (e: PointerEvent<SVGRectElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    onPick([Math.round(wrapLon(lon0 + (x / CELL) * step) * 10) / 10, Math.round((lat0 + ((H - y) / CELL) * step) * 10) / 10]);
  };
  const hotLon = (v: number) => !plain && (wrapLon(v) === 0 || wrapLon(v) === 180), hotLat = (v: number) => !plain && v === 0;
  return <svg viewBox={`${-PAD} ${-20} ${W + PAD + 40} ${H + PAD + 20}`} className="block w-full select-none" role="img" aria-label="经纬网">
    <rect width={W} height={H} rx={6} fill="var(--canvas)" stroke="var(--panel-border)" />
    {Array.from({ length: cols + 1 }, (_, c) => { const lon = lon0 + c * step, x = c * CELL, hot = hotLon(lon);
      return <g key={`x${c}`}><line x1={x} x2={x} y1={0} y2={H} stroke={hot ? "var(--accent)" : "var(--ink)"} strokeOpacity={hot ? 0.9 : 0.28} strokeWidth={hot ? 2 : 1} />
        <text x={x} y={H + 28} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--ink)" className="num">{lonLabel(lon, plain)}</text></g>; })}
    {Array.from({ length: rows + 1 }, (_, r) => { const lat = lat0 + r * step, y = yOf(lat), hot = hotLat(lat);
      return <g key={`y${r}`}><line x1={0} x2={W} y1={y} y2={y} stroke={hot ? "var(--danger)" : "var(--ink)"} strokeOpacity={hot ? 0.75 : 0.28} strokeWidth={hot ? 2 : 1} />
        <text x={-10} y={y + 6} textAnchor="end" fontSize={17} fontWeight={700} fill="var(--ink)" className="num">{latLabel(lat, plain)}</text></g>; })}
    {dots.map((d, i) => <DotMark key={i} x={xOf(d.at[0])} y={yOf(d.at[1])} tone={d.tone} label={d.label} alt={i % 2 === 1} />)}
    {onPick && <rect width={W} height={H} fill="transparent" className="cursor-crosshair" onPointerDown={pick} />}
  </svg>;
}

/** 极地俯视图：等距方位投影，外圈为赤道。北极上空东经逆时针增大，南极上空顺时针增大。arrow 画出自转方向。 */
export function PolarGrid({ view, dots = [] }: { view: PolarView; dots?: Dot[] }) {
  const R = 150, s = view.pole === "N" ? 1 : -1, P = (lon: number, lat: number) => polarXY(lon, lat, view.pole, view.rot, R);
  // 自转方向：自西向东，即沿经度增大的方向
  const arc = Array.from({ length: 9 }, (_, i) => P(i * 18 - 72, s * 22)), [ex, ey] = arc[8], [px, py] = arc[7];
  const ang = (Math.atan2(ey - py, ex - px) * 180) / Math.PI;
  return <svg viewBox={`${-R - 56} ${-R - 56} ${2 * R + 112} ${2 * R + 112}`} className="mx-auto block w-full max-w-[440px] select-none" role="img" aria-label="极地俯视图">
    <circle r={R} fill="var(--canvas)" stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.5} />
    {[15, 30, 45, 60, 75].map(l => { const r = (R * (90 - l)) / 90, major = l % 30 === 0;
      return <g key={l}><circle r={r} fill="none" stroke="var(--ink)" strokeOpacity={major ? 0.32 : 0.14} strokeDasharray={major ? undefined : "3 4"} />
        {major && !view.plain && <text x={4} y={-r - 4} fontSize={14} fontWeight={700} fill="var(--muted)" className="num">{latLabel(s * l)}</text>}</g>; })}
    <circle r={R} fill="none" stroke="var(--danger)" strokeOpacity={0.75} strokeWidth={2} />
    {Array.from({ length: 12 }, (_, i) => { const lon = wrapLon(i * 30), [x, y] = P(lon, 0), [lx, ly] = polarXY(lon, 0, view.pole, view.rot, R + 28), hot = !view.plain && (lon === 0 || lon === 180);
      return <g key={i}><line x1={0} y1={0} x2={f(x)} y2={f(y)} stroke={hot ? "var(--accent)" : "var(--ink)"} strokeOpacity={hot ? 0.85 : 0.28} strokeWidth={hot ? 1.8 : 1} />
        {!view.plain && <text x={f(lx)} y={f(ly + 6)} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--ink)" className="num">{lonLabel(lon)}</text>}</g>; })}
    {view.arrow && <g stroke="var(--accent-2)" strokeWidth={5} fill="none" strokeLinecap="round">
      <polyline points={arc.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")} />
      <path d="M -16 -11 L 3 0 L -16 11" transform={`translate(${f(ex)} ${f(ey)}) rotate(${f(ang)})`} strokeLinejoin="round" />
    </g>}
    <circle r={4} fill="var(--ink)" />{!view.plain && <text x={8} y={18} fontSize={14} fontWeight={800} fill="var(--ink)">{view.pole === "N" ? "北极" : "南极"}</text>}
    {dots.map((d, i) => { const [x, y] = P(d.at[0], d.at[1]); return <DotMark key={i} x={x} y={y} tone={d.tone} label={d.label} alt={i % 2 === 1} />; })}
  </svg>;
}
