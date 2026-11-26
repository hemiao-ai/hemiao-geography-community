"use client";
import { useRef, useState, type PointerEvent } from "react";
import { MAP_FEATURES, TOWNS, type MapPoint, type MapSymbolKey } from "@/lib/world-maps";

function SymbolArt({ symbol }: { symbol: MapSymbolKey }) {
  const line = { fill: "none", strokeLinecap: "round" as const, strokeWidth: 3 };
  if (symbol === "rail") return <g {...line} stroke="#4f4d4a"><path d="M5 20 H55" /><path d="M12 14 V26 M22 14 V26 M32 14 V26 M42 14 V26 M52 14 V26" strokeWidth="2" /></g>;
  if (symbol === "highway") return <g {...line}><path d="M5 20 H55" stroke="#ba754d" strokeWidth="8" /><path d="M5 20 H55" stroke="#fff7dd" strokeWidth="2" strokeDasharray="8 5" /></g>;
  if (symbol === "road") return <path d="M5 20 H55" {...line} stroke="#b79b69" strokeWidth="5" />;
  if (symbol === "river") return <path d="M5 26 Q15 9 26 20 T55 17" {...line} stroke="#2f8ab1" strokeWidth="4" />;
  if (symbol === "lake" || symbol === "reservoir") return <g><ellipse cx="30" cy="20" rx="20" ry="11" fill="#9bd2e1" stroke="#4c96b5" strokeWidth="2" />{symbol === "reservoir" && <path d="M46 9 V31" stroke="#665846" strokeWidth="4" />}</g>;
  if (symbol === "peak") return <g><path d="M17 29 L30 7 L43 29Z" fill="#926f4e" /><text x="49" y="30" fontSize="10" fill="#674e37">▲</text></g>;
  if (symbol === "town") return <g><circle cx="30" cy="20" r="8" fill="#fff" stroke="#3e555a" strokeWidth="3" /><circle cx="30" cy="20" r="3" fill="#3e555a" /></g>;
  if (symbol === "airport") return <path d="M28 5 Q30 1 32 5 L33 15 L53 23 V27 L33 23 L32 31 L39 35 V38 L30 35 L21 38 V35 L28 31 L27 23 L7 27 V23 L27 15Z" fill="#425e69" />;
  if (symbol === "port") return <g fill="none" stroke="#36768e" strokeWidth="3"><circle cx="30" cy="9" r="4" /><path d="M30 13 V31 M20 19 H40 M16 24 Q18 35 30 35 Q42 35 44 24 M13 25 L16 30 L19 25 M41 25 L44 30 L47 25" /></g>;
  if (symbol === "desert") return <g fill="none" stroke="#b48b4f" strokeWidth="2.5"><path d="M6 17 Q13 10 20 17 M25 17 Q32 10 39 17 M44 17 Q51 10 57 17 M15 29 Q22 22 29 29 M35 29 Q42 22 49 29" /></g>;
  return <g fill="none" stroke="#268ab0" strokeWidth="3"><path d="M10 8 H50 M16 9 V26 M30 9 V30 M44 9 V26" /><path d="M10 32 Q16 27 22 32 T34 32 T50 32" /></g>;
}
export function MapSymbol({ symbol, size = 72 }: { symbol: MapSymbolKey; size?: number }) {
  return <svg viewBox="0 0 60 40" width={size} height={size * 2 / 3} role="img" aria-label="地图图例符号"><SymbolArt symbol={symbol} /></svg>;
}
type Props = { rotation?: number; mode?: "default" | "arrow" | "graticule"; scale?: number; ruler?: boolean; detail?: "low" | "medium" | "high" | "full"; extent?: [number, number, number, number] };
export function SchematicMap({ rotation = 0, mode = "default", scale, ruler = false, detail = "full", extent }: Props) {
  const view = extent ?? (rotation % 180 === 0 ? [0, rotation ? -100 : 0, 600, rotation ? 600 : 400] : rotation % 90 === 0 ? [0, -100, 600, 600] : [-54, -154, 708, 708]), [pos, setPos] = useState<MapPoint>([100, 305]);
  const drag = useRef<MapPoint | null>(null);
  const coordinates = (e: PointerEvent<SVGGElement>): MapPoint => {
    const svg = e.currentTarget.ownerSVGElement, ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return [0, 0];
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(ctm.inverse()); return [q.x, q.y];
  };
  const line = (points: MapPoint[]) => points.map(p => p.join(",")).join(" ");
  const full = detail === "full", shown = detail !== "low", local = detail === "medium" || detail === "high";
  const fs = detail === "high" ? 1.8 : detail === "medium" ? 6 : 19;
  return <svg viewBox={view.join(" ")} className={`w-full rounded-xl bg-[#e9eddd] ${ruler ? "touch-none" : ""}`} role="img" aria-label="禾苗县虚构示意地图">
    <rect x={view[0]} y={view[1]} width={view[2]} height={view[3]} fill="#e9eddd" />
    <g transform={`rotate(${rotation} 300 200)`}>
      <polyline points={line(MAP_FEATURES.highway)} fill="none" stroke="#bf7955" strokeWidth="6" /><polyline points={line(MAP_FEATURES.highway)} fill="none" stroke="#f8e6b6" strokeWidth="2" strokeDasharray="9 6" />
      {shown && <><polyline points={line(MAP_FEATURES.river)} fill="none" stroke="#53a8c6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={MAP_FEATURES.lake.at[0]} cy={MAP_FEATURES.lake.at[1]} rx={MAP_FEATURES.lake.rx} ry={MAP_FEATURES.lake.ry} fill="#a3d5e2" stroke="#6bafc5" strokeWidth="2" />
        <ellipse cx={MAP_FEATURES.reservoir.at[0]} cy={MAP_FEATURES.reservoir.at[1]} rx={MAP_FEATURES.reservoir.rx} ry={MAP_FEATURES.reservoir.ry} fill="#a3d5e2" stroke="#6bafc5" strokeWidth="2" />
        <polyline points={line(MAP_FEATURES.road)} fill="none" stroke="#c6ad81" strokeWidth="4" /><polyline points={line(MAP_FEATURES.rail)} fill="none" stroke="#5d6660" strokeWidth="3" strokeDasharray="8 4" /></>}
      {local && <>{MAP_FEATURES.streets.map((p, i) => <polyline key={i} points={line(p)} stroke="#c5bca4" strokeWidth="1.2" fill="none" />)}{MAP_FEATURES.buildings.map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="3" fill="#bc9a7d" stroke="#917158" strokeWidth=".2" />)}</>}
      {full && <><path d={`M${MAP_FEATURES.peak.at[0]} ${MAP_FEATURES.peak.at[1] - 10} l-10 18 h20Z`} fill="#927052" /><text x={MAP_FEATURES.peak.at[0] + 12} y={MAP_FEATURES.peak.at[1]} fontSize="12" fill="#67533e" transform={`rotate(${-rotation} ${MAP_FEATURES.peak.at[0] + 12} ${MAP_FEATURES.peak.at[1]})`}>{MAP_FEATURES.peak.height} m</text><g transform={`translate(${MAP_FEATURES.airport.join(" ")}) scale(.4)`}><SymbolArt symbol="airport" /></g><g transform={`translate(${MAP_FEATURES.port.join(" ")}) scale(.4)`}><SymbolArt symbol="port" /></g><text x="477" y="207" fontSize="12" fill="#397a90">东湖</text><text x="83" y="122" fontSize="12" fill="#397a90">水库</text></>}
      {Object.entries(TOWNS).map(([k, { name, at: [x, y] }]) => <g key={k}><circle cx={x} cy={y} r={local ? 1.3 : 5} fill="#fff" stroke="#445f5c" strokeWidth={local ? .4 : 2} /><text x={x + (local ? 3 : 9)} y={y - (local ? 2 : 6)} fontSize={fs} fontWeight="bold" fill="#304b49" paintOrder="stroke" stroke="#e9eddd" strokeWidth={local ? .6 : 3} transform={`rotate(${-rotation} ${x + (local ? 3 : 9)} ${y - (local ? 2 : 6)})`}>{name}</text></g>)}
      {mode === "graticule" && <g stroke="#537b86" strokeWidth="1.2" strokeDasharray="5 5">{[100, 200, 300, 400, 500].map((x, i) => <g key={x}><line x1={x} y1="0" x2={x} y2="400" /><text x={x + 5} y="18" stroke="none" fill="#355d6b" fontSize="16" fontWeight="bold" transform={`rotate(${-rotation} ${x + 5} 18)`}>{100 + i}°E</text></g>)}{[80, 160, 240, 320].map((y, i) => <g key={y}><line x1="0" y1={y} x2="600" y2={y} /><text x="50" y={y - 8} stroke="none" fill="#355d6b" fontSize="16" fontWeight="bold" transform={`rotate(${-rotation} 50 ${y - 8})`}>{34 - i}°N</text></g>)}</g>}
    </g>
    {mode === "arrow" && <g transform={`rotate(${rotation} 30 25)`}><path d="M30 0 L19 39 L30 31 L41 39Z" fill="#253f49" /><text x="30" y="-4" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#253f49" transform={`rotate(${-rotation} 30 -4)`}>北</text></g>}
    {scale !== undefined && <g transform="translate(30 376)"><path d="M0 0 H100 M0 -5 V5 M100 -5 V5" stroke="#314a50" strokeWidth="3" /><text x="0" y="-9" fontSize="12" fill="#314a50">0</text><text x="100" y="-9" textAnchor="end" fontSize="12" fill="#314a50">{scale} 千米</text></g>}
    {ruler && <g transform={`translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`} className="cursor-move" role="slider" tabIndex={0} aria-label="拖动直尺" onPointerDown={e => { const p = coordinates(e); drag.current = [p[0] - pos[0], p[1] - pos[1]]; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (!drag.current) return; const p = coordinates(e); setPos([Math.max(0, Math.min(500, p[0] - drag.current[0])), Math.max(0, Math.min(380, p[1] - drag.current[1]))]); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <rect width="100" height="28" rx="3" fill="#fff8de" fillOpacity=".9" stroke="#846b48" strokeWidth="1.5" />{Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={i * 10} x2={i * 10} y1="0" y2={i % 5 === 0 ? 11 : 6} stroke="#594c3d" /><text x={i * 10} y="23" textAnchor="middle" fontSize="7" fill="#594c3d">{i}</text></g>)}
    </g>}
  </svg>;
}
