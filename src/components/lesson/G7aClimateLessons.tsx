"use client";
import { useState, type ReactNode } from "react";
import { CLIMATE_TYPES, STATIONS, type ClimateType } from "@/lib/climate-data";
import { RAIN_SEASON, stats } from "@/lib/climate";
import { CLIMATE_SCENES, climateNames, climateStations, dailyRule, FACTORS, FORECASTS, gaugeLevel, isoRule, lapseRule, pairsAnswer, rainPairs, rainStation, sandStart, shuffleClimate, SYMBOLS, symbolTargets, tempStation, turnAnswer, turnPair, WEATHER_KIND, wettestMonths, WIND_DIRS, windRule, ZONES, type SymbolKey } from "@/lib/lessons-g7a-climate";
import { ClimateChart, PrecipChart, TempChart } from "@/components/geo/Charts";
import { Art, numInput } from "./LabKit";
import { Tabs, Two } from "./ChinaLessons";
import { Sorter, type LessonConfig, type LessonCtx } from "./LessonShell";

const firsts = (o: Record<string, readonly [string, string]>, seed: number) => Object.fromEntries(shuffleClimate(Object.keys(o), seed).map(k => [k, o[k][0]]));
const filled = (...s: string[]) => s.every(v => v.trim() !== "" && Number.isFinite(Number(v)));
const near = (s: string, x: number, tol: number) => filled(s) && Math.abs(Number(s) - x) <= tol + 1e-9;
const fieldClass = "h-11 w-full rounded-[10px] border border-panel-border bg-panel-solid px-3 text-sm";
function NumberField({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return <label className="block"><span className="label">{label}</span><input type="number" step="any" value={value} onChange={e => set(e.target.value)} className={numInput} /></label>;
}
function Select({ label, value, options, set, disabled }: { label: string; value: string; options: [string, string][]; set: (v: string) => void; disabled?: boolean }) {
  return <label className="block"><span className="label">{label}</span><select aria-label={label} className={`${fieldClass} mt-1.5`} value={value} disabled={disabled} onChange={e => set(e.target.value)}><option value="">请选择</option>{options.map(([k, text]) => <option key={k} value={k}>{text}</option>)}</select></label>;
}
const dataSource = <p className="text-xs text-muted">数据来源：WMO 1991–2020 气候标准平均值</p>;
function DataTable({ values, unit }: { values: number[]; unit: string }) {
  return <div className="overflow-x-auto rounded-lg border border-panel-border"><table className="w-full min-w-[550px] text-center text-xs"><thead><tr><th className="p-2 whitespace-nowrap">月份</th>{values.map((_, i) => <th key={i} className="p-2">{i + 1}</th>)}</tr></thead><tbody><tr className="border-t border-panel-border"><th className="p-2">{unit}</th>{values.map((v, i) => <td key={i} className="p-2 num">{v.toFixed(1)}</td>)}</tr></tbody></table></div>;
}

function WeatherSymbol({ type, size = 100 }: { type: SymbolKey; size?: number }) {
  const cloud = ["cloudy", "overcast", "lightRain", "moderateRain", "heavyRain", "storm", "thunder", "sleet", "lightSnow", "moderateSnow", "heavySnow", "hail"].includes(type);
  const rain = ({ lightRain: 1, moderateRain: 2, heavyRain: 3, storm: 3, thunder: 1, sleet: 1 } as Partial<Record<SymbolKey, number>>)[type] ?? 0;
  const snow = ({ lightSnow: 1, moderateSnow: 2, heavySnow: 3, sleet: 1 } as Partial<Record<SymbolKey, number>>)[type] ?? 0;
  const snowflake = (x: number, y: number) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M0 -6 V6 M-5 -3 L5 3 M-5 3 L5 -3" /></g>;
  return <svg viewBox="0 0 100 80" width={size} height={size * 0.8} className="text-accent" role="img" aria-label={`${SYMBOLS[type]}符号`}>
    {(type === "sunny" || type === "cloudy") && <g stroke="#d69331" strokeWidth="3" fill="#f3c45e"><circle cx={type === "cloudy" ? 35 : 50} cy="27" r="13" />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={type === "cloudy" ? 35 : 50} y1="7" x2={type === "cloudy" ? 35 : 50} y2="2" transform={`rotate(${i * 45} ${type === "cloudy" ? 35 : 50} 27)`} />)}</g>}
    {cloud && <path d="M22 48 Q13 48 13 39 Q13 30 25 30 Q28 17 42 18 Q54 18 58 28 Q74 25 78 37 Q80 48 68 48Z" fill={type === "overcast" ? "#80909a" : "#ecf3f3"} stroke="#607e8a" strokeWidth="3.5" />}
    {Array.from({ length: rain }, (_, i) => <path key={`r${i}`} d={`M${rain === 1 ? 47 : 32 + i * 15} 53 l-3 9`} stroke="#2985b5" strokeWidth={type === "storm" ? 5.5 : 3.5} strokeLinecap="round" />)}
    {Array.from({ length: snow }, (_, i) => snowflake(snow === 1 ? (type === "sleet" ? 62 : 48) : 31 + i * 16, 61))}
    {type === "thunder" && <path d="M58 51 l-7 11 h7 l-5 10 l13 -15 h-7 l4 -6Z" fill="#e4a83e" />}
    {type === "hail" && [33, 48, 63].map(x => <path key={x} d={`M${x} 54 l-5 9 h10Z`} fill="#376c85" />)}
    {type === "fog" && [28, 40, 52].map(y => <line key={y} x1="20" x2="80" y1={y} y2={y} stroke="#71858d" strokeWidth="3" strokeLinecap="round" />)}
    {type === "frost" && <g transform="translate(50 38) scale(2.5)">{snowflake(0, 0)}</g>}
    {type === "dust" && <g fill="none" stroke="#af8050" strokeWidth="3" strokeLinecap="round"><path d="M28 20 C70 8 70 32 38 37 C15 42 28 63 67 53" /><path d="M15 64 H80 M72 57 L80 64 L72 71" /></g>}
  </svg>;
}
function WindArt({ dir, level }: { dir: string; level: number }) {
  return <svg viewBox="0 0 300 220" className="w-full rounded-[10px] bg-canvas" role="img" aria-label="风向风力示意图">
    <circle cx="150" cy="110" r="68" fill="none" stroke="var(--canvas-line)" strokeWidth="2" /><text x="150" y="22" textAnchor="middle" fill="var(--ink)" fontSize="16" fontWeight="bold">北 N ↑</text>
    <g transform={`rotate(${WIND_DIRS.indexOf(dir) * 45} 150 110)`} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"><line x1="150" y1="110" x2="150" y2="43" /><circle cx="150" cy="110" r="5" fill="var(--ink)" />{Array.from({ length: Math.floor(level / 2) }, (_, i) => <line key={i} x1="150" y1={43 + i * 10} x2="170" y2={35 + i * 10} />)}{level % 2 === 1 && <line x1="150" y1={43 + Math.floor(level / 2) * 10} x2="160" y2={39 + Math.floor(level / 2) * 10} />}</g>
    <text x="150" y="207" fontSize="12" textAnchor="middle" fill="var(--muted)">风杆指向风的来向</text>
  </svg>;
}
function WeatherScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), targets = symbolTargets(seed), [symbols, setSymbols] = useState<Record<string, string>>({}), [turn, setTurn] = useState(""), [dir, setDir] = useState(""), [level, setLevel] = useState(""), [kite, setKite] = useState(""), [umbrella, setUmbrella] = useState("");
  const [a, b] = turnPair(seed), wind = windRule(seed), forecasts = shuffleClimate(Object.keys(FORECASTS), seed + 23) as (keyof typeof FORECASTS)[];
  const days = Object.fromEntries(forecasts.map((k, i) => [k, `第 ${i + 1} 天`]));
  return <><Tabs tabs={["① 天气与气候", "② 天气符号", "③ 风向风力", "④ 安排活动"]} at={tab} set={setTab} />
    {tab === 0 && <Sorter items={firsts(WEATHER_KIND, seed + 7)} cats={{ weather: "天气", climate: "气候" }} answer={pairsAnswer(WEATHER_KIND)} done={ctx.done[0]} onMiss={ctx.miss} onDone={kind => ctx.complete(0, "天气多变，气候反映多年的平均状况。", { kind })} />}
    {tab === 1 && <div className="space-y-4"><p className="text-sm text-muted">给每个符号选名称，再判断天气的变化。</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{targets.map(k => <div key={k} className="rounded-xl bg-raised p-3"><div className="flex justify-center"><WeatherSymbol type={k} /></div><Select label="符号名称" value={symbols[k] ?? ""} disabled={ctx.done[1]} options={targets.map(id => [SYMBOLS[id], SYMBOLS[id]])} set={v => setSymbols(o => ({ ...o, [k]: v }))} /></div>)}</div>
      <div className="rounded-xl bg-raised p-3"><div className="flex items-center justify-center"><WeatherSymbol type={a} /><span className="text-xl">→</span><WeatherSymbol type={b} /></div><Select label="两个符号表示" value={turn} disabled={ctx.done[1]} options={shuffleClimate([turnAnswer(seed), `${SYMBOLS[b]}转${SYMBOLS[a]}`, "晴转小雪"], seed + 35).map(v => [v, v])} set={setTurn} /></div>
      {!ctx.done[1] && <button type="button" className="btn" onClick={() => targets.every(k => symbols[k] === SYMBOLS[k]) && turn === turnAnswer(seed) ? ctx.complete(1, "符号和天气变化都判断正确。", { symbols, turn }) : ctx.miss("注意雨滴、雪花的数量和箭头方向。")}>检查符号</button>}</div>}
    {tab === 2 && <Two map={<WindArt dir={wind.dir} level={wind.level} />} side={<><p className="text-sm text-muted">风向是指风的来向；一长划代表 2 级，一短划代表 1 级。</p><Select label="风向" value={dir} options={WIND_DIRS.map(v => [v, v])} set={setDir} /><Select label="风力" value={level} options={Array.from({ length: 8 }, (_, i) => [String(i + 1), `${i + 1} 级`])} set={setLevel} />{!ctx.done[2] && <button type="button" className="btn" disabled={!dir || !level} onClick={() => dir === wind.dir && Number(level) === wind.level ? ctx.complete(2, "风向表示风从哪个方向吹来。", { wind: { dir, level: Number(level) } }) : ctx.miss("从圆心沿风杆看风的来向，再数长划和短划。")}>确认风向风力</button>}</>} />}
    {tab === 3 && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{forecasts.map(k => <div key={k} className="rounded-xl bg-raised p-4 text-center"><b>{days[k]}</b><div className="flex justify-center"><WeatherSymbol type={FORECASTS[k].symbol} /></div><p>{SYMBOLS[FORECASTS[k].symbol]} · {FORECASTS[k].wind} 级</p><p className="text-sm text-muted">{FORECASTS[k].temp}</p></div>)}</div><div className="grid gap-3 sm:grid-cols-2"><Select label="哪天最适合放风筝？" value={kite} options={forecasts.map(k => [k, days[k]])} set={setKite} /><Select label="哪天出门要带雨具？" value={umbrella} options={forecasts.map(k => [k, days[k]])} set={setUmbrella} /></div>{!ctx.done[3] && <button type="button" className="btn" disabled={!kite || !umbrella} onClick={() => kite === "breezy" && umbrella === "rain" ? ctx.complete(3, "根据阴晴、降水和风力安排活动。", { plan: { kite, umbrella } }) : ctx.miss("放风筝需要适当的风；下雨时带雨具。")}>确认安排</button>}</div>}
  </>;
}
function DailyChart({ seed }: { seed: number }) {
  const d = dailyRule(seed), x = (h: number) => 42 + h * 22, y = (v: number) => 190 - (v - d.min) / d.range * 125;
  return <svg viewBox="0 0 600 230" className="w-full rounded-xl bg-canvas" role="img" aria-label="一天逐时气温示意曲线">
    <path d="M42 32 V190 H570" fill="none" stroke="var(--ink)" /><text x="8" y="30" fontSize="12" fill="var(--ink)">℃</text>
    {[d.min, d.min + d.range].map(v => <g key={v}><line x1="37" x2="42" y1={y(v).toFixed(1)} y2={y(v).toFixed(1)} stroke="var(--ink)" /><text x="34" y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="var(--ink)">{v.toFixed(1)}</text></g>)}
    <polyline points={Array.from({ length: 25 }, (_, h) => `${x(h)},${y(d.value(h)).toFixed(1)}`).join(" ")} fill="none" stroke="#cc4130" strokeWidth="3" />
    {[0, 6, 12, 18, 24].map(h => <text key={h} x={x(h)} y="210" textAnchor="middle" fontSize="11" fill="var(--ink)">{h}时</text>)}
    {[2, 8, 14, 20].map((h, i) => <g key={h}><circle cx={x(h)} cy={y(d.obs[i]).toFixed(1)} r="4" fill="#cc4130" /><text x={x(h)} y={(y(d.obs[i]) - 10).toFixed(1)} textAnchor="middle" fontSize="12" fill="var(--ink)">{d.obs[i].toFixed(1)}℃</text></g>)}
  </svg>;
}
function IsoArt({ seed }: { seed: number }) {
  const rule = isoRule(seed), north = rule.dir === "由南向北", leftDense = rule.dense === "甲";
  return <svg viewBox="0 0 600 300" className="w-full rounded-xl bg-canvas" role="img" aria-label="抽象等温线图">
    <text x="565" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--ink)">↑ 北</text>
    {[0, 1, 2, 3, 4].map(i => { const l = 130 + (i - 2) * (leftDense ? 12 : 27), r = 130 + (i - 2) * (leftDense ? 27 : 12), temp = north ? i * 5 : 20 - i * 5; return <g key={i}><path d={`M35 ${l} C200 ${l} 300 ${r} 405 ${r}`} fill="none" stroke="#c26d54" strokeWidth="1.6" /><text x="16" y={l + 4} fontSize="10" fill="#a34a36">{temp}℃</text></g>; })}
    <text x="100" y="260" fontSize="16" fontWeight="bold" fill="var(--ink)">甲</text><text x="350" y="260" fontSize="16" fontWeight="bold" fill="var(--ink)">乙</text>
    <rect x="425" y="65" width="155" height="125" rx="10" fill="var(--panel-solid)" stroke="var(--panel-border)" />
    <text x="502" y="84" textAnchor="middle" fontSize="10" fill="var(--muted)">闭合区域（局部）</text><ellipse cx="502" cy="137" rx="60" ry="40" fill="none" stroke="#c26d54" /><ellipse cx="502" cy="137" rx="32" ry="22" fill="none" stroke="#c26d54" /><text x="502" y="140" fontSize="12" textAnchor="middle" fill="var(--ink)">{rule.center === "高温中心" ? "15℃" : "5℃"}</text><text x="550" y="140" fontSize="10" fill="var(--ink)">10℃</text>
  </svg>;
}
function TemperatureScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [peak, setPeak] = useState(""), [mean, setMean] = useState(""), [dailyRange, setDailyRange] = useState("");
  const [curve, setCurve] = useState<(number | null)[]>(Array(12).fill(null)), [max, setMax] = useState(""), [min, setMin] = useState(""), [range, setRange] = useState("");
  const [dir, setDir] = useState(""), [dense, setDense] = useState(""), [center, setCenter] = useState("");
  const [time, setTime] = useState(0), [water, setWater] = useState(""), [sand, setSand] = useState(""), [jan, setJan] = useState(""), [jul, setJul] = useState("");
  const day = dailyRule(seed), st = STATIONS[tempStation(seed)], s = stats(st), iso = isoRule(seed), start = sandStart(seed);
  const bounds: [number, number] = [Math.floor(s.minT / 5) * 5, Math.ceil(s.maxT / 5) * 5];
  return <><Tabs tabs={["① 日气温", "② 年变化曲线", "③ 等温线", "④ 水沙实验"]} at={tab} set={setTab} />
    {tab === 0 && <div className="space-y-4"><DailyChart seed={seed} /><p className="text-sm text-muted">用 2、8、14、20 时的四个观测值计算日平均；用最高与最低气温计算日较差。</p><div className="grid gap-3 sm:grid-cols-3"><Select label="最高气温出现的时刻" value={peak} options={[6, 10, 14, 18].map(v => [String(v), `${v} 时`])} set={setPeak} /><NumberField label="日平均气温（℃）" value={mean} set={setMean} /><NumberField label="日较差（℃）" value={dailyRange} set={setDailyRange} /></div>{!ctx.done[0] && <button type="button" className="btn" disabled={!peak || !filled(mean, dailyRange)} onClick={() => peak === "14" && near(mean, day.mean, 0.1) && near(dailyRange, day.range, 0.2) ? ctx.complete(0, "日平均取四次观测值的平均，日较差是最高与最低气温之差。", { daily: { peak: 14, mean: Number(mean), range: Number(dailyRange) } }) : ctx.miss("读出最高、最低值，四次观测值相加后除以 4。")}>检查日气温</button>}</div>}
    {tab === 1 && <div className="space-y-4"><h3 className="font-bold">{st.name} · 各月平均气温</h3>{dataSource}<DataTable values={st.t} unit="℃" /><p className="text-sm text-muted">左右滑动查看完整表格和图表。在每个月的竖直区域按下并拖动描点，也可以聚焦后用上下键微调（0.5 ℃）。</p><TempChart values={curve} onChange={ctx.done[1] ? undefined : setCurve} range={bounds} title={`${st.name}气温年变化`} />
      <div className="grid gap-3 sm:grid-cols-3"><NumberField label="最热月气温（℃）" value={max} set={setMax} /><NumberField label="最冷月气温（℃）" value={min} set={setMin} /><NumberField label="气温年较差（℃）" value={range} set={setRange} /></div>
      {!ctx.done[1] && <button type="button" className="btn" onClick={() => curve.every((v, i) => v !== null && Math.abs(v - st.t[i]) <= 1) && near(max, s.maxT, 0.1) && near(min, s.minT, 0.1) && near(range, s.range, 0.2) ? ctx.complete(1, "曲线展现了气温的年变化。", { curve, annual: { max: Number(max), min: Number(min), range: Number(range) } }) : ctx.miss("检查每个月的描点，再用最高减去最低计算年较差。")}>检查曲线</button>}</div>}
    {tab === 2 && <div className="space-y-4"><IsoArt seed={seed} /><p className="text-sm text-muted">示意图不对应真实地区，观察数值和疏密，闭合区域放大显示。</p><div className="grid gap-3 sm:grid-cols-3"><Select label="气温降低方向" value={dir} options={["由南向北", "由北向南"].map(x => [x, x])} set={setDir} /><Select label="哪处气温差异大？" value={dense} options={["甲", "乙"].map(x => [x, x])} set={setDense} /><Select label="闭合中心" value={center} options={["高温中心", "低温中心"].map(x => [x, x])} set={setCenter} /></div>{!ctx.done[2] && <button type="button" className="btn" disabled={!dir || !dense || !center} onClick={() => dir === iso.dir && dense === iso.dense && center === iso.center ? ctx.complete(2, "等温线越密集，相同距离内的气温差异越大。", { iso: { dir, dense, center } }) : ctx.miss("看清北方与等温线数字，比较两处线的间距。")}>检查等温线</button>}</div>}
    {tab === 3 && <div className="space-y-4"><div className="rounded-xl bg-raised p-4"><p className="text-sm font-bold">阳光下的水和沙 · 示意数据</p><div className="mt-4 flex justify-center gap-12">{[["水", start + 3 * time / 120, "#78b9d4"], ["沙", start + 12 * time / 120, "#d7b47a"]].map(([name, value, color]) => <div key={String(name)} className="text-center"><svg viewBox="0 0 100 110" width="100" height="110"><path d="M20 12 L25 96 Q50 105 75 96 L80 12" fill={String(color)} stroke="#627a81" strokeWidth="3" /><text x="50" y="62" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#244351">{Number(value).toFixed(1)}℃</text></svg><b>{name}</b></div>)}</div><label className="mt-4 block text-sm">加热时间：{time} 分钟<input type="range" min="0" max="120" step="1" value={time} onChange={e => setTime(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><NumberField label="2 小时水升温（℃）" value={water} set={setWater} /><NumberField label="2 小时沙升温（℃）" value={sand} set={setSand} /><Select label="1 月同纬度陆地比海洋" value={jan} options={[["高", "高"], ["低", "低"]]} set={setJan} /><Select label="7 月同纬度陆地比海洋" value={jul} options={[["高", "高"], ["低", "低"]]} set={setJul} /></div>{!ctx.done[3] && <button type="button" className="btn" disabled={!filled(water, sand) || !jan || !jul} onClick={() => near(water, 3, 0.1) && near(sand, 12, 0.1) && jan === "低" && jul === "高" ? ctx.complete(3, "陆地升温和降温较快，海洋变化较慢。", { sand: { water: Number(water), sand: Number(sand), jan, jul } }) : ctx.miss("把滑杆拖到 120 分钟，比较水和沙的温度变化。")}>检查实验</button>}</div>}
  </>;
}
function Gauge({ level }: { level: number }) {
  return <svg viewBox="0 0 240 310" className="mx-auto w-full max-w-[300px] rounded-xl bg-canvas" role="img" aria-label="0 至 50 毫米雨量筒">
    <path d="M65 30 V270 Q120 282 175 270 V30" fill="none" stroke="#526e77" strokeWidth="3" />
    <path d={`M67 ${(270 - level * 4.8).toFixed(1)} H173 V268 Q120 278 67 268Z`} fill="#80c3de" opacity=".8" />
    <line x1="67" x2="173" y1={(270 - level * 4.8).toFixed(1)} y2={(270 - level * 4.8).toFixed(1)} stroke="#267ea6" strokeWidth="2" />
    {Array.from({ length: 51 }, (_, i) => <g key={i}><line x1="65" x2={i % 10 === 0 ? 85 : i % 5 === 0 ? 79 : 73} y1={(270 - i * 4.8).toFixed(1)} y2={(270 - i * 4.8).toFixed(1)} stroke="#39545e" /><text x="58" y={(274 - i * 4.8).toFixed(1)} textAnchor="end" fontSize="11" fill="var(--ink)">{i % 10 === 0 ? i : ""}</text></g>)}
    <text x="120" y="300" textAnchor="middle" fontSize="12" fill="var(--ink)">降水量 / mm</text>
  </svg>;
}
function RainWorld({ seed }: { seed: number }) {
  const answer = rainPairs(seed), other = (label: string) => label === "甲" ? "乙" : "甲";
  const points: [number, number, string][] = [[335, 165, `①${answer.equator}`], [345, 38, `①${other(answer.equator)}`], [510, 113, `②${answer.tropic}`], [150, 113, `②${other(answer.tropic)}`], [500, 70, `③${answer.midlat}`], [310, 70, `③${other(answer.midlat)}`]];
  return <svg viewBox="0 0 660 300" className="w-full rounded-xl bg-canvas" role="img" aria-label="理想大陆降水分布示意">
    <rect width="660" height="300" fill="#dceef3" rx="10" /><path d="M165 20 Q120 40 140 80 Q85 120 138 160 Q95 208 145 249 Q230 275 320 255 Q395 279 490 242 Q548 205 515 160 Q563 113 516 70 Q530 28 480 20Z" fill="#d8d4a9" stroke="#8c9c7a" strokeWidth="2" />
    {[[30, "北极圈"], [110, "北回归线"], [165, "赤道"], [220, "南回归线"], [275, "南极圈"]].map(([y, label]) => <g key={label}><line x1="20" x2="640" y1={y} y2={y} stroke="#6e9ca6" strokeDasharray="5 5" /><text x="22" y={Number(y) - 4} fontSize="11" fill="#356675">{label}</text></g>)}
    {points.map(([x, y, label]) => <g key={label}><circle cx={x} cy={y} r="7" fill="#176f8f" stroke="white" strokeWidth="2" /><text x={x + 10} y={y + 4} fontSize="13" fontWeight="bold" fill="#1a4859" paintOrder="stroke" stroke="#fff" strokeWidth="3">{label}</text></g>)}
    <text x="230" y="293" fontSize="11" fill="#356675">理想大陆示意：左西右东</text>
  </svg>;
}
function PrecipitationScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [gauge, setGauge] = useState(""), [bars, setBars] = useState<(number | null)[]>(Array(12).fill(null)), [annual, setAnnual] = useState(""), [wettest, setWettest] = useState<number[]>([]), [season, setSeason] = useState(""), [pairs, setPairs] = useState<Record<string, string>>({});
  const key = rainStation(seed), station = STATIONS[key], total = stats(station).annualP, max = Math.ceil(Math.max(...station.p) / 50) * 50, expected = wettestMonths(key), answer = rainPairs(seed);
  return <><Tabs tabs={["① 雨量筒", "② 降水柱状图", "③ 世界降水"]} at={tab} set={setTab} />
    {tab === 0 && <Two map={<Gauge level={gaugeLevel(seed)} />} side={<><p className="text-sm text-muted">每个小刻度是 1 mm，每 10 mm 标有数字，读出水面对应的刻度。</p><NumberField label="降水量（mm）" value={gauge} set={setGauge} />{!ctx.done[0] && <button type="button" className="btn" disabled={!filled(gauge)} onClick={() => near(gauge, gaugeLevel(seed), 1) ? ctx.complete(0, "降水量表示积水的深度。", { gauge: Number(gauge) }) : ctx.miss("从最近的整十刻度数一数小格。")}>确认读数</button>}</>} />}
    {tab === 1 && <div className="space-y-4"><h3 className="font-bold">{station.name} · 各月降水量</h3>{dataSource}<DataTable values={station.p} unit="mm" /><p className="text-sm text-muted">左右滑动查看完整表格和图表。在每个月竖直区域拖动柱顶，或聚焦后按上下键（每格 5 mm）。</p><PrecipChart values={bars} onChange={ctx.done[1] ? undefined : setBars} max={max} title={`${station.name}降水年变化`} />
      <NumberField label="年降水量（mm）" value={annual} set={setAnnual} /><div><p className="label mb-2">选择降水最多的 3 个月</p><div className="flex flex-wrap gap-2">{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <button type="button" key={m} className="choice" aria-pressed={wettest.includes(m)} onClick={() => setWettest(a => a.includes(m) ? a.filter(x => x !== m) : [...a, m])}>{m} 月</button>)}</div></div>
      <Select label="降水季节特点" value={season} options={[["summer", "夏季多雨"], ["winter", "冬季多雨"], ["even", "全年较均匀"]]} set={setSeason} />
      {!ctx.done[1] && <button type="button" className="btn" onClick={() => bars.every((v, i) => v !== null && Math.abs(v - station.p[i]) <= Math.max(10, station.p[i] * 0.1)) && near(annual, total, total * 0.05) && wettest.length === 3 && expected.every(m => wettest.includes(m)) && season === RAIN_SEASON[key] ? ctx.complete(1, "柱状图显示出一年中降水的季节变化。", { bars, rain: { annual: Number(annual), wettest, season } }) : ctx.miss("检查各月柱高、年降水总量和最多的三个月。")}>检查柱状图</button>}</div>}
    {tab === 2 && <div className="space-y-4"><RainWorld seed={seed} /><p className="text-sm text-muted">每一对中，选降水较多的一处。① 赤道附近与极地附近；② 回归线附近东岸与西岸；③ 中纬度沿海与内陆。</p>{[["equator", "① 赤道附近或极地附近"], ["tropic", "② 回归线附近东岸或西岸"], ["midlat", "③ 中纬度沿海或内陆"]].map(([k, label]) => <Select key={k} label={label} value={pairs[k] ?? ""} options={[["甲", "甲"], ["乙", "乙"]]} set={v => setPairs(p => ({ ...p, [k]: v }))} />)}{!ctx.done[2] && <button type="button" className="btn" disabled={Object.keys(pairs).length !== 3} onClick={() => Object.keys(answer).every(k => pairs[k] === answer[k]) ? ctx.complete(2, "赤道附近、回归线附近大陆东岸和中纬度沿海降水较多。", { pairs }) : ctx.miss("比较纬度、海陆位置和大陆东西岸。")}>检查分布</button>}</div>}
  </>;
}
function Landscape({ kind }: { kind: string }) {
  return <svg viewBox="0 0 180 90" className="w-full rounded-lg" role="img" aria-label={`${CLIMATE_TYPES[kind as ClimateType]}景观示意`}>
    <rect width="180" height="90" fill={kind === "polar" ? "#dceef5" : kind === "desert" ? "#f4e2bb" : "#d7e9e2"} />
    <path d="M0 68 Q55 56 110 68 T180 64 V90 H0Z" fill={kind === "polar" ? "#f7faf8" : kind === "desert" ? "#dcbf84" : "#93b57a"} />
    {kind === "rainforest" && [18, 50, 82, 114, 146].map(x => <g key={x}><rect x={x} y="42" width="5" height="28" fill="#775b3d" /><circle cx={x + 2} cy="35" r="18" fill="#30835b" /></g>)}
    {kind === "savanna" && <g><path d="M50 67 V37 M30 39 Q50 18 70 39Z" fill="#547f54" stroke="#786446" strokeWidth="3" />{[15, 85, 100, 140, 160].map(x => <path key={x} d={`M${x} 75 l-3 -9 m3 9 l4 -10`} stroke="#a48650" />)}</g>}
    {kind === "desert" && <><circle cx="145" cy="23" r="12" fill="#e5ae4a" /><path d="M0 78 Q40 46 80 78 Q120 51 180 80" fill="none" stroke="#bb945d" strokeWidth="3" /></>}
    {kind === "temperateMonsoon" && [32, 85, 138].map((x, i) => <g key={x}><rect x={x} y="45" width="5" height="23" fill="#795841" /><circle cx={x + 2} cy="36" r="18" fill={["#c5804b", "#9ab86b", "#d0ad5b"][i]} /></g>)}
    {kind === "polar" && <><path d="M0 70 L50 25 L82 58 L110 38 L180 70" fill="#c6e0e7" stroke="#86a8b5" /><path d="M30 45 L50 25 L65 41 L53 36 L45 43Z" fill="#fff" /></>}
  </svg>;
}
const latLabel = (lat: number) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
function ClimateScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [types, setTypes] = useState<Record<string, string>>({}), [lapse, setLapse] = useState(""), [factors, setFactors] = useState<Record<string, string>>({}), [scenes, setScenes] = useState<Record<string, string>>({});
  const stations = climateStations(seed), l = lapseRule(seed), sceneKeys = shuffleClimate(Object.keys(CLIMATE_SCENES), seed + 43), sceneOptions = shuffleClimate(Object.values(CLIMATE_SCENES), seed + 57);
  return <><Tabs tabs={["① 判断气候", "② 气候分布", "③ 影响因素", "④ 气候与景观"]} at={tab} set={setTab} />
    {tab === 0 && <div className="space-y-4"><p className="text-sm text-muted">先看冷热（最冷月、最热月），再看干湿（年降水量和季节分配）。</p><details className="rounded-xl bg-raised p-3 text-sm"><summary className="cursor-pointer font-bold">判读提示</summary><ol className="mt-2 list-decimal space-y-1 pl-5 leading-6"><li>海拔 ≥ 3000 m：高原山地气候；否则最热月 &lt; 10 ℃：寒带气候。</li><li>年降水 &lt; 250 mm 且最冷月 &gt; 10 ℃：热带沙漠气候。</li><li>最冷月 ≥ 15 ℃：每月降水 ≥ 60 mm 为热带雨林；否则年降水 ≥ 1500 mm 为热带季风；其余为热带草原。</li><li>最冷月 0～15 ℃：夏季降水少于冬季一半为地中海；否则最热月 &lt; 22 ℃ 为温带海洋性；其余为亚热带季风。</li><li>最冷月 &lt; 0 ℃：年降水 &lt; 400 mm 为温带大陆性；否则为温带季风。南半球的夏冬季与北半球相反。</li></ol></details>
      <div className="grid gap-4 md:grid-cols-3">{stations.map(k => { const st = STATIONS[k]; return <div key={k} className="space-y-2 rounded-xl border border-panel-border p-3"><ClimateChart t={st.t} p={st.p} title={st.name} subtitle={`${latLabel(st.at[1])} · 海拔 ${st.alt} m`} niceTicks />{dataSource}<Select label="选择气候类型" value={types[k] ?? ""} options={Object.entries(CLIMATE_TYPES)} set={v => setTypes(o => ({ ...o, [k]: v }))} /></div>; })}</div>
      {!ctx.done[0] && <button type="button" className="btn" disabled={stations.some(k => !types[k])} onClick={() => stations.every(k => types[k] === (STATIONS[k] as { type: ClimateType }).type) ? ctx.complete(0, "结合冷热、干湿和海拔判断气候类型。", { types }) : ctx.miss("对照提示，先看海拔和最冷月，再看降水。")}>检查气候类型</button>}</div>}
    {tab === 1 && <Sorter items={Object.fromEntries(shuffleClimate(Object.keys(ZONES), seed + 19).map(k => [k, climateNames[k]]))} cats={{ tropic: "热带", east: "中纬度大陆东岸", inland: "中纬度大陆内部", west: "中纬度大陆西岸", polar: "寒带" }} answer={ZONES} done={ctx.done[1]} onMiss={ctx.miss} onDone={zones => ctx.complete(1, "不同气候类型的分布受纬度和海陆位置影响。", { zones })} />}
    {tab === 2 && <div className="space-y-4"><p className="text-sm text-muted">给每个案例选择主要影响因素：</p>{shuffleClimate(Object.keys(FACTORS), seed + 29).map(k => <Select key={k} label={FACTORS[k as keyof typeof FACTORS][0]} value={factors[k] ?? ""} options={[["terrain", "地形"], ["latitude", "纬度位置"], ["sea", "海陆位置"]]} set={v => setFactors(o => ({ ...o, [k]: v }))} />)}
      <div className="rounded-xl bg-raised p-4"><p className="text-sm">山脚海拔 {l.base} m、气温 {l.temp} ℃；山顶比山脚高 {l.height} m。每升高 100 m，气温下降约 0.6 ℃。</p><div className="mt-3 max-w-xs"><NumberField label="山顶气温（℃）" value={lapse} set={setLapse} /></div></div>
      {!ctx.done[2] && <button type="button" className="btn" disabled={Object.keys(factors).length !== 3 || !filled(lapse)} onClick={() => Object.entries(pairsAnswer(FACTORS)).every(([k, v]) => factors[k] === v) && near(lapse, l.answer, 0.2) ? ctx.complete(2, "纬度、海陆位置和地形共同影响气候。", { factors, lapse: Number(lapse) }) : ctx.miss("对照案例选择因素，计算海拔每升高 100 m 的降温。")}>检查因素</button>}</div>}
    {tab === 3 && <div className="space-y-4"><p className="text-sm text-muted">给每种气候配上典型景观。</p>{sceneKeys.map(k => <div key={k} className="grid items-center gap-3 rounded-xl bg-raised p-3 sm:grid-cols-[150px_minmax(0,1fr)]"><Landscape kind={k} /><Select label={CLIMATE_TYPES[k as ClimateType]} value={scenes[k] ?? ""} options={sceneOptions.map(s => [s, s])} set={v => setScenes(o => ({ ...o, [k]: v }))} /></div>)}{!ctx.done[3] && <button type="button" className="btn" disabled={Object.keys(scenes).length !== 5} onClick={() => Object.entries(CLIMATE_SCENES).every(([k, v]) => scenes[k] === v) ? ctx.complete(3, "不同气候孕育不同的自然景观。", { scenes }) : ctx.miss("比较气候的冷热和干湿与植被、冰雪的关系。")}>检查景观</button>}</div>}
  </>;
}

const weatherArt = (type: SymbolKey) => <Art bg="#d9edf1"><rect x="45" y="24" width="230" height="130" rx="12" fill="#2b5362" /><text x="160" y="64" fontSize="18" textAnchor="middle" fill="white">天气预报</text><g transform="translate(120 75) scale(.8)"><WeatherSymbol type={type} /></g></Art>;
const config = (content: Omit<LessonConfig, "scene">, scene: (ctx: LessonCtx) => ReactNode): LessonConfig => ({ ...content, scene });
export const weather = (seed: number): LessonConfig => config({
  phenomenon: { question: "天气预报说“明天晴转多云，北风 3 级”，这些信息怎么看懂？", cards: [{ caption: "电视里的天气预报", art: weatherArt("cloudy") }, { caption: "院子里晾晒的衣服", art: <Art bg="#e5eee2"><line x1="30" y1="50" x2="290" y2="50" stroke="#6a7670" strokeWidth="3" /><path d="M80 54 h50 l-8 46 h-34Z M165 54 h45 l10 46 h-65Z" fill="#83b6c4" /><rect y="140" width="320" height="40" fill="#a8c989" /></Art> }] },
  guess: { question: "“昆明四季如春”说的是天气还是气候？", options: ["天气", "气候"], right: 1, reveal: "天气是短时间里的大气状况，气候是多年的平均状况。" },
  tasks: [["天气与气候", "辨别短时和多年"], ["天气符号", "识别符号和变化"], ["风向风力", "观察风向标"], ["按预报安排活动", "选择合适的日子"]],
  blanks: [{ text: ["天气是一个地区", "的大气状况。"], options: ["短时间里", "多年平均"] }, { text: ["天气预报通常要预告阴晴、气温、", "和风等情况。"], options: ["降水", "日出时间"] }, { text: ["风向是指风的", "。"], options: ["来向", "去向"] }, { text: ["风力等级越大，风力越", "。"], options: ["强", "弱"] }],
}, ctx => <WeatherScene ctx={ctx} seed={seed} />);
export const temperature = (seed: number): LessonConfig => config({
  phenomenon: { question: "为什么一天中最热的时候不是正午 12 点？为什么同纬度的内陆冬天比海边更冷？", cards: [{ caption: "午后的温度计", art: <Art bg="#f7e9cd"><rect x="140" y="30" width="35" height="105" rx="18" fill="#fff" stroke="#777" strokeWidth="3" /><circle cx="157" cy="135" r="20" fill="#d05a46" /><rect x="151" y="65" width="12" height="70" fill="#d05a46" /><circle cx="260" cy="45" r="22" fill="#eab456" /></Art> }, { caption: "同纬度的冬季海滨与内陆", art: <Art bg="#e2eef1"><path d="M0 125 H160 V180 H0Z" fill="#83b3c6" /><path d="M160 120 H320 V180 H160Z" fill="#e8e7df" /><path d="M200 120 V80 H245 V120Z" fill="#9fabb0" /><path d="M190 80 L223 55 L255 80Z" fill="#fff" /></Art> }] },
  guess: { question: "一天中气温最高一般出现在什么时候？", options: ["日出前后", "正午 12 时", "午后 2 时左右"], right: 2, reveal: "地面吸收太阳辐射后再把热量传给空气，所以最高气温出现在午后 2 时左右，最低气温在日出前后。" },
  tasks: [["日平均气温和日较差", "读取四次观测"], ["画气温年变化曲线", "描点并计算"], ["判读等温线", "方向、疏密和中心"], ["水沙实验", "比较海陆气温"]],
  blanks: [{ text: ["一天中最高气温出现在", "左右。"], options: ["午后 2 时", "正午 12 时", "日出前后"] }, { text: ["北半球陆地上，一年中", "月气温最高。"], options: ["7", "8", "6"] }, { text: ["一年内最高月平均气温与最低月平均气温的差叫", "。"], options: ["气温年较差", "气温日较差"] }, { text: ["世界年平均气温大致由低纬向高纬逐渐", "。"], options: ["降低", "升高"] }, { text: ["1 月，北半球同纬度陆地的气温比海洋", "。"], options: ["低", "高"] }],
}, ctx => <TemperatureScene ctx={ctx} seed={seed} />);
export const precipitation = (seed: number): LessonConfig => config({
  phenomenon: { question: "新闻说“局地日降水量可达 200 毫米”，这样的雨有多大？", cards: [{ caption: "测量降水的雨量器", art: <Art bg="#e4eef0"><path d="M100 35 H220 L205 70 V145 H115 V70Z" fill="#bddfe8" stroke="#607e8a" strokeWidth="4" /><path d="M115 110 H205 V145 H115Z" fill="#6fb5d1" /></Art> }, { caption: "大雨后积水的街道", art: <Art bg="#d5e3e7"><rect x="35" y="40" width="65" height="90" fill="#a4b5b9" /><rect x="210" y="28" width="65" height="105" fill="#a4b5b9" /><path d="M0 140 Q80 125 160 140 T320 140 V180 H0Z" fill="#82b5c8" />{[85, 145, 205, 265].map(x => <line key={x} x1={x} y1="20" x2={x - 10} y2="48" stroke="#6295ab" strokeWidth="3" />)}</Art> }] },
  guess: { question: "200 毫米降水平铺在地面上，积水大约有多深？", options: ["2 厘米", "20 厘米", "2 米"], right: 1, reveal: "降水量用毫米表示水层的深度，200 毫米就是 20 厘米深。" },
  tasks: [["读雨量筒", "读取降水深度"], ["画降水量柱状图", "描绘全年变化"], ["世界降水的分布规律", "比较纬度和海陆位置"]],
  blanks: [{ text: ["降水量的单位是", "。"], options: ["毫米", "厘米"] }, { text: ["赤道附近地区降水", "，两极地区降水少。"], options: ["多", "少"] }, { text: ["南北回归线两侧，大陆", "降水较多。"], options: ["东岸", "西岸"] }, { text: ["中纬度沿海地区降水较多，", "地区降水较少。"], options: ["内陆", "沿海"] }],
}, ctx => <PrecipitationScene ctx={ctx} seed={seed} />);
export const climate = (seed: number): LessonConfig => config({
  phenomenon: { question: "为什么新加坡一年四季都是夏天，伦敦夏天却很凉爽？", cards: [{ caption: "新加坡附近的热带雨林", art: <Art bg="#d8eddb">{[30, 80, 130, 180, 230, 280].map(x => <g key={x}><rect x={x} y="80" width="10" height="90" fill="#73573c" /><circle cx={x + 5} cy="75" r="35" fill="#39835b" /></g>)}</Art> }, { caption: "伦敦街头的夏日", art: <Art bg="#d9e8ed"><rect x="20" y="70" width="80" height="90" fill="#ad9c8e" /><rect x="220" y="55" width="80" height="105" fill="#bda99a" /><path d="M105 160 Q160 100 215 160Z" fill="#a5b5b9" /><circle cx="160" cy="100" r="12" fill="#d4aa86" /><rect x="148" y="113" width="24" height="40" fill="#496f7d" /></Art> }] },
  guess: { question: "气候和天气有什么不同？", options: ["气候是多年的天气平均状况，一般变化不大", "气候就是今天的天气", "气候每天都在剧烈变化"], right: 0, reveal: "气候是一个地区多年的天气平均状况；气温和降水是气候的两大要素。" },
  tasks: [["判断气候类型", "读真实测站气候图"], ["气候类型的分布", "按地区归类"], ["影响气候的因素", "判断案例并计算"], ["气候与景观", "匹配典型景观"]],
  blanks: [{ text: ["气温和", "是气候的两大要素。"], options: ["降水", "风向"] }, { text: ["热带的气候大致分布在", "之间。"], options: ["南、北回归线", "南、北极圈"] }, { text: ["在中纬度地区，大陆内部的气候较", "。"], options: ["干旱", "湿润"] }, { text: ["在山地，海拔每升高 100 米，气温约下降", "。"], options: ["0.6 ℃", "6 ℃"] }],
}, ctx => <ClimateScene ctx={ctx} seed={seed} />);
