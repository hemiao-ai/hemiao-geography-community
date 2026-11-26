"use client";
import { useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { LonLat } from "@/lib/china";
import { shuffleClimate as shuffle } from "@/lib/lessons-g7a-climate";
import { answersOfPairs, beltTargets, BELT_NAMES, CHANGES, choiceTargets, continentOrder, directionQuestions, directionsAnswer, fitStart, FOSSIL_ANSWER, legendTargets, mapRotation, MAP_CHOICES, MAP_TYPES, MOVES, oceanOrder, PLATE_CASES, PLATE_PAIRS, SCALE_MAPS, SCALE_ORDER, scaleLabels, scaleRule, straitTargets, trafficColor, trafficSpeeds } from "@/lib/lessons-g7a-maps";
import { BELTS, COMPASS, CONTINENTS, nearestRegion, OCEANS, STRAITS, SYMBOL_NAMES, TOWNS, type MapPoint } from "@/lib/world-maps";
import { SchematicMap, MapSymbol } from "@/components/geo/SchematicMap";
import { MapPin, TdtMap } from "@/components/geo/TdtMap";
import { Art, numInput } from "./LabKit";
import { Choice, Tabs, Two } from "./ChinaLessons";
import { Sorter, type LessonConfig, type LessonCtx } from "./LessonShell";

const bbox: [number, number, number, number] = [-180, -75, 180, 80];
const filled = (...v: string[]) => v.every(s => s.trim() !== "" && Number.isFinite(Number(s)));
const items = (o: Record<string, readonly [string, string]>, seed: number) => Object.fromEntries(shuffle(Object.keys(o), seed).map(k => [k, o[k][0]]));
function Select({ label, value, options, set, disabled }: { label: string; value: string; options: [string, string][]; set: (v: string) => void; disabled?: boolean }) {
  return <label className="block"><span className="label">{label}</span><select aria-label={label} className="mt-1.5 h-11 w-full rounded-[10px] border border-panel-border bg-panel-solid px-3 text-sm" value={value} disabled={disabled} onChange={e => set(e.target.value)}><option value="">请选择</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return <label className="block"><span className="label">{label}</span><input type="number" step="any" value={value} onChange={e => set(e.target.value)} className={numInput} /></label>;
}
const matches = (actual: Record<string, string>, expected: Record<string, string>) => Object.keys(expected).every(k => actual[k] === expected[k]);
function MapReadScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [mode, setMode] = useState<"default" | "arrow" | "graticule">("default"), [dirs, setDirs] = useState<Record<string, string>>({});
  const [dist, setDist] = useState(""), [perCm, setPerCm] = useState(""), [legend, setLegend] = useState<Record<string, string>>({});
  const questions = directionQuestions(seed), [to, from] = questions[mode], directionAnswer = directionsAnswer(seed), scale = scaleRule(seed), symbols = legendTargets(seed);
  return <><Tabs tabs={["① 辨别方向", "② 比例尺", "③ 地图图例"]} at={tab} set={setTab} />
    {tab === 0 && <div className="space-y-4"><div className="seg flex-wrap">{([["default", "一般地图"], ["arrow", "指向标"], ["graticule", "经纬网"]] as const).map(([k, label]) => <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}>{label}</button>)}</div>
      <Two map={<SchematicMap mode={mode} rotation={mapRotation(seed, mode)} />} side={<><p className="text-sm text-muted">虚构的禾苗县示意图。{mode === "default" ? "没有指向标和经纬网时，一般上北下南、左西右东。" : mode === "arrow" ? "按照指向标辨别方向。" : "经线指示南北，纬线指示东西；看经纬度变化判断方向。"}</p><p className="font-bold">{TOWNS[to].name}在{TOWNS[from].name}的什么方向？</p><Choice options={[...COMPASS]} picked={dirs[mode]} onPick={value => setDirs(v => ({ ...v, [mode]: value }))} disabled={ctx.done[0]} /><p className="text-xs text-muted">三种地图各选一次；已答 {Object.keys(dirs).length}/3</p>{!ctx.done[0] && <button type="button" className="btn" disabled={Object.keys(dirs).length !== 3} onClick={() => matches(dirs, directionAnswer) ? ctx.complete(0, "三种地图都能用适当的方法确定方向。", { dirs }) : ctx.miss("先辨别北方，再比较两个镇的方位。")}>检查方向</button>}</>} /></div>}
    {tab === 1 && <Two map={<SchematicMap scale={scale.segment} ruler />} side={<><p className="text-sm text-muted">拖动直尺量禾苗镇与东湖镇之间的直线距离；直尺的 10 小格与比例尺线段等长。</p><Field label="两镇的实地距离（千米）" value={dist} set={setDist} /><p className="text-sm">数字比例尺 1:{scale.denominator.toLocaleString("en-US").replaceAll(",", " ")}</p><Field label="图上 1 厘米代表实地多少千米？" value={perCm} set={setPerCm} />{!ctx.done[1] && <button type="button" className="btn" disabled={!filled(dist, perCm)} onClick={() => Math.abs(Number(dist) - scale.dist) <= scale.dist * .08 && Math.abs(Number(perCm) - scale.perCm) <= .001 ? ctx.complete(1, "比例尺是图上距离与实地距离之比。", { scale: { dist: Number(dist), perCm: Number(perCm) } }) : ctx.miss("先比较两镇的图上距离与比例尺线段，再换算厘米和千米。")}>检查比例尺</button>}</>} />}
    {tab === 2 && <div className="space-y-4"><p className="text-sm text-muted">给五个符号选择图例名称。</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{symbols.map(k => <div key={k} className="rounded-xl bg-raised p-4"><div className="flex justify-center"><MapSymbol symbol={k} /></div><Select label="图例名称" value={legend[k] ?? ""} options={symbols.map(id => [SYMBOL_NAMES[id], SYMBOL_NAMES[id]])} set={v => setLegend(o => ({ ...o, [k]: v }))} disabled={ctx.done[2]} /></div>)}</div>{!ctx.done[2] && <button type="button" className="btn" disabled={symbols.some(k => !legend[k])} onClick={() => symbols.every(k => legend[k] === SYMBOL_NAMES[k]) ? ctx.complete(2, "图例帮助我们读懂地图上的地理事物。", { legend }) : ctx.miss("观察线条、颜色和形状，重新辨认。")}>检查图例</button>}</div>}
  </>;
}
function MapChooseScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [order, setOrder] = useState<string[]>([]), [detail, setDetail] = useState(""), [choose, setChoose] = useState<Record<string, string>>({}), [traffic, setTraffic] = useState<Record<string, string>>({});
  const labels = scaleLabels(seed), keys = shuffle(Object.keys(SCALE_MAPS), seed + 43) as (keyof typeof SCALE_MAPS)[], targets = choiceTargets(seed), speeds = trafficSpeeds(seed);
  const extents: Record<keyof typeof SCALE_MAPS, [number, number, number, number]> = { county: [0, 0, 600, 400], town: [280, 200, 120, 80], center: [325, 230, 30, 20] };
  return <><Tabs tabs={["① 比例尺与详略", "② 按需选图", "③ 实时路况"]} at={tab} set={setTab} />
    {tab === 0 && <div className="space-y-4"><p className="text-sm text-muted">三幅图图幅相同，表示同一个虚构地区的不同比例尺。</p><div className="grid gap-3 md:grid-cols-3">{keys.map(k => <div key={k} className="rounded-xl border border-panel-border p-2"><SchematicMap extent={extents[k]} detail={k === "county" ? "low" : k === "town" ? "medium" : "high"} /><p className="mt-2 text-center text-sm font-bold">{labels[k]} · {SCALE_MAPS[k].title}</p><p className="text-center text-xs text-muted">1:{SCALE_MAPS[k].denominator.toLocaleString("en-US").replaceAll(",", " ")}</p></div>)}</div>
      <p className="text-sm font-bold">按比例尺从大到小依次点选：</p><div className="flex flex-wrap gap-2">{keys.map(k => <button key={k} type="button" className="choice" disabled={order.includes(k) || ctx.done[0]} onClick={() => setOrder(a => [...a, k])}>{labels[k]}</button>)}<button type="button" className="choice" disabled={ctx.done[0]} onClick={() => setOrder([])}>重选</button></div><p className="text-sm">已选：{order.map(k => labels[k]).join(" → ") || "等待选择"}</p>
      <Select label="内容最详细的是哪一幅？" value={detail} options={keys.map(k => [k, labels[k]])} set={setDetail} disabled={ctx.done[0]} />
      {!ctx.done[0] && <button type="button" className="btn" disabled={order.length !== 3 || !detail} onClick={() => SCALE_ORDER.every((k, i) => order[i] === k) && detail === "center" ? ctx.complete(0, "比例尺越大，范围越小，内容越详细。", { scaleOrder: order, detail }) : ctx.miss("分母越小，比例尺越大；比较地图的范围和细节。")}>检查比例尺与详略</button>}</div>}
    {tab === 1 && <div className="space-y-4"><p className="text-sm text-muted">根据需要选择适合的地图。</p>{targets.map(k => <Select key={k} label={MAP_CHOICES[k][0]} value={choose[k] ?? ""} options={Object.entries(MAP_TYPES)} set={v => setChoose(o => ({ ...o, [k]: v }))} disabled={ctx.done[1]} />)}{!ctx.done[1] && <button type="button" className="btn" disabled={targets.some(k => !choose[k])} onClick={() => targets.every(k => choose[k] === MAP_CHOICES[k][1]) ? ctx.complete(1, "不同用途需要选择不同的地图。", { choose }) : ctx.miss("想想每个问题需要哪一类地图信息。")}>检查选图</button>}</div>}
    {tab === 2 && <div className="space-y-4"><p className="text-sm text-muted">示意规则：平均车速大于 30 km/h 为绿色畅通；15～30 km/h 为黄色缓行；低于 15 km/h 为红色拥堵。</p><div className="grid gap-3 sm:grid-cols-2">{speeds.map((speed, i) => <div key={i} className="rounded-xl bg-raised p-4"><svg viewBox="0 0 240 56" className="w-full"><rect x="10" y="20" width="220" height="16" rx="8" fill="#9a9f9a" /><path d="M20 28 H220" stroke={traffic[i] === "green" ? "#309b66" : traffic[i] === "yellow" ? "#e7b235" : traffic[i] === "red" ? "#d85a4e" : "#fff"} strokeWidth="6" strokeDasharray={traffic[i] ? undefined : "8 8"} /></svg><p className="text-sm font-bold">第 {i + 1} 段 · 平均 {speed} km/h</p><Select label={`第 ${i + 1} 段路况`} value={traffic[i] ?? ""} options={[["green", "绿 · 畅通"], ["yellow", "黄 · 缓行"], ["red", "红 · 拥堵"]]} set={v => setTraffic(o => ({ ...o, [i]: v }))} /></div>)}</div>{!ctx.done[2] && <button type="button" className="btn" disabled={Object.keys(traffic).length !== 4} onClick={() => speeds.every((v, i) => traffic[i] === trafficColor(v)) ? ctx.complete(2, "实时路况根据用户位置和速度信息汇总。", { traffic }) : ctx.miss("对照示意规则，注意 15 和 30 都属于黄色。")}>检查路况</button>}</div>}
  </>;
}
function ContinentsScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [ocean, setOcean] = useState(50), [cont, setCont] = useState<Record<string, LonLat>>({}), [ocean4, setOcean4] = useState<Record<string, LonLat>>({});
  const [straits, setStraits] = useState<Record<string, { name: string; role: string }>>({});
  const continents = continentOrder(seed), oceans = oceanOrder(seed), locations = straitTargets(seed), nextCont = continents.find(k => !cont[k]), nextOcean = oceans.find(k => !ocean4[k]);
  const changeStrait = (key: string, field: "name" | "role", value: string) => setStraits(o => ({ ...o, [key]: { name: o[key]?.name ?? "", role: o[key]?.role ?? "", [field]: value } }));
  return <><Tabs tabs={["① 海陆比例", "② 七大洲", "③ 四大洋", "④ 海峡和运河"]} at={tab} set={setTab} />
    {tab === 0 && <Two map={<svg viewBox="0 0 300 260" className="w-full rounded-xl bg-canvas" role="img" aria-label="海陆面积比例估计"><circle cx="150" cy="125" r="80" fill="none" stroke="#cbaa78" strokeWidth="55" /><circle cx="150" cy="125" r="80" fill="none" stroke="#4ba4c4" strokeWidth="55" strokeDasharray={`${((ctx.done[0] ? 71 : ocean) / 100 * 502.65).toFixed(1)} 502.7`} transform="rotate(-90 150 125)" /><text x="150" y="119" textAnchor="middle" fontWeight="bold" fontSize="18" fill="var(--ink)">海洋 {ctx.done[0] ? "71" : ocean}%</text><text x="150" y="142" textAnchor="middle" fontSize="14" fill="var(--muted)">陆地 {ctx.done[0] ? "29" : 100 - ocean}%</text></svg>} side={<><p className="text-sm text-muted">拖动滑杆，估计地球表面海洋的面积比例。</p><label className="block text-sm font-bold">海洋约 {ocean}%<input type="range" min="0" max="100" value={ocean} onChange={e => setOcean(Number(e.target.value))} disabled={ctx.done[0]} className="mt-3 w-full accent-[var(--accent)]" /></label>{!ctx.done[0] && <button type="button" className="btn" onClick={() => Math.abs(ocean - 71) <= 3 ? ctx.complete(0, "地球表面约 71% 是海洋，约 29% 是陆地。", { ocean }) : ctx.miss("再想想：地球表面的海洋接近七成。")}>确认比例</button>}{ctx.done[0] && <p className="text-sm font-bold text-good">海洋 71%，陆地 29%。</p>}</>} />}
    {(tab === 1 || tab === 2) && <div className="space-y-4"><p className="text-sm text-muted">依次点击目标的大致位置。{(tab === 1 ? nextCont : nextOcean) && <b className="text-ink"> 现在寻找：{tab === 1 && nextCont ? CONTINENTS[nextCont].name : nextOcean ? OCEANS[nextOcean].name : ""}</b>}</p>
      <TdtMap base="vec" labels={false} bbox={bbox} z={2} onPick={p => {
        const region = tab === 1 ? CONTINENTS : OCEANS, next = tab === 1 ? nextCont : nextOcean, order = tab === 1 ? continents : oceans;
        if (!next || ctx.done[tab]) return;
        if (nearestRegion(p, region) !== next) return ctx.miss(`这里不是${region[next].name}，请再找找。`);
        const found = { ...(tab === 1 ? cont : ocean4), [next]: p };
        if (tab === 1) setCont(found); else setOcean4(found);
        if (order.every(k => found[k])) ctx.complete(tab, tab === 1 ? "七大洲都找到了。" : "四大洋中，太平洋最大，北冰洋最小。", tab === 1 ? { cont: found } : { ocean4: found });
        else ctx.say(`找到了${region[next].name}。`);
      }}>{Object.entries(tab === 1 ? cont : ocean4).map(([key, at]) => <MapPin key={key} at={at} label={(tab === 1 ? CONTINENTS : OCEANS)[key].name} color="var(--good)" />)}</TdtMap>
      <div className="flex flex-wrap gap-2">{(tab === 1 ? continents : oceans).map(k => <span key={k} className="rounded-full bg-raised px-3 py-1 text-sm">{(tab === 1 ? cont : ocean4)[k] ? "✓ " : ""}{(tab === 1 ? CONTINENTS : OCEANS)[k].name}</span>)}</div>{tab === 2 && ctx.done[2] && <p className="text-sm font-bold">太平洋最大，北冰洋最小。</p>}</div>}
    {tab === 3 && <div className="space-y-4"><p className="text-sm text-muted">按地图上字母的位置，分别选择海峡或运河的名称和作用。</p><TdtMap base="vec" labels={false} bbox={bbox} z={2}>{locations.map((k, i) => <MapPin key={k} at={STRAITS[k].at} label={"ABCD"[i]} />)}</TdtMap>
      <div className="grid gap-4 sm:grid-cols-2">{locations.map((k, i) => <div key={k} className="space-y-2 rounded-xl bg-raised p-3"><b>{`地点 ${"ABCD"[i]}`}</b><Select label="名称" value={straits[k]?.name ?? ""} options={Object.values(STRAITS).map(v => [v.name, v.name])} set={v => changeStrait(k, "name", v)} /><Select label="作用" value={straits[k]?.role ?? ""} options={Object.values(STRAITS).map(v => [v.role, v.role])} set={v => changeStrait(k, "role", v)} /></div>)}</div>
      {!ctx.done[3] && <button type="button" className="btn" disabled={locations.some(k => !straits[k]?.name || !straits[k]?.role)} onClick={() => locations.every(k => straits[k].name === STRAITS[k].name && straits[k].role === STRAITS[k].role) ? ctx.complete(3, "海峡和运河联系海洋，也有些是大洲分界。", { straits }) : ctx.miss("观察各地点连接的海洋和相邻大洲。")}>检查海峡和运河</button>}</div>}
  </>;
}
function FitPuzzle({ fit, setFit, disabled }: { fit: MapPoint; setFit: (p: MapPoint) => void; disabled: boolean }) {
  const id = useId().replaceAll(":", ""), drag = useRef<MapPoint | null>(null);
  const left = "M30 40 H270 C300 65 245 95 270 120 C300 145 245 175 270 200 H30Z", right = "M270 40 H480 V200 H270 C245 175 300 145 270 120 C245 95 300 65 270 40Z";
  const coords = (e: PointerEvent<SVGGElement>): MapPoint => { const svg = e.currentTarget.ownerSVGElement, m = svg?.getScreenCTM(); if (!svg || !m) return [0, 0]; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse()); return [q.x, q.y]; };
  const stripe = (side: "left" | "right") => <g clipPath={`url(#fit-${side}-${id})`}><rect x="0" y="90" width="510" height="18" fill="#d09a68" /><rect x="0" y="147" width="510" height="17" fill="#a4ad7c" /><circle cx={side === "left" ? 245 : 292} cy="128" r="6" fill="#765041" /><text x={side === "left" ? 192 : 302} y="132" fontSize="11" fill="#593f35">中龙化石</text></g>;
  return <svg viewBox="0 0 620 250" className="w-full touch-none rounded-xl bg-[#d8edf0]" role="img" aria-label="大陆拼合示意图">
    <defs><clipPath id={`fit-left-${id}`}><path d={left} /></clipPath><clipPath id={`fit-right-${id}`}><path d={right} /></clipPath></defs>
    <path d={left} fill="#e4c49c" stroke="#816345" strokeWidth="2" />{stripe("left")}
    <g transform={`translate(${fit[0].toFixed(1)} ${fit[1].toFixed(1)})`} role="slider" tabIndex={disabled ? -1 : 0} aria-label="拖动右侧大陆" className={disabled ? "" : "cursor-move"}
      onPointerDown={e => { if (disabled) return; const p = coords(e); drag.current = [p[0] - fit[0], p[1] - fit[1]]; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!drag.current) return; const p = coords(e); setFit([Math.max(-40, Math.min(140, p[0] - drag.current[0])), Math.max(-38, Math.min(48, p[1] - drag.current[1]))]); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={e => { if (disabled) return; const delta: Record<string, MapPoint> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }; if (!delta[e.key]) return; e.preventDefault(); setFit([fit[0] + delta[e.key][0], fit[1] + delta[e.key][1]]); }}>
      <path d={right} fill="#e4c49c" stroke="#816345" strokeWidth="2" />{stripe("right")}
    </g><text x="310" y="235" fontSize="12" fill="#42646d" textAnchor="middle">抽象示意，不对应真实海岸线</text>
  </svg>;
}
function PlateCrossSection({ move, amount }: { move: "collide" | "rift"; amount: number }) {
  const p = amount / 100, gap = (p * 50).toFixed(1), peak = (100 - p * 64).toFixed(1);
  return <svg viewBox="0 0 500 200" className="w-full rounded-xl bg-canvas" role="img" aria-label={move === "collide" ? "板块碰撞示意剖面" : "板块张裂示意剖面"}>
    <rect width="500" height="200" fill="#dfeef1" /><rect y="130" width="500" height="70" fill="#d5ae83" />
    {move === "collide" ? <><path d={`M0 130 L${(230 - p * 18).toFixed(1)} 130 L250 ${peak} L${(270 + p * 18).toFixed(1)} 130 H500 V160 H0Z`} fill="#9eaa80" stroke="#737e5e" strokeWidth="2" /><path d="M75 104 H175 M165 96 L175 104 L165 112 M425 104 H325 M335 96 L325 104 L335 112" fill="none" stroke="#915e42" strokeWidth="4" /><text x="250" y="190" textAnchor="middle" fill="#5e4b3a" fontSize="14">相向挤压 · 隆起山脉</text></>
      : <><path d={`M0 130 H${(250 - p * 50).toFixed(1)} V170 H0Z M${(250 + p * 50).toFixed(1)} 130 H500 V170 H${(250 + p * 50).toFixed(1)}Z`} fill="#9eaa80" stroke="#737e5e" strokeWidth="2" /><rect x={(250 - p * 50).toFixed(1)} y="130" width={(p * 100).toFixed(1)} height="40" fill="#73b6cc" /><path d="M160 104 H60 M70 96 L60 104 L70 112 M340 104 H440 M430 96 L440 104 L430 112" fill="none" stroke="#915e42" strokeWidth="4" /><text x="250" y="190" textAnchor="middle" fill="#5e4b3a" fontSize="14">背向张裂 · 裂谷进而形成海洋</text></>}
    <text x="15" y="23" fontSize="11" fill="#526c72">示意剖面 · 位移 {gap}</text>
  </svg>;
}
function PlatesScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [fit, setFit] = useState<MapPoint>(() => fitStart(seed)), [fossil, setFossil] = useState("");
  const [plateData, setPlateData] = useState<Record<string, { move: string; pair: string }>>({}), [move, setMove] = useState<"collide" | "rift">("collide"), [amount, setAmount] = useState(50);
  const keys = shuffle(Object.keys(PLATE_CASES), seed + 151), belts = beltTargets(seed);
  const setPlate = (k: string, field: "move" | "pair", value: string) => setPlateData(o => ({ ...o, [k]: { move: o[k]?.move ?? "", pair: o[k]?.pair ?? "", [field]: value } }));
  return <><Tabs tabs={["① 变迁原因", "② 拼合大陆", "③ 板块运动", "④ 火山地震带"]} at={tab} set={setTab} />
    {tab === 0 && <Sorter items={items(CHANGES, seed + 149)} cats={{ crust: "地壳运动", sea: "海平面升降", human: "人类活动" }} answer={answersOfPairs(CHANGES)} done={ctx.done[0]} onMiss={ctx.miss} onDone={change => ctx.complete(0, "地壳运动、海平面升降和人类活动都可能引起海陆变迁。", { change })} />}
    {tab === 1 && <div className="space-y-4"><p className="text-sm text-muted">示意图：拖动右块大陆，使凹凸边缘、地层和化石对齐。也可聚焦右块后用方向键移动。</p><FitPuzzle fit={fit} setFit={setFit} disabled={ctx.done[1]} /><Select label="大西洋两岸都发现了同种古爬行动物化石，最合理的解释是" value={fossil} options={[FOSSIL_ANSWER, "动物游过了大西洋", "只是巧合"].map(v => [v, v])} set={setFossil} />{!ctx.done[1] && <button type="button" className="btn" disabled={!fossil} onClick={() => Math.hypot(...fit) <= 12 && fossil === FOSSIL_ANSWER ? ctx.complete(1, "相似的地层和化石说明大陆可能曾经相连。", { fit, fossil }) : ctx.miss("继续调整位置，让边缘和色带对齐，再判断化石的意义。")}>检查拼合</button>}</div>}
    {tab === 2 && <div className="space-y-4"><div className="grid items-start gap-4 lg:grid-cols-2"><div className="space-y-3"><p className="font-bold">板块运动示意</p><Choice options={["碰撞挤压", "张裂"]} picked={MOVES[move]} onPick={v => setMove(v === "碰撞挤压" ? "collide" : "rift")} /><PlateCrossSection move={move} amount={amount} /><label className="block text-sm">运动过程<input type="range" min="0" max="100" value={amount} onChange={e => setAmount(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label></div><div className="space-y-3">{keys.map(k => <div key={k} className="space-y-2 rounded-xl bg-raised p-3"><p className="text-sm font-bold">{PLATE_CASES[k as keyof typeof PLATE_CASES].text}</p><Select label="运动方式" value={plateData[k]?.move ?? ""} options={Object.entries(MOVES)} set={v => setPlate(k, "move", v)} /><Select label="板块对" value={plateData[k]?.pair ?? ""} options={Object.entries(PLATE_PAIRS)} set={v => setPlate(k, "pair", v)} /></div>)}</div></div>{!ctx.done[2] && <button type="button" className="btn" disabled={keys.some(k => !plateData[k]?.move || !plateData[k]?.pair)} onClick={() => keys.every(k => plateData[k].move === PLATE_CASES[k as keyof typeof PLATE_CASES].move && plateData[k].pair === PLATE_CASES[k as keyof typeof PLATE_CASES].pair) ? ctx.complete(2, "板块碰撞挤压或张裂，会引起山脉和海洋的变化。", { plates: plateData }) : ctx.miss("先判断碰撞还是张裂，再对照现象附近的板块。")}>检查板块运动</button>}</div>}
    {tab === 3 && <div className="space-y-4"><p className="text-sm text-muted">把四处火山地震活动地点归入对应地带。</p><TdtMap base="ter" labels={false} bbox={bbox} z={2}>{belts.map(k => <MapPin key={k} at={BELTS[k].at} label={BELTS[k].name} />)}</TdtMap><Sorter items={Object.fromEntries(belts.map(k => [k, BELTS[k].name]))} cats={BELT_NAMES} answer={Object.fromEntries(belts.map(k => [k, BELTS[k].belt]))} done={ctx.done[3]} onMiss={ctx.miss} onDone={picked => ctx.complete(3, "火山和地震主要集中在板块交界地带。", { belts: picked })} /></div>}
  </>;
}
const lesson = (content: Omit<LessonConfig, "scene">, scene: (ctx: LessonCtx) => ReactNode): LessonConfig => ({ ...content, scene });
export const mapread = (seed: number): LessonConfig => lesson({
  phenomenon: { question: "拿到一幅陌生的地图，怎样知道哪边是北、两地相距多远？", cards: [
    { caption: "景区导览图", art: <Art bg="#e5eddf"><rect x="65" y="22" width="190" height="140" rx="7" fill="#f5eed8" stroke="#688479" strokeWidth="3" /><path d="M80 130 Q140 40 235 100" fill="none" stroke="#bc8e66" strokeWidth="5" strokeDasharray="6 5" /><circle cx="110" cy="104" r="8" fill="#4b9f89" /><circle cx="214" cy="91" r="8" fill="#d48759" /><text x="155" y="52" fill="#365d60" fontSize="14">景区导览</text></Art> },
    { caption: "带经纬网的地图", art: <Art bg="#d9edf0"><rect x="45" y="25" width="230" height="130" rx="8" fill="#9fcfd9" /><path d="M65 50 Q115 20 160 60 T250 80 L220 130 H80Z" fill="#a4c796" />{[90, 140, 190, 240].map(x => <line key={x} x1={x} y1="25" x2={x} y2="155" stroke="#5a8997" />)}{[60, 90, 120].map(y => <line key={y} x1="45" y1={y} x2="275" y2={y} stroke="#5a8997" />)}</Art> },
  ] },
  guess: { question: "在地图上怎样辨别方向？", options: ["永远是上北下南", "一般上北下南；有指向标看指向标，有经纬网看经纬网", "看文字的朝向"], right: 1, reveal: "没有指向标和经纬网时上北下南；有指向标按指向标；有经纬网按经纬网：经线指示南北，纬线指示东西。" },
  tasks: [["辨别方向", "一般地图、指向标和经纬网"], ["比例尺", "量算两地距离"], ["图例", "识别常用地图符号"]],
  blanks: [{ text: ["面对一般地图，通常是“上北下南，左", "右东”。"], options: ["西", "东"] }, { text: ["在有指向标的地图上，要按照", "辨别方向。"], options: ["指向标", "上北下南"] }, { text: ["比例尺 = 图上距离 ÷", "。"], options: ["实地距离", "图上面积"] }, { text: ["地图上表示各种地理事物的符号和注记叫", "。"], options: ["图例", "比例尺"] }],
}, ctx => <MapReadScene ctx={ctx} seed={seed} />);
export const mapchoose = (seed: number): LessonConfig => lesson({
  phenomenon: { question: "坐高铁去外地旅行，一路上要用到哪些地图？", cards: [
    { caption: "高铁线路图", art: <Art bg="#ecf1ed"><path d="M35 120 Q100 40 175 100 T285 50" fill="none" stroke="#db8b62" strokeWidth="5" />{[[50, 103], [115, 76], [188, 100], [270, 58]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="8" fill="#fff" stroke="#a36143" strokeWidth="3" />)}<text x="160" y="150" textAnchor="middle" fill="#536e6b">高铁线路</text></Art> },
    { caption: "手机导航界面", art: <Art bg="#dceced"><rect x="100" y="12" width="120" height="156" rx="16" fill="#435b61" /><rect x="107" y="22" width="106" height="132" rx="5" fill="#e9ebda" /><path d="M120 145 L140 100 L160 90 L185 42" stroke="#378fae" strokeWidth="8" fill="none" /><circle cx="185" cy="42" r="8" fill="#d57d53" /></Art> },
  ] },
  guess: { question: "相同大小的地图，表示的范围越大，内容会怎样？", options: ["越详细", "越概略", "一样"], right: 1, reveal: "图幅相同时，比例尺越小，表示的范围越大、内容越概略。" },
  tasks: [["比例尺与详略", "比较三幅地图"], ["按需选图", "为情境选择地图"], ["手机地图的实时路况", "根据车速判断颜色"]],
  blanks: [{ text: ["相同图幅的地图，比例尺越大，表示的范围越", "。"], options: ["小", "大"] }, { text: ["相同图幅的地图，比例尺越大，内容越", "。"], options: ["详细", "概略"] }, { text: ["了解一个地区的行政区划，需要查阅", "。"], options: ["行政区划图", "交通图"] }, { text: ["手机地图的实时路况，来自大量手机用户的", "信息。"], options: ["位置和速度", "通话"] }],
}, ctx => <MapChooseScene ctx={ctx} seed={seed} />);
export const continents = (seed: number): LessonConfig => lesson({
  phenomenon: { question: "从太空看，地球更像一个“水球”，为什么叫“地球”？", cards: [
    { caption: "从太空看到的蓝色地球", art: <Art bg="#163548"><circle cx="160" cy="90" r="68" fill="#56a8c8" /><path d="M130 38 Q160 25 178 49 L167 70 L180 91 L155 108 L137 94 L119 100 L105 73Z M197 95 L210 108 L196 133 L180 130Z" fill="#91c490" /></Art> },
    { caption: "地球表面的海洋与陆地", art: <Art bg="#edf0df"><circle cx="160" cy="90" r="65" fill="#5dacc9" /><path d="M160 90 L160 25 A65 65 0 0 1 223 106Z" fill="#c7ab78" /><text x="74" y="100" fill="#346c80" fontSize="16">海洋</text><text x="234" y="100" fill="#876a46" fontSize="16">陆地</text></Art> },
  ] },
  guess: { question: "地球表面海洋和陆地哪个面积大？", options: ["海洋", "陆地", "差不多"], right: 0, reveal: "地球表面约 71% 是海洋，约 29% 是陆地。" },
  tasks: [["海陆比例", "估计海洋面积"], ["七大洲", "在天地图上寻找"], ["四大洋", "在天地图上寻找"], ["海峡和运河", "判断名称和作用"]],
  blanks: [{ text: ["地球表面约", "是海洋。"], options: ["71%", "29%"] }, { text: ["七大洲中面积最大的是", "。"], options: ["亚洲", "非洲"] }, { text: ["四大洋中面积最大的是", "。"], options: ["太平洋", "大西洋"] }, { text: ["亚洲和非洲的分界线是", "。"], options: ["苏伊士运河", "巴拿马运河"] }],
}, ctx => <ContinentsScene ctx={ctx} seed={seed} />);
export const plates = (seed: number): LessonConfig => lesson({
  phenomenon: { question: "喜马拉雅山脉的岩石里，为什么会有海螺和鱼的化石？", cards: [
    { caption: "高山岩石里的海洋生物化石", art: <Art bg="#e9e8dd"><path d="M0 150 L95 58 L140 95 L210 28 L320 150Z" fill="#a8ada1" /><path d="M180 132 Q195 110 215 124 Q227 138 211 147 Q197 151 194 138 Q194 128 205 130" fill="none" stroke="#725844" strokeWidth="4" /></Art> },
    { caption: "浅海海底的古森林遗迹", art: <Art bg="#b4dbe3"><path d="M0 150 Q160 125 320 150 V180 H0Z" fill="#8e9e82" />{[70, 140, 230].map(x => <path key={x} d={`M${x} 150 V95 M${x} 118 l-20 -20 M${x} 110 l18 -17`} fill="none" stroke="#6d6651" strokeWidth="7" />)}<path d="M0 30 H320" stroke="#e1f5f5" strokeWidth="4" /></Art> },
  ] },
  guess: { question: "地球表面的海陆分布是固定不变的吗？", options: ["自古就是这样", "一直在缓慢变化", "每年都会大变样"], right: 1, reveal: "地壳运动、海平面升降和人类活动，都会使海陆分布缓慢变化。" },
  tasks: [["变迁实例分类", "寻找变化原因"], ["拼合大陆", "观察地层和化石"], ["用板块运动解释现象", "模拟碰撞和张裂"], ["火山地震带", "归类活动地点"]],
  blanks: [{ text: ["造成海陆变迁的原因有地壳运动、", "和人类活动。"], options: ["海平面升降", "火山喷发"] }, { text: ["魏格纳提出了", "说。"], options: ["大陆漂移", "板块构造"] }, { text: ["全球大致划分为", "大板块。"], options: ["六", "七"] }, { text: ["板块与板块交界的地带，地壳比较", "。"], options: ["活跃", "稳定"] }, { text: ["两个板块碰撞，在陆地上常常形成", "。"], options: ["山脉", "裂谷"] }],
}, ctx => <PlatesScene ctx={ctx} seed={seed} />);
