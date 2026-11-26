"use client";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CLIMATE_CITIES, classifyChina, DISASTER_REGIONS, DISASTERS, FARM_CHOICES, FARM_REGIONS, FLOW, LANDFORMS, PROFILE_32N, QINLING_HUAIHE, QUAKE_ACTIONS, RAIN_BELT, RAIN_BELT_LABEL, RANGES, RIVER_POINTS, RIVER_SPLITS, silt, STEP_BOUNDS, stepOf, TYPHOON_TRACK, type ClimateType, type LonLat } from "@/lib/china";
import { climateCities, elevationAt, floodSpots, flowOrder, landformTargets, profileSamples, rainTarget, safeSpot } from "@/lib/lessons";
import { degDist } from "@/lib/mercator";
import { featurePoint, heightGrid, makeTerrain, FEATURES } from "@/lib/terrain";
import { MapLine, MapPin, TdtMap, useProj } from "@/components/geo/TdtMap";
import { ContourMap } from "@/components/geo/Terrain";
import { ClimateChart } from "@/components/geo/Charts";
import { Art } from "./LabKit";
import { Sorter, type LessonConfig, type LessonCtx } from "./LessonShell";

export const Tabs = ({ tabs, at, set }: { tabs: string[]; at: number; set: (i: number) => void }) => <div className="seg mb-4 flex-wrap">{tabs.map((t, i) => <button key={t} type="button" aria-pressed={at === i} onClick={() => set(i)}>{t}</button>)}</div>;
export const Choice = ({ options, onPick, disabled, picked }: { options: string[]; onPick: (o: string) => void; disabled?: boolean; picked?: string }) => <div className="flex flex-wrap gap-2">{options.map(o => <button key={o} type="button" className="choice" aria-pressed={picked === o} disabled={disabled} onClick={() => onPick(o)}>{o}</button>)}</div>;
export const Two = ({ map, side }: { map: ReactNode; side: ReactNode }) => <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]"><div>{map}</div><div className="space-y-4">{side}</div></div>;
export const Tag = ({ text, color = "var(--ink)" }: { text: string; color?: string }) => <text y={-12} fontSize={15} fontWeight={800} textAnchor="middle" fill={color} paintOrder="stroke" stroke="#fff" strokeWidth={4}>{text}</text>;

/* ======================= 2.1 地形：三级阶梯 ======================= */
function ProfileSvg({ marks }: { marks: number[] }) {
  const W = 520, H = 200, x = (lon: number) => 30 + ((lon - 80) / 41) * (W - 40), y = (h: number) => H - 24 - (h / 5200) * (H - 40);
  const pts = PROFILE_32N.map(([l, h]) => `${x(l).toFixed(1)},${y(h).toFixed(1)}`).join(" ");
  return <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[10px] bg-canvas">
    {[0, 1000, 2000, 3000, 4000, 5000].map(h => <g key={h}><line x1={30} x2={W - 10} y1={y(h)} y2={y(h)} stroke="var(--canvas-line)" /><text x={26} y={y(h) + 3} fontSize={9} textAnchor="end" fill="var(--muted)">{h}</text></g>)}
    <polygon points={`${x(80)},${y(0)} ${pts} ${x(121)},${y(0)}`} fill="var(--land)" /><polyline points={pts} fill="none" stroke="#7a5230" strokeWidth={2} />
    {[80, 90, 100, 110, 120].map(l => <text key={l} x={x(l)} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--muted)">{l}°E</text>)}
    {marks.map((l, i) => <g key={l} transform={`translate(${x(l).toFixed(1)} ${y(elevationAt(l)).toFixed(1)})`}><line y2={-22} stroke="var(--accent)" strokeWidth={2} /><circle cy={-28} r={9} fill="var(--accent)" /><text y={-24} fontSize={11} fontWeight={800} textAnchor="middle" fill="#fff">{"ABC"[i]}</text></g>)}
    <text x={W - 10} y={14} fontSize={10} textAnchor="end" fill="var(--muted)">沿北纬 32° 附近的地形剖面（m）</text>
  </svg>;
}
function Terrain3Scene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [first, setFirst] = useState<string[]>([]), [secondB, setSecondB] = useState<string[]>([]), [which, setWhich] = useState<"first" | "second">("first");
  const targets = landformTargets(seed), [found, setFound] = useState<Record<string, LonLat>>({}), samples = profileSamples(seed), [steps, setSteps] = useState<Record<number, number>>({});
  const toggle = (id: string) => (which === "first" ? setFirst : setSecondB)(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  const nextTarget = targets.find(t => !found[t]);
  const pick = (p: LonLat) => {
    if (tab !== 1 || !nextTarget || ctx.done[1]) return;
    if (degDist(p, LANDFORMS[nextTarget].at) > 3.2) return ctx.miss(`这里不是${LANDFORMS[nextTarget].name}，看看地形晕渲里的高低起伏。`);
    const next = { ...found, [nextTarget]: p }; setFound(next); ctx.say(`找到了${LANDFORMS[nextTarget].name}，它位于第${["一", "二", "三"][LANDFORMS[nextTarget].step - 1]}级阶梯。`);
    if (targets.every(t => next[t])) ctx.complete(1, "三个地形区都找到了。", { found: next });
  };
  return <div>
    <Tabs tabs={["① 阶梯分界线", "② 找地形区", "③ 读剖面", "④ 地势的影响"]} at={tab} set={setTab} />
    <Two map={<TdtMap base="ter" onPick={pick}>
      {tab === 0 && Object.entries(RANGES).map(([id, r]) => { const on = first.includes(id) ? "var(--danger)" : secondB.includes(id) ? "var(--accent)" : "#5b4a33";
        return <g key={id} className="cursor-pointer" onClick={e => { e.stopPropagation(); toggle(id); }}><MapLine line={r.line} color="transparent" width={22} /><MapLine line={r.line} color={on} width={first.includes(id) || secondB.includes(id) ? 7 : 4} label={<Tag text={r.name} color={on} />} /></g>; })}
      {tab === 1 && Object.entries(found).map(([id, p]) => <MapPin key={id} at={p} label={LANDFORMS[id].name} />)}
      {tab === 2 && <MapLine line={[[80, 32], [121, 32]]} color="var(--accent)" width={3} dash="10 8" />}
    </TdtMap>} side={<>
      {tab === 0 && <><p className="text-sm text-muted">点地图上的山脉，把它们分到两条分界线里。</p>
        <div className="seg"><button type="button" aria-pressed={which === "first"} onClick={() => setWhich("first")}>第一、二级阶梯分界（红）</button><button type="button" aria-pressed={which === "second"} onClick={() => setWhich("second")}>第二、三级阶梯分界（蓝）</button></div>
        <div className="text-sm"><b className="text-danger">一二级：</b>{first.map(i => RANGES[i].name).join("、") || "未选"}<br /><b className="text-accent">二三级：</b>{secondB.map(i => RANGES[i].name).join("、") || "未选"}</div>
        {!ctx.done[0] && <button type="button" className="btn" onClick={() => {
          const ok = (a: string[], b: readonly string[]) => a.length === b.length && b.every(x => a.includes(x));
          if (!ok(first, STEP_BOUNDS.first)) return ctx.miss("第一、二级阶梯的分界线是青藏高原的边缘：昆仑山脉—祁连山脉—横断山脉。");
          if (!ok(secondB, STEP_BOUNDS.second)) return ctx.miss("第二、三级阶梯的分界线自北向南是：大兴安岭—太行山脉—巫山—雪峰山。");
          ctx.complete(0, "两条分界线把我国地势分成三级阶梯，西高东低。", { bounds: { first, second: secondB } });
        }}>检查分界线</button>}</>}
      {tab === 1 && <><p className="text-sm text-muted">在地形晕渲图上依次点出下面的地形区：</p><div className="flex flex-wrap gap-2">{targets.map(t => <span key={t} className={`rounded-full px-3 py-1 text-sm font-bold ${found[t] ? "bg-good/15 text-good" : t === nextTarget ? "bg-ink text-bg" : "bg-raised"}`}>{found[t] ? "✓ " : ""}{LANDFORMS[t].name}</span>)}</div></>}
      {tab === 2 && <><ProfileSvg marks={samples} /><p className="text-sm text-muted">A、B、C 三处分别在第几级阶梯？（海拔 3500 m 以上为第一级，500～3500 m 多为第二级，500 m 以下多为第三级）</p>
        {samples.map((l, i) => <div key={l} className="flex items-center gap-3"><span className="w-20 text-sm font-bold">{"ABC"[i]}（{l}°E）</span><div className="seg">{[1, 2, 3].map(s => <button key={s} type="button" aria-pressed={steps[l] === s} onClick={() => setSteps(o => ({ ...o, [l]: s }))}>第{["一", "二", "三"][s - 1]}级</button>)}</div></div>)}
        {!ctx.done[2] && <button type="button" className="btn" disabled={samples.some(l => !steps[l])} onClick={() => samples.every(l => steps[l] === stepOf(elevationAt(l))) ? ctx.complete(2, "从青藏高原到四川盆地、再到长江中下游平原，地势一级级降低。", { steps }) : ctx.miss("读出每处的海拔，再对照阶梯的海拔范围。")}>确认</button>}</>}
      {tab === 3 && <><p className="text-sm text-muted">地势西高东低，对我国的河流有什么影响？</p><Choice disabled={ctx.done[3]} options={["许多大河自西向东流入海洋", "河流都向西流", "没有影响"]} onPick={o => o.startsWith("许多") ? ctx.complete(3, "长江、黄河等大河自西向东流，沟通东西交通；阶梯交界处落差大，水能丰富。") : ctx.miss("水往低处流，我国东部低、西部高。")} /></>}
    </>} />
  </div>;
}
export const terrain3 = (seed: number): LessonConfig => ({
  phenomenon: { question: "“一江春水向东流”：为什么我国的大河大多向东流？", cards: [
    { caption: "长江从青藏高原奔流而下，最终注入东海", art: <Art bg="#e8f2f7"><path d="M0 60 L60 50 L90 90 L150 110 L220 140 L320 160 V180 H0Z" fill="#c9a46a" /><path d="M20 58 Q100 100 180 125 T320 158" fill="none" stroke="#3a8bd1" strokeWidth={4} /></Art> },
    { caption: "从西到东乘火车，海拔从 4000 多米降到几十米", art: <Art bg="#f6efdc"><path d="M10 50 H110 V100 H210 V150 H310" fill="none" stroke="#7a5a35" strokeWidth={4} /><text x={60} y={40} fontSize={12} textAnchor="middle">第一级</text><text x={160} y={90} fontSize={12} textAnchor="middle">第二级</text><text x={260} y={140} fontSize={12} textAnchor="middle">第三级</text></Art> },
  ] },
  guess: { question: "我国地势的总体特点是", options: ["东高西低", "西高东低，呈阶梯状", "中间高四周低"], right: 1, reveal: "我国地势西高东低，呈三级阶梯状分布。" },
  tasks: [["找出阶梯分界线", "把山脉分到两条分界线"], ["找地形区", "在地形图上点出三个地形区"], ["读地形剖面", "判断三处所在阶梯"], ["地势的影响", "想一想河流流向"]],
  blanks: [{ text: ["我国地势", "。"], options: ["西高东低", "东高西低"] }, { text: ["地势呈", "状分布。"], options: ["三级阶梯", "四级阶梯"] }, { text: ["第一级阶梯主要是", "。"], options: ["青藏高原", "内蒙古高原"] }, { text: ["受地势影响，许多大河", "流。"], options: ["自西向东", "自东向西"] }],
  title: () => "中国地形图（天地图）",
  scene: ctx => <Terrain3Scene ctx={ctx} seed={seed} />,
});

/* ======================= 2.2 气候：季风与雨带 ======================= */
function WindArrows({ dir }: { dir: "winter" | "summer" }) {
  const P = useProj(), starts: LonLat[] = dir === "winter" ? [[100, 48], [108, 46], [116, 47]] : [[128, 22], [124, 27], [123, 31]];
  return <g>{starts.map((s, i) => { const e: LonLat = dir === "winter" ? [s[0] + 9, s[1] - 9] : [s[0] - 9, s[1] + 6], [a, b] = [P(s), P(e)];
    return <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={dir === "winter" ? "#2f6bd1" : "#e8862b"} strokeWidth={7} strokeLinecap="round" />
      <circle cx={b[0]} cy={b[1]} r={9} fill={dir === "winter" ? "#2f6bd1" : "#e8862b"} /></motion.g>; })}</g>;
}
function RainBelt({ month }: { month: number }) {
  const P = useProj(), lat = RAIN_BELT[month - 1]; if (lat === null) return null;
  const a = P([104, lat + 2.5]), b = P([123, lat - 2.5]);
  return <g><defs><filter id="rainblur"><feGaussianBlur stdDeviation="6" /></filter></defs><motion.rect initial={false} animate={{ x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1] }} rx={30} fill="#2f6bd1" opacity={0.35} filter="url(#rainblur)" /></g>;
}
function MonsoonScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [season, setSeason] = useState<"winter" | "summer">("winter"), [winter, setWinter] = useState(""), [summer, setSummer] = useState("");
  const [month, setMonth] = useState(3), target = rainTarget(seed), cities = climateCities(seed), [types, setTypes] = useState<Record<string, ClimateType>>({});
  const TYPES: ClimateType[] = ["热带季风气候", "亚热带季风气候", "温带季风气候", "温带大陆性气候", "高原山地气候"];
  return <div>
    <Tabs tabs={["① 冬夏季风", "② 雨带推移", "③ 气候图判读", "④ 南北分界"]} at={tab} set={setTab} />
    {tab === 2 ? <div className="space-y-4"><p className="text-sm text-muted">根据气候图判断三个城市的气候类型。提示：先看海拔，再看最冷月气温（≥15 ℃ 热带，≥0 ℃ 亚热带），最后看年降水量（≥400 mm 温带季风）。</p>
      <div className="grid gap-4 md:grid-cols-3">{cities.map((c, i) => { const d = CLIMATE_CITIES[c]; return <div key={c} className="space-y-2"><ClimateChart t={d.t} p={d.p} title={`${"甲乙丙"[i]}地（海拔 ${d.alt} m）`} />
        <select value={types[c] ?? ""} onChange={e => setTypes(o => ({ ...o, [c]: e.target.value as ClimateType }))} className="h-10 w-full rounded-[10px] border border-panel-border bg-panel-solid px-2 text-sm"><option value="">选择气候类型</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>; })}</div>
      {!ctx.done[2] && <button type="button" className="btn" disabled={cities.some(c => !types[c])} onClick={() => { const bad = cities.findIndex(c => types[c] !== classifyChina(CLIMATE_CITIES[c])); if (bad >= 0) return ctx.miss(`${"甲乙丙"[bad]}地不对，按“海拔 → 最冷月气温 → 年降水量”的顺序再判断。`); ctx.complete(2, `甲是${CLIMATE_CITIES[cities[0]].name}，乙是${CLIMATE_CITIES[cities[1]].name}，丙是${CLIMATE_CITIES[cities[2]].name}。`, { types }); }}>确认</button>}
    </div> : <Two map={<TdtMap base="vec">
      {tab === 0 && <WindArrows dir={season} />}
      {tab === 1 && <RainBelt month={month} />}
      {tab === 3 && <MapLine line={QINLING_HUAIHE} color="#cc4130" width={6} dash="14 8" label={<Tag text="秦岭—淮河" color="#cc4130" />} />}
    </TdtMap>} side={<>
      {tab === 0 && <><div className="seg"><button type="button" aria-pressed={season === "winter"} onClick={() => setSeason("winter")}>1 月（冬季）</button><button type="button" aria-pressed={season === "summer"} onClick={() => setSeason("summer")}>7 月（夏季）</button></div>
        <p className="text-sm text-muted">看地图上的风向箭头，选出冬、夏季风的风向：</p>
        <div className="space-y-2"><div className="flex items-center gap-2"><span className="w-16 text-sm font-bold">冬季风</span><Choice options={["西北风", "东南风", "西南风"]} picked={winter} onPick={setWinter} /></div><div className="flex items-center gap-2"><span className="w-16 text-sm font-bold">夏季风</span><Choice options={["西北风", "东南风", "东北风"]} picked={summer} onPick={setSummer} /></div></div>
        {!ctx.done[0] && <button type="button" className="btn" disabled={!winter || !summer} onClick={() => winter === "西北风" && summer === "东南风" ? ctx.complete(0, "冬季风从亚洲内陆吹来，寒冷干燥；夏季风从太平洋吹来，温暖湿润。", { winter, summer }) : ctx.miss("箭头从哪里吹向哪里？冬季从西北吹来，夏季从东南吹来。")}>确认</button>}</>}
      {tab === 1 && <><p className="text-[15px] font-bold">任务：让雨带来到<span className="text-accent">{target}</span></p>
        <label className="block"><span className="label">月份：{month} 月 · 雨带：{RAIN_BELT_LABEL(month)}</span><input type="range" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <p className="text-sm text-muted">夏季风推进，雨带从南向北移动；夏季风退却，雨带又南退。</p>
        {!ctx.done[1] && <button type="button" className="btn" onClick={() => RAIN_BELT_LABEL(month) === target ? ctx.complete(1, `${month} 月雨带在${target}。夏季风的进退决定了我国东部雨带的南北移动。`, { month }) : ctx.miss(`${month} 月雨带在“${RAIN_BELT_LABEL(month)}”，再拖一拖。`)}>就是这个月</button>}</>}
      {tab === 3 && <><p className="text-sm text-muted">秦岭—淮河一线是我国重要的地理分界线，它大致是：</p><Choice disabled={ctx.done[3]} options={["1 月 0 ℃ 等温线和 800 mm 年降水量线", "7 月 20 ℃ 等温线", "400 mm 年降水量线"]} onPick={o => o.startsWith("1 月") ? ctx.complete(3, "它也是亚热带和暖温带、湿润区和半湿润区的分界线。") : ctx.miss("这条线南北的冬季气温和降水差别最明显。")} /></>}
    </>} />}
  </div>;
}
export const monsoon = (seed: number): LessonConfig => ({
  phenomenon: { question: "同在 1 月，哈尔滨冰天雪地，海口却能下海游泳，为什么？", cards: [
    { caption: "1 月的哈尔滨冰雪大世界，气温零下 20 ℃", art: <Art bg="#e8f1fb">{[60, 120, 180, 240].map(x => <rect key={x} x={x} y={80} width={36} height={80} fill="#bfe0ff" stroke="#8ab" />)}<text x={160} y={50} fontSize={22} fontWeight={800} textAnchor="middle" fill="#2f6bd1">−20 ℃</text></Art> },
    { caption: "同一天的海口，人们在海滩上晒太阳", art: <Art bg="#cfeaf7"><rect y={120} width={320} height={60} fill="#f2dca6" /><circle cx={260} cy={50} r={24} fill="#ffcf4d" /><text x={100} y={60} fontSize={22} fontWeight={800} textAnchor="middle" fill="#cc4130">20 ℃</text></Art> },
  ] },
  guess: { question: "我国东部夏季降水多，主要因为", options: ["夏季风从海洋带来湿润空气", "冬季风带来降雪", "离太阳近"], right: 0, reveal: "夏季风从海洋吹来，带来丰沛降水，雨带随季风南北移动。" },
  tasks: [["冬夏季风的风向", "看风向箭头"], ["雨带的推移", "拖动月份"], ["判读气候图", "判断三地气候类型"], ["秦岭—淮河", "南北分界线"]],
  blanks: [{ text: ["我国东部广大地区属于", "气候。"], options: ["季风", "大陆性"] }, { text: ["冬季我国", "温差大。"], options: ["南北", "东西"] }, { text: ["夏季我国东部盛行", "。"], options: ["东南风", "西北风"] }, { text: ["夏季风的进退使", "南北移动。"], options: ["雨带", "山脉"] }, { text: ["1 月 0 ℃ 等温线大致沿", "一线。"], options: ["秦岭—淮河", "南岭"] }],
  title: () => "中国季风与气候",
  scene: ctx => <MonsoonScene ctx={ctx} seed={seed} />,
});

/* ======================= 2.3 河流与湖泊 ======================= */
function FlowChart({ data, label, active, onClick }: { data: number[]; label: string; active: boolean; onClick: () => void }) {
  const W = 240, H = 120, max = 130, pts = data.map((v, m) => `${24 + m * 18},${(H - 20 - (v / max) * (H - 30)).toFixed(1)}`).join(" ");
  return <button type="button" onClick={onClick} className={`rounded-[10px] border bg-panel-solid p-2 ${active ? "border-ink outline-2 outline-ink" : "border-panel-border"}`}>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full"><line x1={20} x2={W - 6} y1={H - 20} y2={H - 20} stroke="var(--muted)" /><polygon points={`24,${H - 20} ${pts} ${24 + 11 * 18},${H - 20}`} fill="#5d9be0" opacity={0.35} /><polyline points={pts} fill="none" stroke="#2f6bd1" strokeWidth={2} />{[1, 4, 7, 10].map(m => <text key={m} x={24 + (m - 1) * 18} y={H - 6} fontSize={9} textAnchor="middle" fill="var(--muted)">{m}月</text>)}</svg>
    <span className="block text-center text-sm font-bold">{label}</span></button>;
}
function Levee({ years, narrowed }: { years: number; narrowed: boolean }) {
  const bed = 150 - Math.min(90, silt(years) * 0.6), W = 420;
  return <svg viewBox={`0 0 ${W} 200`} className="w-full rounded-[10px] bg-canvas">
    <rect y={150} width={W} height={50} fill="#d9c79a" /><text x={20} y={145} fontSize={11} fill="var(--muted)">两岸地面</text>
    <path d={`M120 ${bed - 30} L150 ${Math.min(150, bed)} H270 L300 ${bed - 30} L330 ${bed - 30} L300 150 H120 L90 ${bed - 30}Z`} fill="#c8a76a" />
    <rect x={narrowed ? 175 : 150} y={bed - 22} width={narrowed ? 70 : 120} height={22} fill="#d1a85c" opacity={0.9} />
    <rect x={150} y={Math.min(150, bed)} width={120} height={150 - Math.min(150, bed)} fill="#b8925a" />
    {Array.from({ length: 8 }, (_, i) => <motion.circle key={i} r={2.5} fill="#8a6a3a" initial={{ cx: 160 + i * 12, cy: bed - 16 }} animate={{ cx: narrowed ? [180 + i * 8, 420] : [160 + i * 12, 170 + i * 12], cy: narrowed ? bed - 12 : [bed - 16, bed - 3] }} transition={{ repeat: Infinity, duration: narrowed ? 1.2 : 2.5, delay: i * 0.15 }} />)}
    <text x={210} y={bed - 32} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--ink)">{bed < 150 ? `河床高出地面约 ${Math.round((150 - bed) / 6)} m` : "河床与地面持平"}</text>
  </svg>;
}
function RiverScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [cj, setCj] = useState<string[]>([]), [hh, setHh] = useState<string[]>([]), order = flowOrder(seed), [pos, setPos] = useState<number | null>(null), [years, setYears] = useState(0), [narrow, setNarrow] = useState(false);
  const river = tab === 0 ? "changjiang" : "huanghe", picked = tab === 0 ? cj : hh, setPicked = tab === 0 ? setCj : setHh;
  return <div>
    <Tabs tabs={["① 长江分段", "② 黄河分段", "③ 汛期与凌汛", "④ 地上河"]} at={tab} set={setTab} />
    {tab < 2 ? <Two map={<TdtMap base="ter" labels z={5} bbox={tab === 0 ? [100, 25.5, 123, 35.5] : [94, 31.5, 121, 43]}>
      {Object.entries(RIVER_POINTS).filter(([, v]) => v.river === river).map(([k, v]) => <g key={k} className="cursor-pointer" onClick={() => setPicked(a => a.includes(k) ? a.filter(x => x !== k) : a.length < 2 ? [...a, k] : a)}><circle r={22} cx={0} fill="transparent" /><MapPin at={v.at} label={v.name} color={picked.includes(k) ? "var(--danger)" : "var(--accent)"} active={picked.includes(k)} /></g>)}
    </TdtMap>} side={<>
      <p className="text-sm text-muted">按从上游到下游的顺序，点出{tab === 0 ? "长江" : "黄河"}的两个分界点：先点“上游 / 中游”分界，再点“中游 / 下游”分界。</p>
      <div className="text-sm">已选：{picked.map(k => RIVER_POINTS[k].name).join(" → ") || "无"}</div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPicked([])}>重选</button>
      {!ctx.done[tab] && <button type="button" className="btn" disabled={picked.length !== 2} onClick={() => { const ans = RIVER_SPLITS[river]; if (picked.join() === ans.join()) ctx.complete(tab, tab === 0 ? "宜昌以上为上游，宜昌到湖口为中游，湖口以下为下游。" : "河口镇以上为上游，河口镇到桃花峪为中游，桃花峪以下为下游。", { [river]: picked }); else ctx.miss(tab === 0 ? "长江的分界点是三峡出口处和鄱阳湖入江处。" : "黄河的分界点在内蒙古的河口镇和河南的桃花峪。"); }}>确认</button>}
      {tab === 1 && <p className="text-xs text-muted">地图注记来自天地图。</p>}
    </>} />
    : tab === 2 ? <div className="space-y-3"><p className="text-sm text-muted">下面是长江和黄河下游某站各月流量的相对变化。哪一条是黄河？（提示：黄河下游春初、冬初有“凌汛”，汛期也较短）</p>
      <div className="grid max-w-xl grid-cols-2 gap-3">{order.map((r, i) => <FlowChart key={r} data={FLOW[r]} label={"甲乙"[i]} active={pos === i} onClick={() => setPos(i)} />)}</div>
      {!ctx.done[2] && <button type="button" className="btn" disabled={pos === null} onClick={() => order[pos!] === "huanghe" ? ctx.complete(2, "黄河 3 月和 12 月的小高峰是凌汛：河水从低纬流向高纬，冰坝阻水。长江汛期长、流量大。", { huanghePos: pos }) : ctx.miss("找一找哪条曲线在 3 月和 12 月有小高峰。")}>这是黄河</button>}
    </div>
    : <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]"><div><Levee years={years} narrowed={narrow} /></div><div className="space-y-3">
      <label className="block"><span className="label">泥沙淤积 {years} 年</span><input type="range" min={0} max={150} value={years} onChange={e => setYears(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
      <p className="text-sm text-muted">黄河中游流经黄土高原，带来大量泥沙，在下游平原沉积。人们不断加高河堤，河床越来越高。</p>
      <button type="button" className="choice" aria-pressed={narrow} onClick={() => setNarrow(n => !n)}>收窄河道（束水攻沙）</button>
      <p className="text-sm text-muted">治理黄河的根本措施是：</p><Choice disabled={ctx.done[3] || years < 60} options={["治理黄土高原的水土流失", "不断加高河堤", "把河水引走"]} onPick={o => o.startsWith("治理") ? ctx.complete(3, "加固大堤、束水攻沙能缓解问题，根本在于在黄土高原植树种草、减少泥沙来源。") : ctx.miss("泥沙从哪里来？只加高河堤，河床也会继续抬高。")} />{years < 60 && <p className="text-xs text-muted">先拖动淤积年数，看看河床的变化。</p>}
    </div></div>}
  </div>;
}
export const river = (seed: number): LessonConfig => ({
  phenomenon: { question: "黄河下游为什么会成为“悬河”？长江为什么被称为“黄金水道”？", cards: [
    { caption: "开封附近，黄河河床比城市地面还高", art: <Art><rect y={130} width={320} height={50} fill="#d9c79a" /><path d="M100 70 H220 L250 130 H70Z" fill="#c8a76a" /><rect x={110} y={60} width={100} height={12} fill="#d1a85c" /><rect x={20} y={100} width={30} height={30} fill="#9aa3b5" /><rect x={270} y={105} width={34} height={25} fill="#9aa3b5" /></Art> },
    { caption: "万吨货轮从长江口一路驶向武汉", art: <Art bg="#dbeeff"><rect y={110} width={320} height={70} fill="#7fb9d4" /><motion.g animate={{ x: [0, 160, 0] }} transition={{ repeat: Infinity, duration: 8 }}><rect x={40} y={92} width={80} height={20} fill="#cc4130" /><rect x={60} y={78} width={30} height={14} fill="#fff" /></motion.g></Art> },
  ] },
  guess: { question: "黄河下游成为“地上河”的主要原因是", options: ["中游带来大量泥沙在下游淤积", "下游降水太多", "河水太深"], right: 0, reveal: "黄河中游流经黄土高原，水土流失严重，泥沙在下游沉积，河床不断抬高。" },
  tasks: [["长江上中下游分界", "点出两个分界点"], ["黄河上中下游分界", "点出两个分界点"], ["汛期与凌汛", "辨认黄河的流量曲线"], ["地上河的形成与治理", "模拟泥沙淤积"]],
  blanks: [{ text: ["长江上游和中游的分界点是", "。"], options: ["宜昌", "湖口"] }, { text: ["长江中游和下游的分界点是", "。"], options: ["湖口", "南京"] }, { text: ["黄河下游春初、冬初可能出现", "。"], options: ["凌汛", "梅雨"] }, { text: ["黄河下游河床高出两岸地面，形成", "。"], options: ["地上河", "地下河"] }, { text: ["治理黄河的根本在于治理黄土高原的", "。"], options: ["水土流失", "土地盐碱化"] }],
  title: () => "中国的河流（天地图）",
  scene: ctx => <RiverScene ctx={ctx} seed={seed} />,
});

/* ======================= 4.1 农业：因地制宜 ======================= */
function FarmScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0), [focus, setFocus] = useState<string>("dongbei"), [north, setNorth] = useState(""), [south, setSouth] = useState("");
  const items = Object.fromEntries(Object.entries(FARM_REGIONS).map(([k, v]) => [k, `${v.name}：${v.cue}`])), cats = Object.fromEntries(FARM_CHOICES.map(c => [c, c]));
  return <div>
    <Tabs tabs={["① 因地制宜", "② 南方与北方", "③ 坡耕地怎么办"]} at={tab} set={setTab} />
    <Two map={<TdtMap base="ter">
      {tab === 0 && Object.entries(FARM_REGIONS).map(([k, v]) => <g key={k} className="cursor-pointer" onClick={() => setFocus(k)}><MapPin at={v.at} label={v.name} color={focus === k ? "var(--accent-2)" : "var(--accent)"} active={focus === k} /></g>)}
      {tab === 1 && <MapLine line={QINLING_HUAIHE} color="#cc4130" width={6} dash="14 8" label={<Tag text="秦岭—淮河" color="#cc4130" />} />}
      {tab === 2 && <MapPin at={[108, 37]} label="黄土高原" color="var(--accent-2)" active />}
    </TdtMap>} side={<>
      {tab === 0 && <><div className="rounded-[10px] bg-raised p-3 text-sm"><b>{FARM_REGIONS[focus].name}</b>：{FARM_REGIONS[focus].cue}</div><p className="text-xs text-muted">点地图上的地区看环境条件，再给每个地区选最合适的农业。</p>
        <div className="max-h-[420px] overflow-y-auto pr-1"><Sorter items={items} cats={cats} answer={Object.fromEntries(Object.entries(FARM_REGIONS).map(([k, v]) => [k, v.answer]))} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "根据热量、水分和地形安排农业，这就是因地制宜。", { assign: p })} /></div></>}
      {tab === 1 && <><p className="text-sm text-muted">以秦岭—淮河为界，我国北方和南方的耕地类型不同：</p>
        <div className="space-y-2"><div className="flex items-center gap-2"><span className="w-12 text-sm font-bold">北方</span><Choice options={["水田", "旱地"]} picked={north} onPick={setNorth} /></div><div className="flex items-center gap-2"><span className="w-12 text-sm font-bold">南方</span><Choice options={["水田", "旱地"]} picked={south} onPick={setSouth} /></div></div>
        {!ctx.done[1] && <button type="button" className="btn" disabled={!north || !south} onClick={() => north === "旱地" && south === "水田" ? ctx.complete(1, "北方降水较少，以旱地为主，种小麦、玉米；南方降水多、热量足，以水田为主，种水稻。", { north, south }) : ctx.miss("想一想南北方降水量的差别，水稻需要大量的水。")}>确认</button>}</>}
      {tab === 2 && <><p className="text-sm text-muted">黄土高原土质疏松、沟壑纵横，很多陡坡被开垦成耕地，水土流失严重。应该怎么做？</p><Choice disabled={ctx.done[2]} options={["退耕还林还草，修梯田、打淤地坝", "继续开垦更多陡坡", "全部改种水稻"]} onPick={o => o.startsWith("退耕") ? ctx.complete(2, "因地制宜：宜林则林、宜草则草、宜农则农。") : ctx.miss("陡坡开垦会加剧水土流失。")} /></>}
    </>} />
  </div>;
}
export const farm = (): LessonConfig => ({
  phenomenon: { question: "为什么东北多种玉米大豆，江南多种水稻，内蒙古多放牧？", cards: [
    { caption: "秋天的东北平原，一望无际的玉米和大豆", art: <Art bg="#f6efdc">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={10 + i * 26} y={70} width={8} height={100} fill="#d4a017" />)}</Art> },
    { caption: "江南水乡，农民在水田里插秧", art: <Art bg="#dbeeff"><rect y={100} width={320} height={80} fill="#7fb9d4" />{Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${20 + i * 30} 130 v-24 m0 8 l-6 -8 m6 8 l6 -8`} stroke="#2f8a55" strokeWidth={2} fill="none" />)}</Art> },
  ] },
  guess: { question: "决定一个地方适合发展什么农业的主要因素是", options: ["热量、水分和地形等自然条件", "只看人口多少", "随便安排"], right: 0, reveal: "农业要因地制宜，主要看热量、水分、地形和土壤。" },
  tasks: [["因地制宜", "给六个地区配农业"], ["南方与北方", "秦岭—淮河两侧的耕地"], ["坡耕地怎么办", "黄土高原的选择"]],
  blanks: [{ text: ["发展农业要", "。"], options: ["因地制宜", "千篇一律"] }, { text: ["我国南北方农业的分界线大致是", "。"], options: ["秦岭—淮河", "大兴安岭"] }, { text: ["南方耕地以", "为主。"], options: ["水田", "旱地"] }, { text: ["北方耕地以", "为主。"], options: ["旱地", "水田"] }, { text: ["西部草原地区以", "为主。"], options: ["畜牧业", "种植业"] }],
  title: () => "中国农业布局（天地图）",
  scene: ctx => <FarmScene ctx={ctx} />,
});

/* ======================= 5.1 自然灾害与防灾减灾 ======================= */
function Typhoon({ step }: { step: number }) {
  const P = useProj(), pts = TYPHOON_TRACK.map(P), at = pts[Math.min(step, pts.length - 1)];
  return <g><polyline points={pts.slice(0, step + 1).map(p => p.join(",")).join(" ")} fill="none" stroke="#cc4130" strokeWidth={4} strokeDasharray="8 6" />
    <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ originX: `${at[0]}px`, originY: `${at[1]}px` }}>
      <path d={`M${at[0]} ${at[1] - 22} a22 22 0 0 1 22 22 M${at[0]} ${at[1] + 22} a22 22 0 0 1 -22 -22`} stroke="#cc4130" strokeWidth={6} fill="none" /><circle cx={at[0]} cy={at[1]} r={7} fill="#cc4130" /></motion.g></g>;
}
function DisasterScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [step, setStep] = useState(0), [quake, setQuake] = useState<string[]>([]), [level, setLevel] = useState(200), [spot, setSpot] = useState<string | null>(null);
  const t = makeTerrain(seed), grid = heightGrid(t, 40), spots = floodSpots(seed);
  return <div>
    <Tabs tabs={["① 灾害多发区", "② 台风来了", "③ 地震避险", "④ 洪水避险"]} at={tab} set={setTab} />
    {tab < 2 ? <Two map={<TdtMap base="vec">
      {tab === 0 && Object.entries(DISASTERS).map(([k, v]) => <MapPin key={k} at={v.at} label={v.name} color="var(--danger)" />)}
      {tab === 1 && <Typhoon step={step} />}
    </TdtMap>} side={<>
      {tab === 0 && <Sorter items={Object.fromEntries(Object.entries(DISASTERS).map(([k, v]) => [k, v.name]))} cats={Object.fromEntries(DISASTER_REGIONS.map(r => [r, r]))} answer={Object.fromEntries(Object.entries(DISASTERS).map(([k, v]) => [k, v.answer]))} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "我国自然灾害种类多、分布广：东南沿海多台风，西南多地震和地质灾害，北方冬半年多寒潮。", { regions: p })} />}
      {tab === 1 && <><label className="block"><span className="label">台风移动（6 小时一格）</span><input type="range" min={0} max={TYPHOON_TRACK.length - 1} value={step} onChange={e => setStep(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <p className="text-sm text-muted">台风生成在西北太平洋，向西北方向移动，登陆我国东南沿海。台风登陆时，正确的做法是：</p>
        <Choice disabled={ctx.done[1] || step < TYPHOON_TRACK.length - 2} options={["待在室内，关好门窗，远离广告牌和大树", "去海边看大浪", "开车出门囤货"]} onPick={o => o.startsWith("待在") ? ctx.complete(1, "台风带来狂风、暴雨和风暴潮，要提前转移危险区人员，留在坚固的室内。") : ctx.miss("台风登陆时风大浪高，户外很危险。")} />{step < TYPHOON_TRACK.length - 2 && <p className="text-xs text-muted">先拖动滑块，看台风登陆。</p>}</>}
    </>} />
    : tab === 2 ? <div className="space-y-3"><p className="text-sm text-muted">在教学楼里感到强烈地震，选出所有正确的做法：</p>
      <div className="grid gap-2 sm:grid-cols-2">{Object.entries(QUAKE_ACTIONS).map(([k, [label]]) => <button key={k} type="button" className="choice justify-start" aria-pressed={quake.includes(k)} onClick={() => setQuake(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k])}>{label}</button>)}</div>
      {!ctx.done[2] && <button type="button" className="btn" disabled={!quake.length} onClick={() => { const right = Object.keys(QUAKE_ACTIONS).filter(k => QUAKE_ACTIONS[k][1]); if (quake.length === right.length && right.every(k => quake.includes(k))) ctx.complete(2, "震时就近躲避、护住头颈，震后有序撤到空旷地带；不乘电梯、不跳楼。", { quake }); else ctx.miss("再检查一下：有没有危险的做法，或者漏掉了正确的做法？"); }}>确认</button>}
    </div>
    : <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
      <ContourMap t={t}>
        {grid.slice(0, 40).flatMap((row, j) => row.slice(0, 40).map((h, i) => h < level ? <rect key={`${i}-${j}`} x={i / 40} y={j / 40} width={0.026} height={0.026} fill="#2f6bd1" opacity={0.45} /> : null))}
        {spots.map((f, i) => { const p = featurePoint(t, f); return <g key={f} className="cursor-pointer" onClick={() => setSpot(f)} transform={`translate(${p[0].toFixed(4)} ${p[1].toFixed(4)})`}><circle r={0.022} fill={spot === f ? "var(--danger)" : "#fff"} stroke="var(--ink)" strokeWidth={0.004} /><text y={0.009} fontSize={0.026} fontWeight={800} textAnchor="middle" fill={spot === f ? "#fff" : "var(--ink)"}>{"甲乙丙丁"[i]}</text></g>; })}
      </ContourMap>
      <div className="space-y-3"><label className="block"><span className="label">洪水水位 {level} m</span><input type="range" min={100} max={600} step={20} value={level} onChange={e => setLevel(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <p className="text-sm text-muted">暴雨后山洪暴发，水位不断上涨。甲、乙、丙、丁四处，往哪里转移最安全？</p>
        <div className="text-sm">已选：<b>{spot ? "甲乙丙丁"[spots.indexOf(spot as never)] : "无"}</b></div>
        {!ctx.done[3] && <button type="button" className="btn" disabled={!spot} onClick={() => spot === safeSpot(seed) ? ctx.complete(3, `这里是${FEATURES[spot as keyof typeof FEATURES]}，海拔最高。洪水来时要往高处转移，不要待在山谷和河边。`, { spot }) : ctx.miss("看等高线数值：哪一处海拔最高？山谷是洪水汇集的地方。")}>转移到这里</button>}</div>
    </div>}
  </div>;
}
export const disaster = (seed: number): LessonConfig => ({
  phenomenon: { question: "台风、地震、洪水来了，我们该怎么办？", cards: [
    { caption: "台风登陆，狂风暴雨中树木被吹弯", art: <Art bg="#9fb3c8">{Array.from({ length: 20 }, (_, i) => <motion.line key={i} x1={(i * 37) % 320} y1={0} x2={(i * 37) % 320 - 30} y2={60} stroke="#fff" strokeWidth={1.5} animate={{ y: [0, 120] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.05 }} />)}<path d="M200 180 Q215 120 250 90" stroke="#4a3a28" strokeWidth={6} fill="none" /></Art> },
    { caption: "学校里正在进行地震应急疏散演练", art: <Art><rect x={60} y={40} width={200} height={130} fill="#e8dfcb" stroke="var(--ink)" />{[90, 150, 210].map(x => <rect key={x} x={x - 15} y={110} width={30} height={20} fill="#a5733f" />)}<text x={160} y={80} fontSize={14} textAnchor="middle" fontWeight={700}>应急演练</text></Art> },
  ] },
  guess: { question: "发生洪水时，应该往哪里转移？", options: ["地势低的山谷", "地势高的地方", "河边"], right: 1, reveal: "洪水往低处流，要尽快向高处转移。" },
  tasks: [["灾害多发区", "给五种灾害配地区"], ["台风来了", "看台风路径"], ["地震避险", "选出正确做法"], ["洪水避险", "读等高线找安全地"]],
  blanks: [{ text: ["台风多影响我国的", "。"], options: ["东南沿海", "西北内陆"] }, { text: ["西南地区是", "、滑坡、泥石流多发区。"], options: ["地震", "寒潮"] }, { text: ["发生洪水时，要迅速转移到", "。"], options: ["高处", "低处"] }, { text: ["地震时，不能乘坐", "逃生。"], options: ["电梯", "楼梯"] }],
  title: () => "防灾减灾",
  scene: ctx => <DisasterScene ctx={ctx} seed={seed} />,
});
