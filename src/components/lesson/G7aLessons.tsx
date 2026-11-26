"use client";
import { useId, useState, type ReactNode } from "react";
import { CITIES, coordLabel, HABITABLE, hemisphereOf, HIERARCHY, PLANETS, SPACE_EVENTS, WORLD_FORMS, zoneDistance } from "@/lib/world";
import { FORMS, hemiPoints, LABELS, labelAnswer, LINES, pairsAnswer, planeSpeed, SCENES, SEAFLOOR, shuffle, timeline, timelineAnswer, treasureCities, worldTargets } from "@/lib/lessons-g7a";
import { bridgeLine, roadLine, settlementRiver, siteBest, sitePoints, siteRating, type Site } from "@/lib/settlement";
import { makeTerrain, type Pt } from "@/lib/terrain";
import { degDist } from "@/lib/mercator";
import type { LonLat } from "@/lib/china";
import { Globe, type View } from "@/components/geo/Globe";
import { ContourMap, tint } from "@/components/geo/Terrain";
import { MapPin, TdtMap } from "@/components/geo/TdtMap";
import { Art, Field } from "./LabKit";
import { Tabs, Two } from "./ChinaLessons";
import { Sorter, type LessonConfig, type LessonCtx } from "./LessonShell";

const items = (o: Record<string, readonly [string, string]>, seed: number) => Object.fromEntries(shuffle(Object.keys(o), seed).map(k => [k, o[k][0]]));
const cats = (o: Record<string, string>) => o;
const labels = (o: Record<string, string>, seed: number) => Object.fromEntries(Object.entries(labelAnswer(Object.keys(o), seed)).map(([label]) => [label, label]));

function Sequence({ options, answer, seed, done, ctx, task, dataKey, after, artwork, visual }: { options: Record<string, string>; answer: string[]; seed: number; done: boolean; ctx: LessonCtx; task: number; dataKey: string; after?: ReactNode; artwork?: (key: string) => ReactNode; visual?: (picked: string[]) => ReactNode }) {
  const [picked, setPicked] = useState<string[]>([]);
  const ordered = shuffle(Object.keys(options), seed);
  return <div className="space-y-4">{visual?.(done ? answer : picked)}<p className="text-sm text-muted">按顺序依次点选：</p>
    <div className={artwork ? "grid gap-3 sm:grid-cols-3" : "flex flex-wrap gap-2"}>{ordered.map(k => <button type="button" key={k} disabled={done || picked.includes(k)} className={artwork ? "choice flex-col gap-2 p-2" : "choice"} onClick={() => {
      if (answer[picked.length] !== k) return ctx.miss("顺序不对，再想一想。");
      const next = [...picked, k]; setPicked(next); if (next.length === answer.length) ctx.complete(task, "顺序正确！", { [dataKey]: next });
    }}>{artwork?.(k)}{options[k]}</button>)}</div>
    <p className="min-h-6 text-sm">已选：<b>{(done ? answer : picked).map(k => options[k]).join(" → ") || "等待选择"}</b></p>
    {done && after}
  </div>;
}
function HierarchyArt({ picked }: { picked: string[] }) {
  const layers = [{ key: "universe", rx: 290, ry: 128, y: 38 }, { key: "galaxy", rx: 230, ry: 98, y: 68 }, { key: "solar", rx: 150, ry: 65, y: 101 }, { key: "earth", rx: 58, ry: 30, y: 153 }];
  return <svg viewBox="0 0 640 300" className="w-full rounded-[10px]" role="img" aria-label="宇宙包含银河系、太阳系和地球的嵌套示意">
    <rect width="640" height="300" rx="10" fill="#142b3c" />
    {layers.map(({ key, rx, ry }) => <ellipse key={key} cx="320" cy="150" rx={rx} ry={ry} fill={picked.includes(key) ? "#3184a4" : "#203f52"} stroke={picked.includes(key) ? "#a7e5ef" : "#658692"} strokeWidth={picked.includes(key) ? 3 : 1.5} />)}
    {layers.map(({ key, y }) => <text key={key} x="320" y={y} textAnchor="middle" fill={picked.includes(key) ? "#fff" : "#bfd3d7"} fontWeight="bold" fontSize="15">{HIERARCHY[key as keyof typeof HIERARCHY]}{picked.includes(key) ? " ✓" : ""}</text>)}
  </svg>;
}
function SolarSystem({ picked }: { picked: string[] }) {
  const angles = [-70, -20, 35, 95, 148, 205, 245, 315];
  return <svg viewBox="0 0 640 300" className="w-full rounded-[10px]" role="img" aria-label="太阳系与八条行星轨道示意">
    <rect width="640" height="300" rx="10" fill="#142b3c" />
    {angles.map((_, i) => <ellipse key={i} cx="320" cy="150" rx={29 + i * 34} ry={17 + i * 16} fill="none" stroke="#a6c5ce" strokeOpacity=".36" />)}
    <circle cx="320" cy="150" r="14" fill="#f9bd4f" /><text x="320" y="154" fontSize="10" textAnchor="middle" fill="#573b16">太阳</text>
    {Object.entries(PLANETS).map(([key, name], i) => { if (!picked.includes(key)) return null; const a = angles[i] * Math.PI / 180, x = 320 + (29 + i * 34) * Math.cos(a), y = 150 + (17 + i * 16) * Math.sin(a);
      return <g key={key} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><circle r={[4, 5, 6, 5, 12, 10, 7, 7][i]} fill={["#aaa", "#dbaa6b", "#4ba5c8", "#c75c42", "#d4ae80", "#e4c697", "#9dd6d4", "#5b84bc"][i]} />{i === 5 && <ellipse rx="16" ry="4" fill="none" stroke="#e4c697" />}<text x="0" y="-16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">{name}</text></g>; })}
  </svg>;
}
function CosmosScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [hab, setHab] = useState<string[]>([]);
  const events = Object.fromEntries(timeline(seed).map(k => [k, SPACE_EVENTS[k as keyof typeof SPACE_EVENTS][1]]));
  return <><Tabs tabs={["① 天体层级", "② 八大行星", "③ 宜居条件", "④ 探索时间轴"]} at={tab} set={setTab} />
    {tab === 0 && <Sequence key="hierarchy" options={HIERARCHY} answer={Object.keys(HIERARCHY)} seed={seed + 1} done={ctx.done[0]} ctx={ctx} task={0} dataKey="hierarchy" visual={picked => <HierarchyArt picked={picked} />} />}
    {tab === 1 && <Sequence key="planets" options={PLANETS} answer={Object.keys(PLANETS)} seed={seed + 2} done={ctx.done[1]} ctx={ctx} task={1} dataKey="planets" visual={picked => <SolarSystem picked={picked} />} />}
    {tab === 2 && <div className="space-y-4"><div className="overflow-x-auto"><table className="w-full min-w-[450px] text-left text-sm"><thead><tr><th>行星</th><th>距日距离（地球为 1）</th><th>平均温度</th><th>环境</th></tr></thead><tbody>{[["金星", "0.72", "约 464℃", "浓厚二氧化碳大气"], ["地球", "1", "约 15℃", "有大气和液态水"], ["火星", "1.52", "约 -63℃", "大气稀薄"]].map(row => <tr key={row[0]} className="border-t border-panel-border">{row.map(c => <td key={c} className="py-2 pr-2">{c}</td>)}</tr>)}</tbody></table></div>
      <p className="text-sm font-bold">选出地球适宜生命存在的条件：</p><div className="grid gap-2 sm:grid-cols-2">{shuffle(Object.keys(HABITABLE), seed + 3).map(k => <button key={k} className="choice justify-start" type="button" aria-pressed={hab.includes(k)} disabled={ctx.done[2]} onClick={() => setHab(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k])}>{HABITABLE[k as keyof typeof HABITABLE]}</button>)}</div>
      {!ctx.done[2] && <button className="btn" type="button" onClick={() => hab.length === 3 && ["near", "mass", "water"].every(k => hab.includes(k)) ? ctx.complete(2, "温度、大气和液态水共同构成适宜生命的环境。", { habitable: hab }) : ctx.miss("再比较三颗行星的距离、温度和环境。")}>确认条件</button>}</div>}
    {tab === 3 && <Sequence key="timeline" options={events} answer={timelineAnswer(seed)} seed={seed + 4} done={ctx.done[3]} ctx={ctx} task={3} dataKey="timeline" after={<ol className="space-y-2">{timelineAnswer(seed).map(k => <li key={k} className="rounded-lg bg-raised p-2 text-sm"><b>{SPACE_EVENTS[k as keyof typeof SPACE_EVENTS][0]}</b> · {events[k]}</li>)}</ol>} />}
  </>;
}
const planetArt = (color: string, detail: string) => <Art bg="#142b3c"><circle cx="160" cy="90" r="55" fill={color} /><path d="M112 77 Q145 55 207 75 M113 100 Q155 120 205 94" fill="none" stroke={detail} strokeWidth="9" opacity=".65" /><circle cx="82" cy="43" r="2" fill="white" /><circle cx="250" cy="118" r="2" fill="white" /></Art>;
export const cosmos = (seed: number): LessonConfig => ({
  phenomenon: { question: "太阳系有八颗行星，为什么只有地球上有生命？", cards: [{ caption: "金星：浓厚云层，炽热", art: planetArt("#d99b56", "#f3d39a") }, { caption: "地球：蓝色，有水", art: planetArt("#328cbb", "#78b981") }, { caption: "火星：红色，寒冷", art: planetArt("#c56246", "#e1a180") }] },
  guess: { question: "地球为什么适合生命存在？", options: ["地球离太阳最近，最暖和", "地球距日适中、体积质量适中，有适宜的温度、大气和液态水", "地球是太阳系里最大的行星"], right: 1, reveal: "地球距离太阳不远不近，体积和质量不大不小，形成了适宜的温度、大气和液态水。" },
  tasks: [["天体层级", "从小到大排序"], ["八大行星排序", "由近及远"], ["宜居条件", "比较三颗行星"], ["太空探索时间轴", "按时间先后排序"]],
  blanks: [{ text: ["太阳系是", "的一小部分。"], options: ["银河系", "地月系"] }, { text: ["八大行星中，距离太阳最近的是", "。"], options: ["水星", "金星", "地球"] }, { text: ["地球距离太阳不远不近，体积和质量", "，形成了适宜生命存在的条件。"], options: ["不大不小", "最大", "最小"] }, { text: ["1970 年，我国第一颗人造地球卫星", "发射成功。"], options: ["东方红一号", "嫦娥一号", "神舟五号"] }],
  scene: ctx => <CosmosScene ctx={ctx} seed={seed} />,
});

function GlobeScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [hours, setHours] = useState(""), [view, setView] = useState<View>({ lon0: 100, lat0: 20 }), [hemi, setHemi] = useState<Record<string, string>>({}), [found, setFound] = useState<Record<string, LonLat>>({});
  const pts = hemiPoints(seed), targets = treasureCities(seed), next = targets.find(k => !found[k]);
  return <><Tabs tabs={["① 地球有多大", "② 经纬线", "③ 半球判断", "④ 经纬网寻宝"]} at={tab} set={setTab} />
    {tab === 0 && <div className="max-w-lg space-y-4"><p>地球最大周长约 4 万千米，客机沿赤道飞一圈约需多少小时？</p><p className="rounded-lg bg-raised p-3">客机速度：<b>{planeSpeed(seed)} 千米/时</b></p><Field label="约需（小时）" value={hours} set={setHours} />{!ctx.done[0] && <button type="button" className="btn" disabled={!hours} onClick={() => Number.isFinite(Number(hours)) && Math.abs(Number(hours) - 40000 / planeSpeed(seed)) <= 1 ? ctx.complete(0, "周长除以速度，就得到飞行时间。", { hours: Number(hours) }) : ctx.miss("用 40000 千米除以客机速度。")}>确认</button>}</div>}
    {tab === 1 && <Sorter items={items(LINES, seed + 9)} cats={cats({ lon: "经线 / 经度", lat: "纬线 / 纬度" })} answer={pairsAnswer(LINES)} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "经线连接两极，纬线与赤道平行。", { lines: p })} />}
    {tab === 2 && <Two map={<Globe view={view} setView={setView} day={172} utc={0} cities={[]} showNight={false} grid={30} highlightMeridians={[-20, 160]} marks={pts.map((at, i) => ({ at, label: String(i + 1) }))} />} side={<><p className="text-sm text-muted">东西半球分界是 20°W 和 160°E 组成的经线圈。拖动地球查看。</p>{pts.map((p, i) => <div key={i} className="rounded-lg bg-raised p-3"><b>{i + 1}. {coordLabel(p)}</b><div className="seg mt-2 flex-wrap">{["E-N", "E-S", "W-N", "W-S"].map(k => <button type="button" key={k} disabled={ctx.done[2]} aria-pressed={hemi[i] === k} onClick={() => setHemi(h => ({ ...h, [i]: k }))}>{k[0] === "E" ? "东" : "西"} · {k[2] === "N" ? "北" : "南"}</button>)}</div></div>)}{!ctx.done[2] && <button type="button" className="btn" disabled={Object.keys(hemi).length !== 3} onClick={() => pts.every((p, i) => hemi[i] === hemisphereOf(p)) ? ctx.complete(2, "东西半球不以本初子午线为界。", { hemi }) : ctx.miss("注意 20°W 至 160°E 属于东半球。")}>确认半球</button>}</>} />}
    {tab === 3 && <Two map={<Globe view={view} setView={setView} day={172} utc={0} cities={[]} showNight={false} grid={15} marks={Object.entries(found).map(([k, at]) => ({ at, label: CITIES[k].name, tone: "good" as const }))} onPick={p => {
      if (!next || ctx.done[3]) return; if (degDist(p, CITIES[next].at) > 4) return ctx.miss("这里离目标还有些距离，读一读经纬网。");
      const f = { ...found, [next]: p }; setFound(f); if (targets.every(k => f[k])) ctx.complete(3, "通过经纬度可以确定地点。", { found: f }); else ctx.say(`找到${CITIES[next].name}！`);
    }} />} side={<><p className="text-sm text-muted">拖动旋转地球，点击指定坐标，找到后揭晓城市。</p>{targets.map(k => <div key={k} className="rounded-lg bg-raised p-3"><b>{coordLabel(CITIES[k].at)}</b> {found[k] ? `· ${CITIES[k].name}` : k === next ? "· 正在寻找" : ""}</div>)}</>} />}
  </>;
}
export const globe = (seed: number): LessonConfig => ({
  phenomenon: { question: "大海上的船只遇险，怎样报告自己的位置？", cards: [{ caption: "电影院用几排几号找到座位", art: <Art bg="#eedcc1">{[0, 1, 2].map(y => [0, 1, 2, 3, 4].map(x => <rect key={`${x}-${y}`} x={38 + x * 52} y={35 + y * 42} width="35" height="25" rx="5" fill="#a55c4d" />))}</Art> }, { caption: "海上的船，怎样说清位置？", art: <Art bg="#d4ecf2"><path d="M0 125 Q80 110 160 125 T320 125 V180 H0Z" fill="#66a8bf" /><path d="M100 105 H230 L210 130 H120Z" fill="#466073" /><path d="M165 105 V45 L205 95Z" fill="#fff" /></Art> }] },
  guess: { question: "在地球上确定一个地点的位置，靠什么？", options: ["经度和纬度", "离北京的距离", "海拔高度"], right: 0, reveal: "经线和纬线交织成经纬网，任一地点都能用经纬度确定。" },
  tasks: [["地球有多大", "计算飞行时间"], ["经纬线特点", "分类比较"], ["半球判断", "东西和南北"], ["经纬度寻宝", "在地球上点出坐标"]],
  blanks: [{ text: ["连接南北两极的半圆弧叫", "，指示南北方向。"], options: ["经线", "纬线"] }, { text: ["", "是最长的纬线，把地球分为南北两个半球。"], options: ["赤道", "北回归线", "本初子午线"] }, { text: ["东西半球通常以", "组成的经线圈划分。"], options: ["20°W 和 160°E", "0° 和 180°"] }, { text: ["地球表面任一地点的位置，都可以用", "表示。"], options: ["经纬度", "海拔"] }],
  scene: ctx => <GlobeScene ctx={ctx} seed={seed} />,
});

function LandProfile({ seed }: { seed: number }) {
  const uid = useId().replace(/:/g, ""), order = Object.values(labelAnswer(Object.keys(FORMS), seed + 101));
  const edge: Record<string, number> = { mountain: 550, plateau: 600, hill: 180, plain: 100, basin: 850 };
  const shape: Record<string, [number, number][]> = {
    mountain: [[0.15, 800], [0.31, 1800], [0.49, 700], [0.67, 1500], [0.85, 600]],
    plateau: [[0.22, 1200], [0.78, 1200]],
    hill: [[0.18, 250], [0.34, 380], [0.54, 210], [0.76, 330]],
    plain: [[0.15, 120], [0.85, 120]],
    basin: [[0.12, 900], [0.5, 300], [0.88, 900]],
  };
  const y = (h: number) => 230 - h * 0.095, x0 = 60, width = 600, section = width / 5;
  const boundaries = Array.from({ length: 6 }, (_, i) => i === 0 ? edge[order[0]] : i === 5 ? edge[order[4]] : Math.min(edge[order[i - 1]], edge[order[i]]));
  const pts: [number, number][] = [];
  order.forEach((key, i) => {
    if (i === 0) pts.push([x0, y(boundaries[0])]);
    shape[key].forEach(([x, h]) => pts.push([x0 + (i + x) * section, y(h)]));
    pts.push([x0 + (i + 1) * section, y(boundaries[i + 1])]);
  });
  const surface = pts.slice(1).reduce((d, p, i) => { const prev = pts[i], dx = (p[0] - prev[0]) / 3; return `${d} C${(prev[0] + dx).toFixed(1)} ${prev[1].toFixed(1)} ${(p[0] - dx).toFixed(1)} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }, `M${pts[0][0]} ${pts[0][1].toFixed(1)}`);
  const bands = [{ low: 0, high: 200, color: "#8fbd83" }, { low: 200, high: 500, color: "#d4c783" }, { low: 500, high: 1000, color: "#c99965" }, { low: 1000, high: 2000, color: "#a87551" }];
  return <svg viewBox="0 0 690 300" className="w-full rounded-[10px] bg-raised" role="img" aria-label="五种基本地形连续剖面及海拔分层设色">
    <defs><clipPath id={`profile${uid}`}><path d={`${surface} L660 230 L60 230 Z`} /></clipPath></defs>
    <g clipPath={`url(#profile${uid})`}>{bands.map(b => <rect key={b.low} x={x0} y={y(b.high)} width={width} height={y(b.low) - y(b.high)} fill={b.color} />)}</g>
    <path d={surface} fill="none" stroke="#6d503b" strokeWidth="2" />
    <path d="M60 40 V230 H660" fill="none" stroke="var(--ink)" strokeWidth="1" />
    <text x="8" y="26" fontSize="12" fill="var(--ink)">海拔 / m</text>
    {[0, 200, 500, 1000, 2000].map(h => <g key={h}><line x1="55" x2="60" y1={y(h)} y2={y(h)} stroke="var(--ink)" /><text x="50" y={y(h) + 4} textAnchor="end" fontSize="11" fill="var(--ink)">{h}</text></g>)}
    {[1, 2, 3, 4].map(i => <line key={i} x1={x0 + i * section} x2={x0 + i * section} y1="40" y2="230" stroke="var(--ink)" strokeOpacity=".28" strokeDasharray="3 5" />)}
    {LABELS.map((label, i) => <text key={label} x={x0 + (i + 0.5) * section} y="251" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--ink)">{label}</text>)}
    {bands.map((b, i) => <g key={b.low} transform={`translate(${64 + i * 150} 274)`}><rect width="13" height="10" rx="2" fill={b.color} /><text x="18" y="9" fontSize="11" fill="var(--ink)">{b.low}–{b.high} m</text></g>)}
  </svg>;
}
function Profile({ seed }: { seed: number }) {
  const names = SEAFLOOR, answer = labelAnswer(Object.keys(names), seed + 131);
  const keyLabel = (key: string) => Object.keys(answer).find(k => answer[k] === key);
  const paths = ["M40 75 L140 80 L140 190 L40 190Z", "M140 80 L225 155 L225 190 L140 190Z", "M225 155 L275 185 L305 155 L305 190 L225 190Z", "M305 155 L430 160 L430 190 L305 190Z", "M430 160 L500 105 L570 160 L570 190 L430 190Z"];
  const keys = Object.keys(names);
  return <svg viewBox="0 0 600 220" className="w-full rounded-[10px] bg-raised" role="img" aria-label="海底地形剖面示意图">
    <rect x="40" y="40" width="530" height="150" fill="#c8e5ef" />
    <line x1="40" y1="180" x2="570" y2="180" stroke="var(--ink)" /><line x1="40" y1="30" x2="40" y2="190" stroke="var(--ink)" />
    <text x="3" y="30" fontSize="12" fill="var(--ink)">海面</text>
    {paths.map((d, i) => <path key={d} d={d} fill={tint(250 + i * 90)} stroke="#745d42" strokeWidth="1.5" />)}
    {keys.map((k, i) => <text key={k} x={[90, 182, 265, 365, 500][i]} y="207" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--ink)">{keyLabel(k)}</text>)}
  </svg>;
}
function LandformScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [found, setFound] = useState<Record<string, LonLat>>({});
  const targets = worldTargets(seed), next = targets.find(k => !found[k]);
  return <><Tabs tabs={["① 五种地形", "② 世界地形区", "③ 海底地形"]} at={tab} set={setTab} />
    {tab === 0 && <div className="space-y-4"><LandProfile seed={seed} /><p className="text-sm text-muted">观察海拔、起伏与形态，将甲～戊归类。</p><Sorter items={labels(FORMS, seed + 101)} cats={FORMS} answer={labelAnswer(Object.keys(FORMS), seed + 101)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "山地、高原、丘陵、平原和盆地各有不同形态。", { forms: p })} /></div>}
    {tab === 1 && <div className="space-y-4"><p className="text-sm text-muted">在地形图上依次点出目标的大致位置。{next && <b className="text-ink">现在寻找：{WORLD_FORMS[next].name}</b>}</p>
      <TdtMap base="ter" labels={false} bbox={[-180, -58, 180, 75]} z={2} onPick={p => { if (!next || ctx.done[1]) return; if (zoneDistance(p, WORLD_FORMS[next].zone) > WORLD_FORMS[next].tol) return ctx.miss(`这里不是${WORLD_FORMS[next].name}，再找找。`); const f = { ...found, [next]: p }; setFound(f); if (targets.every(k => f[k])) ctx.complete(1, "找到了世界主要地形区。", { found: f }); else ctx.say(`找到了${WORLD_FORMS[next].name}。`); }}>{Object.entries(found).map(([k, at]) => <MapPin key={k} at={at} label={WORLD_FORMS[k].name} color="var(--good)" />)}</TdtMap>
      <div className="flex flex-wrap gap-2">{targets.map(k => <span key={k} className="rounded-full bg-raised px-3 py-1 text-sm">{found[k] ? "✓ " : ""}{WORLD_FORMS[k].name}</span>)}</div></div>}
    {tab === 2 && <div className="space-y-4"><Profile seed={seed} /><p className="text-sm text-muted">从海岸到大洋中部，给海底地形归类。</p><Sorter items={labels(SEAFLOOR, seed + 131)} cats={SEAFLOOR} answer={labelAnswer(Object.keys(SEAFLOOR), seed + 131)} done={ctx.done[2]} onMiss={ctx.miss} onDone={p => ctx.complete(2, "大陆架海水一般不超过 200 米深；海沟是大洋最深的地方", { seafloor: p })} /></div>}
  </>;
}
export const landform = (seed: number): LessonConfig => ({
  phenomenon: { question: "珠穆朗玛峰海拔 8 848.86 米，马里亚纳海沟最深处约 11 034 米。是山更高，还是海更深？", cards: [{ caption: "珠穆朗玛峰，高耸的山峰", art: <Art bg="#dcecf0"><path d="M10 155 L160 24 L310 155Z" fill="#9ba9a3" /><path d="M110 68 L160 24 L210 68 L190 61 L174 75 L160 57 L145 76 L130 61Z" fill="#fff" /></Art> }, { caption: "马里亚纳海沟，深邃的海底", art: <Art bg="#bddfe9"><path d="M0 92 L110 100 L160 170 L205 100 L320 96 V180 H0Z" fill="#617f83" /><path d="M0 35 H320" stroke="#fff" strokeWidth="3" /></Art> }] },
  guess: { question: "海底的地形是什么样的？", options: ["海底是平坦的", "海底和陆地一样高低起伏，有海沟，也有海底山脉", "越往大洋中部海越深"], right: 1, reveal: "海底也高低起伏：大洋中部有洋中脊，最深处在海沟。" },
  tasks: [["五种基本地形", "判读地形剖面"], ["世界主要地形区", "在地图上寻找"], ["海底地形", "认识海底剖面"]],
  blanks: [{ text: ["陆地地形分为山地、高原、丘陵、平原和", "五种基本类型。"], options: ["盆地", "峡谷", "沙漠"] }, { text: ["世界上面积最大的高原是", "。"], options: ["巴西高原", "青藏高原", "东非高原"] }, { text: ["世界上海拔最高的大高原是", "，号称“世界屋脊”。"], options: ["青藏高原", "巴西高原", "蒙古高原"] }, { text: ["从海岸到大洋中部，海水深度一般不超过 200 米的是", "。"], options: ["大陆架", "大陆坡", "洋盆"] }],
  scene: ctx => <LandformScene ctx={ctx} seed={seed} />,
});

const STAGES = { village: "乡村", town: "小城镇", city: "城市" };
function SettlementArt({ stage }: { stage: string }) {
  const n = stage === "village" ? 3 : stage === "town" ? 5 : 7;
  return <svg viewBox="0 0 320 150" className="w-full rounded-lg" role="img" aria-label={`${STAGES[stage as keyof typeof STAGES]}景观示意`}><rect width="320" height="150" fill="#d9ebef" /><rect y="112" width="320" height="38" fill="#a9c691" />
    {stage === "village" && <g stroke="#e9d4a4" strokeWidth="2"><path d="M0 120 L100 150 M30 112 L130 150 M60 112 L160 150" /><path d="M220 112 L320 150 M250 112 L320 138" /></g>}
    <path d="M0 140 Q150 105 320 140" fill="none" stroke="#e9d4a4" strokeWidth={stage === "city" ? 12 : 6} />
    {stage !== "village" && <g stroke="#e9d4a4" strokeWidth={stage === "city" ? 7 : 4}><path d="M80 112 L60 150 M200 112 L225 150" />{stage === "city" && <path d="M140 112 L140 150 M280 112 L300 150 M0 148 H320" />}</g>}
    {Array.from({ length: n }, (_, i) => { const h = stage === "village" ? 25 : stage === "town" ? 45 + i % 2 * 15 : 65 + i % 3 * 15; const x = 20 + i * (280 / n); return <g key={i}><rect x={x} y={112 - h} width={240 / n} height={h} fill={i % 2 ? "#bf9e80" : "#d0baa0"} stroke="#765d4c" /><path d={`M${x} ${112 - h} l${120 / n} -12 l${120 / n} 12`} fill={stage === "village" ? "#b9674d" : "#889ca4"} />{stage !== "village" && Array.from({ length: Math.floor(h / 15) }, (_, row) => <rect key={row} x={x + 5} y={120 - h + row * 14} width={240 / n - 10} height="5" fill="#eaf4ef" />)}</g>; })}
    {stage === "city" && <g><circle cx="286" cy="125" r="11" fill="#4c9b71" /><circle cx="269" cy="128" r="8" fill="#63ae7b" /><text x="284" y="145" textAnchor="middle" fontSize="9" fill="#24483a">绿地</text><text x="230" y="20" fontSize="10" fill="#4d6670">新城</text></g>}
  </svg>;
}
function SettlementScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [site, setSite] = useState<Site | null>(null), t = makeTerrain(seed), points = sitePoints(t);
  const order = shuffle(Object.keys(points) as Site[], seed + 151), line = (p: Pt[]) => p.map(q => q.map(x => x.toFixed(4)).join(",")).join(" ");
  return <><Tabs tabs={["① 景观分类", "② 村落选址", "③ 城镇变迁"]} at={tab} set={setTab} />
    {tab === 0 && <Sorter items={items(SCENES, seed + 21)} cats={{ rural: "乡村", urban: "城镇" }} answer={pairsAnswer(SCENES)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "乡村以农业活动为主，城镇建筑密集，服务设施较多。", { scene: p })} />}
    {tab === 1 && <Two map={<ContourMap t={t} onPoint={p => { const k = order.find(k => Math.hypot(p[0] - points[k][0], p[1] - points[k][1]) < 0.05); if (k) setSite(k); }}>
      <polyline points={line(settlementRiver(t))} fill="none" stroke="#187cb0" strokeWidth={0.012} strokeLinecap="round" strokeLinejoin="round" /><polyline points={line(roadLine(t))} fill="none" stroke="#70533b" strokeWidth={0.009} strokeDasharray="0.02 0.01" strokeLinecap="round" />
      <polyline points={line(bridgeLine(t))} fill="none" stroke="#5a4233" strokeWidth={0.022} strokeLinecap="round" /><polyline points={line(bridgeLine(t))} fill="none" stroke="#f3dfb2" strokeWidth={0.012} strokeLinecap="round" />
      {order.map((k, i) => <g key={k} transform={`translate(${points[k][0].toFixed(4)} ${points[k][1].toFixed(4)})`}><circle r={0.028} fill={site === k ? "var(--accent)" : "var(--panel-solid)"} stroke="var(--ink)" strokeWidth={0.004} /><text y={0.009} textAnchor="middle" fontSize={0.025} fontWeight="bold" fill={site === k ? "white" : "var(--ink)"}>{LABELS[i]}</text></g>)}</ContourMap>} side={<><p className="text-sm text-muted">蓝线是河流，棕色虚线是道路，浅色短线是桥。选择靠近水源和道路、地势平坦且不易被淹的地点。</p><div className="seg flex-wrap">{order.map((k, i) => <button type="button" key={k} disabled={ctx.done[1]} aria-pressed={site === k} onClick={() => setSite(k)}>{LABELS[i]}</button>)}</div>{!ctx.done[1] && <button type="button" className="btn" disabled={!site} onClick={() => { if (!site) return; if (site === siteBest(seed)) return ctx.complete(1, "这里靠近水源和道路，地势平坦且高出河面。", { site }); const r = siteRating(t, points[site]); ctx.miss(!r.safe ? "这里地势低洼，汛期容易被洪水淹没。" : !r.flat ? "这里坡度较陡，不适合建村。" : !r.water ? "这里离水源太远。" : "这里离道路太远。"); }}>确认选址</button>}</>} />}
    {tab === 2 && <Sequence options={STAGES} answer={["village", "town", "city"]} seed={seed + 173} done={ctx.done[2]} ctx={ctx} task={2} dataKey="stages" artwork={k => <SettlementArt stage={k} />} after={<p className="rounded-lg bg-good/10 p-3 text-sm">建筑层数增多，道路网加密，服务设施更完善，绿地和休闲场所也在增加</p>} />}
  </>;
}
export const settlement = (seed: number): LessonConfig => ({
  phenomenon: { question: "繁华的城市里，为什么会有带“村”“庄”字样的地名？", cards: [{ caption: "城市公交站牌上的“村”", art: <Art bg="#d7e8ec"><rect x="150" y="45" width="7" height="130" fill="#55656c" /><rect x="55" y="40" width="200" height="65" rx="5" fill="#176f8f" /><text x="155" y="80" textAnchor="middle" fontSize="22" fontWeight="bold" fill="white">××村站</text></Art> }, { caption: "乡村的房屋与农田", art: <Art bg="#dbece9"><rect y="120" width="320" height="60" fill="#96bf79" /><path d="M0 150 L320 130 M0 170 L320 145" stroke="#e1d3a0" strokeWidth="4" /><path d="M60 115 V75 L100 48 L140 75 V115Z" fill="#ead7b8" stroke="#9b755a" /><path d="M55 76 L100 42 L145 76Z" fill="#b7654c" /></Art> }] },
  guess: { question: "城镇一般是怎样形成的？", options: ["城镇多是在村落的基础上发展起来的", "城镇和村落没有关系", "城镇都建在高山上"], right: 0, reveal: "城镇多由条件好的村落发展而来；城镇扩张时还会把周边乡村并入城区。" },
  tasks: [["景观分类", "区分乡村与城镇"], ["村落选址", "寻找适宜地点"], ["城镇变迁", "按发展先后排序"]],
  blanks: [{ text: ["乡村的人们主要从事", "生产活动。"], options: ["农业", "工业"] }, { text: ["城镇建筑密度比较", "，商业和公共服务设施齐全。"], options: ["大", "小"] }, { text: ["具备水源充足、地形", "、交通便利等条件的村落，容易发展为城镇。"], options: ["平坦", "崎岖"] }, { text: ["随着城镇发展，城镇人口占世界总人口的比重不断", "。"], options: ["增加", "减少"] }],
  scene: ctx => <SettlementScene ctx={ctx} seed={seed} />,
});
