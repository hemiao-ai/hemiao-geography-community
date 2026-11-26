"use client";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { snapRain, snapTemp } from "../../lib/climate";

type Editable = { values: (number | null)[]; onChange?: (values: (number | null)[]) => void; title?: string };
type GraphProps = Editable & { min: number; max: number; step: number; unit: string; bars?: boolean };
function Graph({ values, onChange, min, max, step, unit, bars = false, title }: GraphProps) {
  const W = 660, H = 300, left = 52, right = 640, top = 34, bottom = 255, active = useRef<number | null>(null);
  const x = (i: number) => left + (i + 0.5) * (right - left) / 12, y = (v: number) => bottom - (v - min) / (max - min) * (bottom - top);
  const snap = (v: number) => bars ? snapRain(v) : step === 0.5 ? snapTemp(v) : Math.round(v / step) * step;
  const change = (i: number, n: number) => { if (!onChange) return; const next = Array.from({ length: 12 }, (_, k) => values[k] ?? null); next[i] = Math.max(min, Math.min(max, snap(n))); onChange(next); };
  const pointer = (e: PointerEvent<SVGRectElement>, i: number) => { const svg = e.currentTarget.ownerSVGElement; if (!svg) return; const box = svg.getBoundingClientRect(), sy = (e.clientY - box.top) / box.height * H; change(i, min + (bottom - sy) / (bottom - top) * (max - min)); };
  const keyboard = (e: KeyboardEvent<SVGRectElement>, i: number) => { if (!onChange || !["ArrowUp", "ArrowDown"].includes(e.key)) return; e.preventDefault(); change(i, (values[i] ?? min) + (e.key === "ArrowUp" ? step : -step)); };
  const points: [number, number][] = [];
  values.slice(0, 12).forEach((v, i) => { if (v !== null) points.push([x(i), y(v)]); });
  const tickStep = bars ? (max > 300 ? 100 : 50) : (max - min > 40 ? 10 : 5);
  const ticks = Array.from({ length: Math.max(0, Math.floor(max / tickStep) - Math.ceil(min / tickStep) + 1) }, (_, i) => (Math.ceil(min / tickStep) + i) * tickStep);
  const curve = (points: [number, number][]) => points.slice(1).reduce((d, p, i) => { const prev = points[i], mid = (prev[0] + p[0]) / 2; return `${d} C${mid.toFixed(1)} ${prev[1].toFixed(1)} ${mid.toFixed(1)} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }, `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`);
  return <div className="overflow-x-auto rounded-[10px]"><svg viewBox={`0 0 ${W} ${H}`} className={`w-full min-w-[600px] rounded-[10px] bg-canvas ${onChange ? "touch-pan-x" : ""}`} role="group" aria-label={title ?? (bars ? "降水柱状图" : "气温曲线图")}>
    {title && <text x={W / 2} y="17" fontSize="13" textAnchor="middle" fontWeight="bold" fill="var(--ink)">{title}</text>}
    <text x="6" y="25" fontSize="11" fill="var(--ink)">{unit}</text>
    {ticks.map(v => <g key={v}><line x1={left} x2={right} y1={y(v).toFixed(1)} y2={y(v).toFixed(1)} stroke="var(--canvas-line)" /><text x={left - 7} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="var(--muted)">{v}</text></g>)}
    <path d={`M${left} ${top}V${bottom}H${right}`} stroke="var(--ink)" fill="none" />
    {bars ? values.slice(0, 12).map((v, i) => v === null ? null : <rect key={i} x={(x(i) - 13).toFixed(1)} y={y(v).toFixed(1)} width="26" height={(bottom - y(v)).toFixed(1)} fill="#5d9be0" />)
      : <>{points.length > 0 && <path d={curve(points)} fill="none" stroke="#cc4130" strokeWidth="3" />}{values.slice(0, 12).map((v, i) => v === null ? null : <circle key={i} cx={x(i).toFixed(1)} cy={y(v).toFixed(1)} r="4" fill="#cc4130" />)}</>}
    {values.slice(0, 12).map((v, i) => v === null ? null : <text key={i} x={x(i).toFixed(1)} y={Math.max(top + 10, y(v) - 8).toFixed(1)} textAnchor="middle" fontSize="10" fontWeight="bold" fill={bars ? "#246d9a" : "#ad3d2c"} paintOrder="stroke" stroke="var(--canvas)" strokeWidth="3">{bars ? v : v.toFixed(1)}</text>)}
    {Array.from({ length: 12 }, (_, i) => <g key={i}><text x={x(i).toFixed(1)} y="274" textAnchor="middle" fontSize="11" fill="var(--ink)">{i + 1}月</text>{onChange && <rect x={(left + i * (right - left) / 12).toFixed(1)} y={top} width={((right - left) / 12).toFixed(1)} height={bottom - top} fill="transparent" className="cursor-ns-resize" tabIndex={0} role="slider" aria-label={`${i + 1}月${bars ? "降水量" : "气温"}`} aria-valuemin={min} aria-valuemax={max} aria-valuenow={values[i] ?? min} aria-valuetext={values[i] === null ? "未设置" : `${values[i]} ${unit}`} onPointerDown={e => { active.current = i; e.currentTarget.setPointerCapture(e.pointerId); pointer(e, i); }} onPointerMove={e => { if (active.current === i) pointer(e, i); }} onPointerUp={() => { active.current = null; }} onPointerCancel={() => { active.current = null; }} onKeyDown={e => keyboard(e, i)} />}</g>)}
  </svg></div>;
}
export function TempChart({ values, onChange, range, step = 0.5, title }: Editable & { range: [number, number]; step?: number }) {
  return <Graph values={values} onChange={onChange} min={range[0]} max={range[1]} step={step} unit="℃" title={title} />;
}
export function PrecipChart({ values, onChange, max, title }: Editable & { max: number }) {
  return <Graph values={values} onChange={onChange} min={0} max={max} step={5} unit="mm" bars title={title} />;
}

export function ClimateChart({ t, p, title, subtitle, niceTicks = false }: { t: number[]; p: number[]; title?: string; subtitle?: string; niceTicks?: boolean }) {
  const W = 260, H = 170, x = (m: number) => 34 + m * 18;
  const tMin = niceTicks ? Math.min(0, Math.floor(Math.min(...t) / 10) * 10) : subtitle ? Math.min(-22, Math.floor(Math.min(...t) / 10) * 10) : -22, tMax = niceTicks ? Math.max(20, Math.ceil(Math.max(...t) / 10) * 10) : subtitle ? Math.max(32, Math.ceil(Math.max(...t) / 10) * 10) : 32;
  const pStep = Math.max(...p) > 600 ? 200 : Math.max(...p) > 250 ? 100 : 50;
  const pMax = niceTicks ? Math.max(pStep, Math.ceil(Math.max(...p) / pStep) * pStep) : subtitle ? Math.max(350, Math.ceil(Math.max(...p) / 100) * 100) : 350;
  const top = subtitle ? 30 : 20, ty = (v: number) => top + ((tMax - v) / (tMax - tMin)) * (140 - top), py = (v: number) => 140 - (v / pMax) * (140 - top);
  const tTicks = niceTicks ? Array.from({ length: (tMax - tMin) / 10 + 1 }, (_, i) => tMin + i * 10) : subtitle ? [tMin, 0, tMax] : [30, 10, -10];
  const pTicks = niceTicks ? Array.from({ length: pMax / pStep }, (_, i) => (i + 1) * pStep) : subtitle ? [pMax / 3, pMax * 2 / 3, pMax] : [100, 200, 300];
  return <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[10px] bg-canvas">
    {title && <text x={W / 2} y={13} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--ink)">{title}</text>}
    {subtitle && <text x={W / 2} y={25} fontSize={8} textAnchor="middle" fill="var(--muted)">{subtitle}</text>}
    <line x1={30} x2={W - 10} y1={140} y2={140} stroke="var(--muted)" />
    {tTicks.map(v => <text key={v} x={26} y={(ty(v) + 3).toFixed(1)} fontSize={8} textAnchor="end" fill="#cc4130">{v}</text>)}
    {pTicks.map(v => <text key={v} x={W - 6} y={(py(v) + 3).toFixed(1)} fontSize={8} textAnchor="end" fill="#2f6bd1">{Number(v.toFixed(0))}</text>)}
    {p.map((v, m) => <rect key={m} x={x(m) - 6} y={py(v).toFixed(1)} width={12} height={(140 - py(v)).toFixed(1)} fill="#5d9be0" opacity={0.75} />)}
    <polyline points={t.map((v, m) => `${x(m)},${ty(v).toFixed(1)}`).join(" ")} fill="none" stroke="#cc4130" strokeWidth={2} />
    <line x1={30} x2={W - 10} y1={ty(0).toFixed(1)} y2={ty(0).toFixed(1)} stroke="#cc4130" strokeDasharray="2 3" opacity={0.5} />
    {niceTicks && <g><line x1={30} x2={W - 10} y1={ty(15).toFixed(1)} y2={ty(15).toFixed(1)} stroke="#cc4130" strokeDasharray="3 3" opacity={0.35} /><text x={W - 12} y={(ty(15) - 2).toFixed(1)} fontSize={8} textAnchor="end" fill="#a65b4c">15 ℃</text></g>}
    {[1, 4, 7, 10].map(m => <text key={m} x={x(m - 1)} y={152} fontSize={8} textAnchor="middle" fill="var(--muted)">{m}月</text>)}
    <text x={34} y={H - 3} fontSize={8} fill="var(--muted)">气温 ℃（红线）· 降水 mm（蓝柱）· 年降水 {Math.round(p.reduce((a, b) => a + b, 0) * 10) / 10} mm</text>
  </svg>;
}
