"use client";
import { useId, useRef, type PointerEvent } from "react";
import { CITIES, declination, subsolarLon, TILT } from "../../lib/astro";

const RAD = Math.PI / 180;
export interface View { lon0: number; lat0: number }
/** 正射投影：返回 SVG 坐标与是否在可见半球 */
export function project(lat: number, lon: number, v: View, R: number) {
  const p = lat * RAD, l = (lon - v.lon0) * RAD, p0 = v.lat0 * RAD;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return { x: R * Math.cos(p) * Math.sin(l), y: -R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), vis: cosc > 0 };
}
export function unproject(x: number, y: number, v: View, R: number): { lat: number; lon: number } | null {
  const rho = Math.hypot(x, y);
  if (rho > R || R <= 0) return null;
  if (rho === 0) return { lat: v.lat0, lon: ((v.lon0 + 180) % 360 + 360) % 360 - 180 };
  const c = Math.asin(Math.min(1, rho / R)), p0 = v.lat0 * RAD, yy = -y;
  const lat = Math.asin(Math.cos(c) * Math.sin(p0) + yy * Math.sin(c) * Math.cos(p0) / rho) / RAD;
  const lon = v.lon0 + Math.atan2(x * Math.sin(c), rho * Math.cos(p0) * Math.cos(c) - yy * Math.sin(p0) * Math.sin(c)) / RAD;
  return { lat, lon: ((lon + 180) % 360 + 360) % 360 - 180 };
}
function line(points: { x: number; y: number; vis: boolean }[]) {
  let d = "", pen = false;
  for (const q of points) { if (!q.vis) { pen = false; continue; } d += `${pen ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; }
  return d;
}
const parallel = (lat: number, v: View, R: number) => line(Array.from({ length: 121 }, (_, i) => project(lat, -180 + i * 3, v, R)));
const meridian = (lon: number, v: View, R: number) => line(Array.from({ length: 61 }, (_, i) => project(-90 + i * 3, lon, v, R)));

/** 晨昏圈上的点：与直射点相距 90° 的大圆 */
function terminatorPoints(sLat: number, sLon: number) {
  const p = sLat * RAD, l = sLon * RAD, S = [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  const a = Math.abs(S[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = [S[1] * a[2] - S[2] * a[1], S[2] * a[0] - S[0] * a[2], S[0] * a[1] - S[1] * a[0]], nu = Math.hypot(...u), U = u.map(x => x / nu);
  const V = [S[1] * U[2] - S[2] * U[1], S[2] * U[0] - S[0] * U[2], S[0] * U[1] - S[1] * U[0]];
  return Array.from({ length: 121 }, (_, i) => { const t = (i / 120) * 2 * Math.PI, P = [0, 1, 2].map(k => Math.cos(t) * U[k] + Math.sin(t) * V[k]); return { lat: Math.asin(P[2]) / RAD, lon: Math.atan2(P[1], P[0]) / RAD }; });
}
const terminator = (sLat: number, sLon: number, v: View, R: number) => line(terminatorPoints(sLat, sLon).map(q => project(q.lat, q.lon, v, R)));
function inside(pt: { x: number; y: number }, poly: { x: number; y: number }[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if ((poly[i].y > pt.y) !== (poly[j].y > pt.y) && pt.x < ((poly[j].x - poly[i].x) * (pt.y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x) c = !c;
  return c;
}
/** 夜半球的可见部分：晨昏圈可见的一半 + 被遮挡一半径向推到地球边缘；再按直射点判断取这块还是取它的补集 */
function nightPath(sLat: number, sLon: number, v: View, R: number) {
  const poly = terminatorPoints(sLat, sLon).map(q => { const p = project(q.lat, q.lon, v, R); if (p.vis) return p; const k = R / (Math.hypot(p.x, p.y) || 1); return { x: p.x * k, y: p.y * k, vis: false }; });
  const d = poly.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join("") + "Z";
  const anti = project(-sLat, sLon + 180, v, R), sun = project(sLat, sLon, v, R);
  const isNight = anti.vis ? inside(anti, poly) : !inside(sun, poly);
  return isNight ? d : `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0Z${d}`;
}

/** 地球仪：只画经纬网、回归线、极圈、晨昏和城市点位，不画国界 */
export function Globe({ view, setView, day, utc, size = 420, cities = ["beijing", "sydney", "london"], highlight, onPick, marks = [], grid, showNight = true, highlightMeridians = [] }: { view: View; setView?: (v: View) => void; day: number; utc: number; size?: number; cities?: (keyof typeof CITIES)[]; highlight?: keyof typeof CITIES; onPick?: (lonlat: [number, number]) => void; marks?: { at: [number, number]; label?: string; tone?: "accent" | "good" | "danger" }[]; grid?: number; showNight?: boolean; highlightMeridians?: number[] }) {
  const R = size / 2 - 26, drag = useRef<{ x: number; y: number; v: View; moved: boolean } | null>(null), uid = useId().replace(/:/g, "");
  const sLat = declination(day), sLon = subsolarLon(utc), sun = project(sLat, sLon, view, R);
  const night = nightPath(sLat, sLon, view, R);
  const down = (e: PointerEvent<SVGSVGElement>) => { if (!setView && !onPick) return; drag.current = { x: e.clientX, y: e.clientY, v: view, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { const d = drag.current; if (!d) return; if (Math.hypot(e.clientX - d.x, e.clientY - d.y) >= 4) d.moved = true; if ((!onPick || d.moved) && setView) setView({ lon0: d.v.lon0 - (e.clientX - d.x) * 0.45, lat0: Math.max(-60, Math.min(60, d.v.lat0 + (e.clientY - d.y) * 0.3)) }); };
  const up = (e: PointerEvent<SVGSVGElement>) => { const d = drag.current; drag.current = null; if (!d || d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) >= 4 || !onPick) return; const r = e.currentTarget.getBoundingClientRect(), p = unproject(((e.clientX - r.left) / r.width - 0.5) * size, ((e.clientY - r.top) / r.height - 0.5) * size, d.v, R); if (p) onPick([p.lon, p.lat]); };
  const interval = grid && grid > 0 ? grid : 30;
  const lats = grid ? Array.from({ length: Math.ceil(180 / interval) - 1 }, (_, i) => -90 + (i + 1) * interval).filter(l => l < 90 && l !== 0) : [-60, -30, 30, 60];
  const lons = Array.from({ length: Math.ceil(360 / interval) }, (_, i) => -180 + i * interval).filter(l => l < 180);
  return <svg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} className={`block w-full max-w-[460px] touch-none select-none ${setView ? "cursor-grab active:cursor-grabbing" : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
    <defs>
      <radialGradient id={`sea${uid}`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#d9eef7" /><stop offset="0.6" stopColor="var(--sea)" /><stop offset="1" stopColor="var(--sea-deep)" /></radialGradient>
      <clipPath id={`disk${uid}`}><circle r={R} /></clipPath>
    </defs>
    <circle r={R + 10} fill="none" stroke="var(--accent-3)" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="2 5" />
    <circle r={R} fill={`url(#sea${uid})`} stroke="var(--ink)" strokeWidth={1.5} />
    <g clipPath={`url(#disk${uid})`}>
      <g fill="none" stroke="var(--ink)" strokeOpacity={0.16} strokeWidth={0.8}>
        {lats.map(l => <path key={l} d={parallel(l, view, R)} />)}
        {lons.map(l => <path key={l} d={meridian(l, view, R)} strokeOpacity={l === 0 ? 0.45 : 0.16} />)}
      </g>
      {highlightMeridians.map(l => <path key={l} d={meridian(l, view, R)} fill="none" stroke="var(--accent-2)" strokeWidth={2.5} />)}
      {grid && <g fontSize={9} fontWeight={700} fill="var(--ink)" paintOrder="stroke" stroke="#fff" strokeWidth={2}>
        {lats.map(l => { const q = project(l, view.lon0, view, R); return q.vis ? <text key={`a${l}`} x={(q.x + 4).toFixed(1)} y={(q.y - 3).toFixed(1)}>{Math.abs(l)}°{l > 0 ? "N" : "S"}</text> : null; })}
        {lons.map(l => { const q = project(0, l, view, R); return q.vis ? <text key={`o${l}`} x={(q.x + 3).toFixed(1)} y={(q.y + 11).toFixed(1)}>{l === 0 ? "0°" : `${Math.abs(l)}°${l > 0 ? "E" : "W"}`}</text> : null; })}
      </g>}
      <path d={parallel(0, view, R)} fill="none" stroke="var(--danger)" strokeWidth={1.6} />
      {[TILT, -TILT].map(l => <path key={l} d={parallel(l, view, R)} fill="none" stroke="var(--accent-2)" strokeWidth={1.3} strokeDasharray="6 4" />)}
      {[90 - TILT, TILT - 90].map(l => <path key={l} d={parallel(l, view, R)} fill="none" stroke="var(--accent)" strokeWidth={1.1} strokeDasharray="2 4" />)}
      {showNight && <><path d={night} fill="#0b1a2a" fillOpacity={0.42} fillRule="evenodd" />
      <path d={terminator(sLat, sLon, view, R)} fill="none" stroke="#ffcf6a" strokeOpacity={0.8} strokeWidth={1.2} />
      {sun.vis && <g transform={`translate(${sun.x.toFixed(1)} ${sun.y.toFixed(1)})`}><circle r={13} fill="#ffd34d" fillOpacity={0.35} /><circle r={6} fill="#ffb800" stroke="#fff" strokeWidth={1.5} /></g>}</>}
      {cities.map(k => { const c = CITIES[k], q = project(c.lat, c.lon, view, R); if (!q.vis) return null; const on = highlight === k;
        return <g key={k} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`}><circle r={on ? 6 : 4.5} fill={on ? "var(--accent-2)" : "var(--ink)"} stroke="#fff" strokeWidth={1.5} /><text x={8} y={4} fontSize={12} fontWeight={700} fill="var(--ink)" paintOrder="stroke" stroke="#fff" strokeWidth={3}>{c.name}</text></g>; })}
      {marks.map((m, i) => { const q = project(m.at[1], m.at[0], view, R); return q.vis ? <g key={i} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`}><circle r={6} fill={`var(--${m.tone ?? "accent"})`} stroke="#fff" strokeWidth={2} />{m.label && <text x={9} y={4} fontSize={12} fontWeight={700} fill="var(--ink)" paintOrder="stroke" stroke="#fff" strokeWidth={3}>{m.label}</text>}</g> : null; })}
    </g>
    {(() => { const n = project(90, 0, view, R); return n.vis ? <text x={n.x.toFixed(1)} y={(n.y - 6).toFixed(1)} fontSize={11} textAnchor="middle" fill="var(--ink)" fontWeight={700}>N</text> : null; })()}
  </svg>;
}

/** 公转示意：太阳居中，地球在四个位置；地轴始终倾斜指向同一方向（北极偏右） */
export function Orbit({ labels, picked, onPick, day }: { labels: string[]; picked: number | null; onPick: (i: number) => void; day?: number }) {
  const W = 560, H = 300, cx = W / 2, cy = H / 2, rx = 210, ry = 92;
  const at = (deg: number) => ({ x: cx + rx * Math.cos(deg * RAD), y: cy + ry * Math.sin(deg * RAD) });
  const earth = (x: number, y: number, r: number) => {
    const toSun = Math.atan2(cy - y, cx - x) / RAD;
    return <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="var(--sea)" stroke="var(--ink)" strokeWidth={1.2} />
      <path d={`M0 ${-r} A${r} ${r} 0 0 0 0 ${r}Z`} transform={`rotate(${toSun})`} fill="#0b1a2a" fillOpacity={0.45} />
      <g transform={`rotate(${TILT})`}><line x1={0} y1={-r - 9} x2={0} y2={r + 9} stroke="var(--ink)" strokeWidth={1.4} /><text x={0} y={-r - 11} fontSize={9} textAnchor="middle" fill="var(--ink)">N</text><ellipse rx={r} ry={r * 0.18} fill="none" stroke="var(--danger)" strokeWidth={0.9} /></g>
    </g>;
  };
  const live = day !== undefined ? at(180 - ((day - 172) / 365) * 360) : null;
  return <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
    <rect width={W} height={H} rx={12} fill="#14202b" />
    {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 137) % W} cy={(i * 71) % H} r={0.9} fill="#fff" opacity={0.5} />)}
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#fff" strokeOpacity={0.35} strokeDasharray="4 5" />
    <circle cx={cx} cy={cy} r={30} fill="#ffcf4d" /><circle cx={cx} cy={cy} r={42} fill="#ffcf4d" opacity={0.18} />
    {[0, 90, 180, 270].map((deg, k) => { const p = at(deg), on = picked === k;
      return <g key={deg} className="cursor-pointer" onClick={() => onPick(k)}>
        <circle cx={p.x} cy={p.y} r={34} fill={on ? "rgba(255,255,255,.14)" : "transparent"} stroke={on ? "#fff" : "transparent"} />
        {earth(p.x, p.y, 18)}<text x={p.x} y={p.y + 46} fontSize={14} fontWeight={800} textAnchor="middle" fill="#fff">{labels[k]}</text></g>; })}
    {live && earth(live.x, live.y, 11)}
  </svg>;
}
