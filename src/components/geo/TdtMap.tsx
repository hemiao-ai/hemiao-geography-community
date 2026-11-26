"use client";
import { createContext, useContext, type ReactNode } from "react";
import { CHINA_BBOX, type LonLat } from "@/lib/china";
import { hasTianditu, TIANDITU_KEY, TIANDITU_CREDIT } from "@/lib/site";
import { frameOf, proj, tiles, type Frame } from "@/lib/mercator";

/**
 * 天地图标准底图（WMTS，球面墨卡托）。底图内容不做任何修改，只在上面叠加标注；必须保留审图号。
 * 浏览器端 key 放在 NEXT_PUBLIC_TIANDITU_KEY，并在天地图控制台把访问域名或 IP 加入白名单。
 */
type Layer = "vec" | "ter" | "img" | "ibo" | "cva" | "cta" | "cia";
const url = (layer: Layer, x: number, y: number, z: number) =>
  `https://t${(x + y) % 8}.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${encodeURIComponent(TIANDITU_KEY)}`;

const Ctx = createContext<Frame | null>(null);
export function useProj() {
  const f = useContext(Ctx)!;
  return (p: LonLat) => { const [x, y] = proj(f, p[0], p[1]); return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number]; };
}
/** 叠加在地图上的折线（山脉、分界线、台风路径等示意，不是界线） */
export function MapLine({ line, color = "var(--accent)", width = 4, dash, label }: { line: LonLat[]; color?: string; width?: number; dash?: string; label?: ReactNode }) {
  const P = useProj(), pts = line.map(P), mid = pts[Math.floor(pts.length / 2)];
  return <g><polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />{label && <g transform={`translate(${mid[0]} ${mid[1]})`}>{label}</g>}</g>;
}
export function MapPin({ at, label, color = "var(--accent)", active }: { at: LonLat; label?: string; color?: string; active?: boolean }) {
  const [x, y] = useProj()(at);
  return <g transform={`translate(${x} ${y})`}><circle r={active ? 9 : 7} fill={color} stroke="#fff" strokeWidth={2.5} />{label && <text x={11} y={5} fontSize={15} fontWeight={800} fill="var(--ink)" paintOrder="stroke" stroke="#fff" strokeWidth={4}>{label}</text>}</g>;
}

export function TdtMap({ base = "vec", labels = false, bbox = CHINA_BBOX, z = 4, onPick, children, className = "" }: { base?: "vec" | "ter" | "img"; labels?: boolean; bbox?: [number, number, number, number]; z?: number; onPick?: (p: LonLat) => void; children?: ReactNode; className?: string }) {
  const f = frameOf(bbox, z), ts = tiles(f);
  const layers: Layer[] = [base, "ibo", ...(labels ? [(base === "ter" ? "cta" : base === "img" ? "cia" : "cva") as Layer] : [])];
  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * f.w + f.x0, y = ((e.clientY - r.top) / r.height) * f.h + f.y0, s = 256 * 2 ** z;
    onPick([Math.round(((x / s) * 360 - 180) * 100) / 100, Math.round(((Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / s))) * 180) / Math.PI) * 100) / 100]);
  };
  return <div className={`relative overflow-hidden rounded-[12px] border border-panel-border bg-[var(--sea)] ${className}`}>
    {hasTianditu && <svg aria-label="天地图标准底图" viewBox={`0 0 ${f.w.toFixed(1)} ${f.h.toFixed(1)}`} className={`block h-auto w-full ${onPick ? "cursor-crosshair" : ""}`} onClick={pick}>
      {layers.map(l => <g key={l}>{ts.map(t => <image key={`${t.x}-${t.y}`} href={url(l, t.x, t.y, z)} x={t.px.toFixed(1)} y={t.py.toFixed(1)} width={256} height={256} />)}</g>)}
      <Ctx.Provider value={f}>{children}</Ctx.Provider>
    </svg>}
    {hasTianditu ? <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-[#333]">© 天地图 · 审图号 {TIANDITU_CREDIT}</span>
      : <span className="block m-3 rounded-[10px] bg-panel-solid/95 px-3 py-2 text-xs leading-5 text-muted shadow">请在 <code>.env.local</code> 配置天地图 Key 和审图号，并重新构建。</span>}
  </div>;
}
