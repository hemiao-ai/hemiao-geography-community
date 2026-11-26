"use client";
import { useMemo, type ReactNode } from "react";
import { contours, heightGrid, INTERVAL, type Pt, type Terrain } from "@/lib/terrain";

/** 不同 JS 引擎的 Math.exp 末位可能不同，输出到 SVG 前先取整，避免服务端与浏览器渲染不一致 */
const f4 = (v: number) => v.toFixed(4);

/** 分层设色：低处绿、中间黄褐、高处棕 */
export function tint(h: number) {
  const stops: [number, [number, number, number]][] = [[0, [118, 170, 104]], [250, [168, 196, 118]], [450, [224, 205, 140]], [700, [198, 150, 96]], [950, [150, 104, 70]], [1200, [235, 228, 214]]];
  for (let k = 1; k < stops.length; k++) if (h <= stops[k][0]) {
    const [h0, c0] = stops[k - 1], [h1, c1] = stops[k], r = (h - h0) / (h1 - h0);
    return `rgb(${c0.map((c, i) => Math.round(c + (c1[i] - c) * r)).join(",")})`;
  }
  return "rgb(235,228,214)";
}

export function useTerrainData(t: Terrain, n = 40) {
  return useMemo(() => { const grid = heightGrid(t, n); return { grid, lines: contours(grid) }; }, [t, n]);
}

/** 伪 3D 沙盘：等距投影，按从后往前的顺序画格子，等高线抬到对应高度 */
export function TerrainBlock({ t, marker, n = 40 }: { t: Terrain; marker?: Pt | null; n?: number }) {
  const { grid, lines } = useTerrainData(t, n);
  const W = 560, cw = 6.2, ch = 3.2, k = 0.12, ox = W / 2, oy = 70, base = -40;
  const P = (x: number, y: number, h: number) => [Math.round((ox + (x - y) * n * cw) * 10) / 10, Math.round((oy + (x + y) * n * ch - h * k) * 10) / 10] as const;
  const polys: ReactNode[] = [];
  for (let s = 0; s <= 2 * (n - 1); s++) for (let j = Math.max(0, s - n + 1); j <= Math.min(n - 1, s); j++) {
    const i = s - j, hs = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]], avg = (hs[0] + hs[1] + hs[2] + hs[3]) / 4;
    const shade = Math.round(Math.max(-0.25, Math.min(0.25, ((hs[0] + hs[3]) - (hs[1] + hs[2])) / 900)) * 100) / 100;
    const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b], q) => P(a / n, b / n, hs[q]).join(",")).join(" ");
    polys.push(<polygon key={`${i}-${j}`} points={pts} fill={tint(avg)} stroke={tint(avg)} strokeWidth={0.4} style={{ filter: `brightness(${1 + shade})` }} />);
  }
  const wall = (edge: "x" | "y") => {
    const top = Array.from({ length: n + 1 }, (_, q) => edge === "x" ? P(1, q / n, grid[q][n]) : P(q / n, 1, grid[n][q]));
    const bottom = [edge === "x" ? P(1, 1, base) : P(1, 1, base), edge === "x" ? P(1, 0, base) : P(0, 1, base)];
    return [...top, ...bottom].map(p => p.join(",")).join(" ");
  };
  const mk = marker ? P(marker[0], marker[1], grid[Math.round(marker[1] * n)][Math.round(marker[0] * n)]) : null;
  const H = oy + 2 * n * ch + 40;
  return <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
    <polygon points={wall("x")} fill="#8a6a48" /><polygon points={wall("y")} fill="#a5835c" />
    {polys}
    <g fill="none" stroke="#3b2f22" strokeOpacity={0.45} strokeWidth={0.7}>
      {lines.map(({ level, segs }) => <path key={level} d={segs.map(([a, b]) => `M${P(a[0], a[1], level).join(" ")}L${P(b[0], b[1], level).join(" ")}`).join("")} strokeWidth={level % 500 === 0 ? 1.3 : 0.7} />)}
    </g>
    {mk && <g transform={`translate(${mk[0]} ${mk[1]})`}><line y1={0} y2={-34} stroke="var(--accent)" strokeWidth={2} /><circle cy={-38} r={6} fill="var(--accent)" stroke="#fff" strokeWidth={2} /></g>}
  </svg>;
}

/** 等高线地形图（俯视，上北下南） */
export function ContourMap({ t, onPoint, onHover, children, size = 440, n = 40 }: { t: Terrain; onPoint?: (p: Pt) => void; onHover?: (p: Pt | null) => void; children?: ReactNode; size?: number; n?: number }) {
  const { grid, lines } = useTerrainData(t, n);
  const toPt = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>): Pt => { const r = e.currentTarget.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
  const cells: ReactNode[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cells.push(<rect key={`${i}-${j}`} x={i / n} y={j / n} width={1 / n + 0.001} height={1 / n + 0.001} fill={tint((grid[j][i] + grid[j + 1][i + 1]) / 2)} />);
  const labels = lines.filter(l => l.level % 200 === 0).map(l => { const s = l.segs[Math.floor(l.segs.length * 0.37)]; return s ? { level: l.level, at: s[0] } : null; }).filter(Boolean) as { level: number; at: Pt }[];
  return <svg viewBox="0 0 1 1" width={size} height={size} className="block h-auto w-full max-w-[460px] cursor-crosshair rounded-[10px] border border-panel-border" onClick={e => onPoint?.(toPt(e))} onPointerMove={e => onHover?.(toPt(e))} onPointerLeave={() => onHover?.(null)}>
    <g opacity={0.55}>{cells}</g>
    <g fill="none" stroke="#4a3a28">{lines.map(({ level, segs }) => <path key={level} d={segs.map(([a, b]) => `M${f4(a[0])} ${f4(a[1])}L${f4(b[0])} ${f4(b[1])}`).join("")} strokeWidth={level % 500 === 0 ? 0.0042 : 0.0024} />)}</g>
    {labels.map(l => <text key={l.level} x={f4(l.at[0])} y={f4(l.at[1])} fontSize={0.026} fill="#4a3a28" paintOrder="stroke" stroke="#fffaf0" strokeWidth={0.008} className="num">{l.level}</text>)}
    <g transform="translate(0.94 0.08)"><path d="M0 -0.04 L0.016 0.012 L0 0.002 L-0.016 0.012Z" fill="var(--ink)" /><text y={-0.048} fontSize={0.03} textAnchor="middle" fill="var(--ink)" fontWeight={700}>N</text></g>
    <text x={0.03} y={0.97} fontSize={0.024} fill="var(--ink)" opacity={0.7}>等高距 {INTERVAL} m</text>
    {children}
  </svg>;
}

export function ProfileChart({ data, label, active, onClick }: { data: number[]; label: string; active?: boolean; onClick?: () => void }) {
  const W = 200, H = 90, max = 1200, pts = data.map((h, k) => `${(k / (data.length - 1)) * (W - 20) + 14},${H - 12 - (h / max) * (H - 24)}`).join(" ");
  return <button type="button" onClick={onClick} className={`rounded-[10px] border p-2 text-left ${active ? "border-ink outline-2 outline-ink" : "border-panel-border"} bg-panel-solid`}>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full"><line x1={14} y1={H - 12} x2={W - 6} y2={H - 12} stroke="var(--muted)" /><line x1={14} y1={H - 12} x2={14} y2={6} stroke="var(--muted)" />
      <polygon points={`14,${H - 12} ${pts} ${W - 6},${H - 12}`} fill="var(--land)" opacity={0.7} /><polyline points={pts} fill="none" stroke="#7a5230" strokeWidth={1.8} />
      <text x={14} y={H - 1} fontSize={10} fill="var(--muted)">A</text><text x={W - 12} y={H - 1} fontSize={10} fill="var(--muted)">B</text></svg>
    <span className="mt-1 block text-center text-sm font-bold">{label}</span>
  </button>;
}
