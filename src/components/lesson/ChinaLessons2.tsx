"use client";
import { useState } from "react";
import { CLIMATE_CITIES, type LonLat } from "@/lib/china";
import { CARGO, CENSUS, ENV_MEASURES, ETHNIC, EXTREMES, FESTIVAL_NAMES, FESTIVALS, GAS_PIPE, HU_LINE, HUB_OPTIONS, INDUSTRY_BASES, INDUSTRY_SITES, LAND_REGIONS, LAND_SHARE, LOW_CARBON, MINES, PROVINCES, PYRAMID_AGES, PYRAMIDS, RAIL_LINES, SAVE_WATER, SEA_RESOURCES, SEAS, TRANSFER_ROUTES, WATER_SPLIT } from "@/lib/china2";
import { lineLabels, provinceSet } from "@/lib/lessons";
import { degDist } from "@/lib/mercator";
import { MapLine, MapPin, TdtMap } from "@/components/geo/TdtMap";
import { ClimateChart } from "@/components/geo/Charts";
import { Art, Field } from "./LabKit";
import { Sorter, type LessonConfig, type LessonCtx } from "./LessonShell";
import { Choice, Tabs, Tag, Two } from "./ChinaLessons";

const LABELS = ["甲", "乙", "丙", "丁"];
type Pinned = Record<string, { name: string; at: LonLat; answer?: string }>;
const names = (o: Record<string, { name: string }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.name]));
const answersOf = (o: Record<string, { answer: string }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.answer]));
const catsOf = (values: string[]) => Object.fromEntries([...new Set(values)].map(v => [v, v]));
const firstOf = <T extends Record<string, readonly [string, ...unknown[]]>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[0]]));
const secondOf = <T extends Record<string, readonly [string, ...unknown[]]>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[1] as string]));

/** 在地图上依次点出目标：返回点击处理函数与已找到的位置 */
function useFinder(targets: Record<string, { name: string; at: LonLat }>, ctx: LessonCtx, task: number, key: string, tol: number, doneText: string, active: boolean) {
  const [found, setFound] = useState<Record<string, LonLat>>({}), next = Object.keys(targets).find(k => !found[k]);
  const pick = (p: LonLat) => {
    if (!active || !next || ctx.done[task]) return;
    if (degDist(p, targets[next].at) > tol) return ctx.miss(`这里不是${targets[next].name}，再找找。`);
    const f = { ...found, [next]: p }; setFound(f); ctx.say(`找到了${targets[next].name}。`);
    if (Object.keys(targets).every(k => f[k])) ctx.complete(task, doneText, { [key]: f });
  };
  const list = <div className="flex flex-wrap gap-2">{Object.entries(targets).map(([k, v]) => <span key={k} className={`rounded-full px-3 py-1 text-sm font-bold ${found[k] ? "bg-good/15 text-good" : k === next ? "bg-ink text-bg" : "bg-raised"}`}>{found[k] ? "✓ " : ""}{v.name}</span>)}</div>;
  const pins = Object.entries(found).map(([k, p]) => <MapPin key={k} at={p} label={targets[k].name.replace(/（.*）/, "")} />);
  return { pick, list, pins };
}
const PinLayer = ({ items, labels = true }: { items: Pinned; labels?: boolean }) => <>{Object.entries(items).map(([k, v]) => <MapPin key={k} at={v.at} label={labels ? v.name : undefined} color="var(--accent-2)" />)}</>;
/** 地图上带甲乙丙丁标签的线，学生给每条线选名称 */
function LabeledLines({ lines, order, color = "var(--accent)" }: { lines: Record<string, { line: LonLat[] }>; order: string[]; color?: string }) {
  return <>{order.map((k, i) => <MapLine key={k} line={lines[k].line} color={color} width={5} label={<Tag text={LABELS[i]} color={color} />} />)}</>;
}
function lineSorter(lines: Record<string, { name: string }>, order: string[], ctx: LessonCtx, task: number, key: string, text: string) {
  return <Sorter items={Object.fromEntries(order.map((k, i) => [k, `${LABELS[i]}线`]))} cats={names(lines)} answer={Object.fromEntries(order.map(k => [k, k]))} done={ctx.done[task]} onMiss={ctx.miss} onDone={p => ctx.complete(task, text, { [key]: p })} />;
}
function Bars({ data, unit, highlight }: { data: [string, number][]; unit: string; highlight?: string }) {
  const max = Math.max(...data.map(d => d[1]));
  return <div className="space-y-1.5">{data.map(([k, v]) => <div key={k} className="flex items-center gap-2 text-sm"><span className="w-40 shrink-0 truncate">{k}</span><div className="h-5 flex-1 rounded bg-raised"><div className="h-5 rounded" style={{ width: `${(v / max) * 100}%`, background: highlight === k ? "var(--accent-2)" : "var(--accent)" }} /></div><span className="num w-14 text-right">{v}{unit}</span></div>)}</div>;
}
const quiz = (o: Record<string, readonly [string, boolean]>, picked: string[], set: (f: (a: string[]) => string[]) => void) => <div className="grid gap-2 sm:grid-cols-2">{Object.entries(o).map(([k, [label]]) => <button key={k} type="button" className="choice justify-start" aria-pressed={picked.includes(k)} onClick={() => set(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k])}>{label}</button>)}</div>;
const allRight = (o: Record<string, readonly [string, boolean]>, picked: string[]) => { const r = Object.keys(o).filter(k => o[k][1]); return picked.length === r.length && r.every(k => picked.includes(k)); };

/* ======================= 1.1 疆域 ======================= */
function TerritoryScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), f = useFinder(EXTREMES, ctx, 0, "extremes", 3.5, "我国最北端在漠河以北，最南端在曾母暗沙，南北跨纬度近 50°；东西跨经度 60 多度，时差 4 个多小时。", tab === 0);
  const set = provinceSet(seed), abbrs = [...set].sort().map(i => PROVINCES[i][1]);
  return <div>
    <Tabs tabs={["① 四至", "② 省级行政区", "③ 邻国"]} at={tab} set={setTab} />
    <Two map={<TdtMap base="vec" labels={tab === 1} onPick={f.pick}>{tab === 0 && f.pins}</TdtMap>} side={<>
      {tab === 0 && <><p className="text-sm text-muted">在地图上依次点出我国领土的四个端点：</p>{f.list}</>}
      {tab === 1 && <><p className="text-sm text-muted">我国有 34 个省级行政区。给下面 6 个选出简称（地图注记来自天地图）：</p>
        <Sorter items={Object.fromEntries(set.map(i => [String(i), `${PROVINCES[i][0]}（行政中心：${PROVINCES[i][2]}）`]))} cats={catsOf(abbrs)} answer={Object.fromEntries(set.map(i => [String(i), PROVINCES[i][1]]))} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "省级行政区有 23 个省、5 个自治区、4 个直辖市和 2 个特别行政区。", { abbr: p })} /></>}
      {tab === 2 && <><p className="text-sm text-muted">我国陆地边界长 2 万多千米，海岸线长 1.8 万多千米。我国的邻国有：</p><Choice disabled={ctx.done[2]} options={["陆上邻国 14 个，隔海相望 6 个", "陆上邻国 15 个，隔海相望 6 个", "陆上邻国 14 个，隔海相望 8 个"]} onPick={o => o.startsWith("陆上邻国 14 个，隔海相望 6") ? ctx.complete(2, "隔海相望的国家有韩国、日本、菲律宾、马来西亚、文莱、印度尼西亚。", { neighbors: "14-6" }) : ctx.miss("陆上邻国 14 个，隔海相望的有 6 个。")} /></>}
    </>} />
  </div>;
}
export const territory = (seed: number): LessonConfig => ({
  phenomenon: { question: "同一时刻，漠河冰天雪地，海南却能下海游泳，我国有多大？", cards: [
    { caption: "1 月的漠河，零下 30 ℃ 的“北极村”", art: <Art bg="#e8f1fb"><text x={160} y={100} fontSize={30} fontWeight={800} textAnchor="middle" fill="#2f6bd1">−30 ℃</text></Art> },
    { caption: "同一天的三亚，人们在海边游泳", art: <Art bg="#cfeaf7"><rect y={110} width={320} height={70} fill="#7fb9d4" /><circle cx={260} cy={50} r={24} fill="#ffcf4d" /><text x={100} y={70} fontSize={28} fontWeight={800} textAnchor="middle" fill="#cc4130">25 ℃</text></Art> },
  ] },
  guess: { question: "我国南北跨越大约多少个纬度？", options: ["约 20°", "约 50°", "约 90°"], right: 1, reveal: "我国最北端约 53°N，最南端约 4°N，南北跨纬度近 50°。" },
  tasks: [["找出我国领土的四至", "在地图上依次点出"], ["认识省级行政区", "给 6 个省级行政区选简称"], ["我国的邻国", "陆上与隔海相望"]],
  blanks: [{ text: ["我国位于北半球和", "。"], options: ["东半球", "西半球"] }, { text: ["我国大部分地区位于北", "。"], options: ["温带", "热带"] }, { text: ["我国陆地面积约", "万平方千米。"], options: ["960", "300"] }, { text: ["我国共有", "个省级行政区。"], options: ["34", "23"] }, { text: ["我国陆上邻国有", "个。"], options: ["14", "6"] }],
  title: () => "中国的疆域（天地图）",
  scene: ctx => <TerritoryScene ctx={ctx} seed={seed} />,
});

/* ======================= 1.2 人口 ======================= */
function Pyramid({ data, label, active, onClick }: { data: number[]; label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-[10px] border bg-panel-solid p-3 ${active ? "border-ink outline-2 outline-ink" : "border-panel-border"}`}>
    <div className="space-y-0.5">{[...data].reverse().map((v, i) => <div key={i} className="flex items-center gap-1"><div className="flex flex-1 justify-end"><div className="h-2.5 rounded-l bg-[#5d9be0]" style={{ width: `${v * 7}%` }} /></div><span className="num w-9 text-center text-[9px] text-muted">{PYRAMID_AGES[data.length - 1 - i]}</span><div className="flex-1"><div className="h-2.5 rounded-r bg-[#e08a8a]" style={{ width: `${v * 7}%` }} /></div></div>)}</div>
    <span className="mt-2 block text-center text-sm font-bold">{label}</span></button>;
}
function PopulationScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [pop, setPop] = useState(""), [pyr, setPyr] = useState<string | null>(null), order = seed % 2 ? ["y2020", "y1982"] : ["y1982", "y2020"];
  const max = 15;
  return <div>
    <Tabs tabs={["① 人口数量", "② 人口分布", "③ 人口结构"]} at={tab} set={setTab} />
    {tab === 1 ? <Two map={<TdtMap base="ter"><MapLine line={HU_LINE} color="#cc4130" width={5} dash="12 8" label={<Tag text="黑河—腾冲线" color="#cc4130" />} /><MapPin at={HU_LINE[0]} label="黑河" color="#cc4130" /><MapPin at={HU_LINE[1]} label="腾冲" color="#cc4130" /></TdtMap>} side={<>
      <p className="text-sm text-muted">这条线以东约占全国面积的 43%，却居住着全国约 94% 的人口。人口更稠密的一侧是：</p>
      <Choice disabled={ctx.done[1]} options={["线的东南侧", "线的西北侧"]} onPick={o => o === "线的东南侧" ? ctx.complete(1, "东南部地势低平、气候湿润、经济发达，人口稠密；西北部多高原、荒漠，人口稀疏。", { dense: "east" }) : ctx.miss("看看地形：西北侧多高原、沙漠和高山。")} />
    </>} /> : tab === 0 ? <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="rounded-[10px] bg-canvas p-4"><div className="relative ml-8 h-[180px]">
        {Array.from({ length: 16 }, (_, v) => <div key={v} className={`absolute inset-x-0 border-t ${v % 5 === 0 ? "border-muted/40" : "border-muted/15"}`} style={{ bottom: `${(v / max) * 180}px` }}>{v % 5 === 0 && <span className="num absolute -left-8 -translate-y-1/2 text-[10px] text-muted">{v}</span>}</div>)}
        <div className="absolute inset-0 flex items-end gap-3 px-1">{CENSUS.map(([y, v]) => <div key={y} className="w-full flex-1 rounded-t bg-accent/90" style={{ height: `${(v / max) * 180}px` }} />)}</div></div>
        <div className="ml-8 mt-1 flex gap-3 px-1">{CENSUS.map(([y]) => <span key={y} className="num flex-1 text-center text-[11px] text-muted">{y}</span>)}</div>
        <p className="mt-2 text-xs text-muted">历次全国人口普查（亿人，不含港澳台）；细线每格 1 亿</p></div>
      <div className="space-y-3"><p className="text-sm text-muted">根据柱状图，估计 2020 年我国人口约多少亿？（读到 0.5 亿）</p><Field label="2020 年人口（亿）" value={pop} set={setPop} />
        {!ctx.done[0] && <button type="button" className="btn" disabled={!pop} onClick={() => Math.abs(Number(pop) - 14.1) <= 0.5 ? ctx.complete(0, "2020 年第七次全国人口普查，我国人口约 14.1 亿，人口基数大。", { pop2020: Number(pop) }) : ctx.miss("看最右边的柱子顶端对着哪条细线，每格 1 亿。")}>确认</button>}</div>
    </div> : <div className="space-y-3"><p className="text-sm text-muted">下面是我国 1982 年和 2020 年的人口金字塔（左男右女）。哪一个反映出老年人口比重明显上升？</p>
      <div className="grid max-w-xl grid-cols-2 gap-3">{order.map((k, i) => <Pyramid key={k} data={PYRAMIDS[k as keyof typeof PYRAMIDS]} label={LABELS[i]} active={pyr === k} onClick={() => setPyr(k)} />)}</div>
      {!ctx.done[2] && <button type="button" className="btn" disabled={!pyr} onClick={() => pyr === "y2020" ? ctx.complete(2, "这个金字塔底部收窄、顶部变宽，老年人口比重上升，人口老龄化加深。", { pyramid: pyr }) : ctx.miss("看金字塔的底部和顶部：老龄化意味着顶部变宽。")}>就是它</button>}
    </div>}
  </div>;
}
export const population = (seed: number): LessonConfig => ({
  phenomenon: { question: "为什么东部城市里人挤人，西部很多地方却地广人稀？", cards: [
    { caption: "春运时，火车站里人山人海", art: <Art>{Array.from({ length: 60 }, (_, i) => <circle key={i} cx={10 + (i * 53) % 300} cy={60 + (i * 31) % 110} r={6} fill={["#5d9be0", "#e08a8a", "#d4a017"][i % 3]} />)}</Art> },
    { caption: "藏北高原上，几十千米见不到一户人家", art: <Art bg="#e8f2f7"><path d="M0 120 L80 80 L160 110 L240 70 L320 110 V180 H0Z" fill="#c9b48a" /><circle cx={250} cy={130} r={4} fill="#4a3a28" /></Art> },
  ] },
  guess: { question: "我国人口分布的特点是", options: ["东多西少", "西多东少", "分布均匀"], right: 0, reveal: "大致以黑河—腾冲一线为界，东南部人口稠密，西北部人口稀疏。" },
  tasks: [["人口数量", "读人口普查柱状图"], ["人口分布", "黑河—腾冲线"], ["人口结构", "比较人口金字塔"]],
  blanks: [{ text: ["我国", "，是世界人口大国。"], options: ["人口众多", "人口稀少"] }, { text: ["我国人口分布", "。"], options: ["东多西少", "西多东少"] }, { text: ["人口分布大致以", "一线为界。"], options: ["黑河—腾冲", "秦岭—淮河"] }, { text: ["老年人口比重上升，人口", "加深。"], options: ["老龄化", "年轻化"] }],
  title: () => "中国的人口",
  scene: ctx => <PopulationScene ctx={ctx} seed={seed} />,
});

/* ======================= 1.3 民族 ======================= */
function EthnicScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0);
  return <div>
    <Tabs tabs={["① 民族分布", "② 民族节日", "③ 分布特点"]} at={tab} set={setTab} />
    {tab === 0 ? <Two map={<TdtMap base="vec"><PinLayer items={ETHNIC} /></TdtMap>} side={<><p className="text-sm text-muted">给地图上的地区选出主要聚居的少数民族：</p>
      <Sorter items={names(ETHNIC)} cats={catsOf(Object.values(ETHNIC).map(v => v.answer))} answer={answersOf(ETHNIC)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "少数民族主要分布在西南、西北和东北地区。", { map: p })} /></>} />
      : tab === 1 ? <div className="max-w-2xl"><p className="mb-3 text-sm text-muted">这些节日和盛会是哪个民族的？</p><Sorter items={FESTIVAL_NAMES} cats={catsOf(Object.values(FESTIVALS))} answer={FESTIVALS} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "各民族都有自己的传统节日和风俗，共同组成了中华民族多彩的文化。", { fest: p })} /></div>
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">汉族遍布全国，主要集中在东部和中部；少数民族也有许多散居在各地。这种分布特点叫作：</p><Choice disabled={ctx.done[2]} options={["大杂居、小聚居", "各自集中、互不交错", "平均分布"]} onPick={o => o.startsWith("大杂居") ? ctx.complete(2, "各民族交错杂居，在一些地区又相对集中聚居。") : ctx.miss("各民族既交错居住，又在一些地方相对集中。")} /></div>}
  </div>;
}
export const ethnic = (): LessonConfig => ({
  phenomenon: { question: "那达慕、泼水节、三月三……这些节日来自哪里？", cards: [
    { caption: "草原上的那达慕大会，赛马、摔跤、射箭", art: <Art bg="#e8f4dc"><path d="M0 130 Q160 110 320 130 V180 H0Z" fill="#8cc06b" /><circle cx={120} cy={100} r={10} fill="#a5733f" /><rect x={110} y={108} width={40} height={14} rx={6} fill="#7a5230" /></Art> },
    { caption: "西双版纳的泼水节，互相泼水祝福", art: <Art bg="#dbeeff">{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={40 + i * 20} cy={60 + (i % 3) * 20} r={5} fill="#5d9be0" />)}</Art> },
  ] },
  guess: { question: "我国一共有多少个民族？", options: ["34 个", "56 个", "100 个"], right: 1, reveal: "我国是统一的多民族国家，共有 56 个民族。" },
  tasks: [["少数民族的分布", "给地区配民族"], ["民族节日", "给节日配民族"], ["分布特点", "大杂居、小聚居"]],
  blanks: [{ text: ["我国共有", "个民族。"], options: ["56", "34"] }, { text: ["", "是我国人口最多的民族。"], options: ["汉族", "壮族"] }, { text: ["我国民族分布的特点是", "。"], options: ["大杂居、小聚居", "分布均匀"] }, { text: ["少数民族主要分布在", "地区。"], options: ["西南、西北和东北", "东部沿海"] }],
  title: () => "中国的民族（天地图）",
  scene: ctx => <EthnicScene ctx={ctx} />,
});

/* ======================= 3.1 土地资源 ======================= */
function LandScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0), types = LAND_SHARE.slice(0, 3).map(d => d[0]);
  return <div>
    <Tabs tabs={["① 土地构成", "② 土地分布", "③ 珍惜土地"]} at={tab} set={setTab} />
    {tab === 0 ? <div className="max-w-2xl space-y-3"><Bars data={LAND_SHARE} unit="%" /><p className="text-xs text-muted">第三次全国国土调查各类土地约占国土面积的比重（概括值）</p><p className="text-sm text-muted">比重最大的是哪类土地？</p>
      <Choice disabled={ctx.done[0]} options={types} onPick={o => o === "林地" ? ctx.complete(0, "林地和草地面积大；耕地只占约 13%，而且我国人口多，人均耕地少。", { largest: o }) : ctx.miss("比一比哪根柱子最长。")} /></div>
      : tab === 1 ? <Two map={<TdtMap base="ter"><PinLayer items={LAND_REGIONS} /></TdtMap>} side={<><p className="text-sm text-muted">给每个地区选出主要的土地利用类型：</p>
        <Sorter items={names(LAND_REGIONS)} cats={catsOf(["耕地", "林地", "草地"])} answer={answersOf(LAND_REGIONS)} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "耕地集中在东部季风区的平原和盆地；林地集中在东北和西南的山区；草地主要在西部高原和内蒙古高原。", { regions: p })} /></>} />
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">我国人均耕地少，后备耕地资源不足。我国的一项基本国策是：</p><Choice disabled={ctx.done[2]} options={["十分珍惜、合理利用土地和切实保护耕地", "多开垦草原和林地", "扩大城市占用耕地"]} onPick={o => o.startsWith("十分珍惜") ? ctx.complete(2, "要守住 18 亿亩耕地红线，坚决制止乱占耕地。") : ctx.miss("开垦草原、林地会破坏生态环境。")} /></div>}
  </div>;
}
export const land = (): LessonConfig => ({
  phenomenon: { question: "我国国土辽阔，为什么还要“守住耕地红线”？", cards: [
    { caption: "东北平原上，一望无际的黑土地", art: <Art bg="#f6efdc"><rect y={90} width={320} height={90} fill="#5a4630" />{Array.from({ length: 10 }, (_, i) => <line key={i} x1={i * 34} x2={i * 34 + 60} y1={90} y2={180} stroke="#7a6040" />)}</Art> },
    { caption: "城市不断扩张，周边农田变成了楼房", art: <Art bg="#e8eef2">{[40, 90, 140, 190, 240].map((x, i) => <rect key={x} x={x} y={60 + (i % 2) * 20} width={36} height={120 - (i % 2) * 20} fill="#9aa3b5" />)}<rect y={160} width={320} height={20} fill="#8cc06b" /></Art> },
  ] },
  guess: { question: "我国耕地的特点是", options: ["总量大，人均少", "总量小，人均多", "人均很多"], right: 0, reveal: "我国耕地总量居世界前列，但人口多，人均耕地少。" },
  tasks: [["土地构成", "读土地利用柱状图"], ["土地分布", "给六个地区配类型"], ["珍惜土地", "基本国策"]],
  blanks: [{ text: ["我国土地资源", "。"], options: ["类型齐全", "类型单一"] }, { text: ["按国土调查，面积最大的土地类型是", "。"], options: ["林地", "耕地"] }, { text: ["我国", "耕地少。"], options: ["人均", "总量"] }, { text: ["耕地主要分布在", "季风区。"], options: ["东部", "西部"] }, { text: ["草地主要分布在", "。"], options: ["西部", "东南"] }],
  title: () => "中国的土地资源（天地图）",
  scene: ctx => <LandScene ctx={ctx} />,
});

/* ======================= 3.2 水资源 ======================= */
function WaterScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), [save, setSave] = useState<string[]>([]), order = lineLabels(Object.keys(TRANSFER_ROUTES), seed), bj = CLIMATE_CITIES.beijing;
  return <div>
    <Tabs tabs={["① 空间分布", "② 时间分布", "③ 南水北调", "④ 节约用水"]} at={tab} set={setTab} />
    {tab === 2 ? <Two map={<TdtMap base="ter"><LabeledLines lines={TRANSFER_ROUTES} order={order} color="#2f6bd1" /></TdtMap>} side={<><p className="text-sm text-muted">地图上的甲、乙、丙三条线是南水北调的三条线路，给它们选名称：</p>
      {lineSorter(TRANSFER_ROUTES, order, ctx, 2, "routes", "东线沿京杭运河北上，中线从丹江口水库引水到北京、天津，西线计划从长江上游调水入黄河。")}</>} />
      : tab === 0 ? <div className="max-w-2xl space-y-3"><div className="grid grid-cols-2 gap-4">{(["south", "north"] as const).map(k => <div key={k} className="rounded-[10px] bg-canvas p-3"><div className="mb-2 font-bold">{k === "south" ? "南方" : "北方"}</div><Bars data={[["水资源", WATER_SPLIT[k].water], ["耕地", WATER_SPLIT[k].farmland]]} unit="%" /></div>)}</div>
        <p className="text-xs text-muted">南方、北方各占全国水资源和耕地的比重（概括值）</p><p className="text-sm text-muted">我国水资源的空间分布特点是：</p>
        <Choice disabled={ctx.done[0]} options={["南多北少", "北多南少", "东西一样"]} onPick={o => o === "南多北少" ? ctx.complete(0, "南方水多地少，北方地多水少，水土配合不协调。", { space: o }) : ctx.miss("比较南方和北方的水资源比重。")} /></div>
      : tab === 1 ? <div className="grid max-w-3xl gap-5 md:grid-cols-[300px_minmax(0,1fr)]"><ClimateChart t={bj.t} p={bj.p} title="北京各月气温与降水" /><div className="space-y-3"><p className="text-sm text-muted">从降水看，我国水资源的时间分配特点是：</p>
        <Choice disabled={ctx.done[1]} options={["夏秋多、冬春少", "冬春多、夏秋少", "四季均匀"]} onPick={o => o.startsWith("夏秋多") ? ctx.complete(1, "夏秋多、冬春少，年际变化也大，所以要修建水库调节。") : ctx.miss("看看降水柱在哪几个月最高。")} /></div></div>
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">选出所有节约用水的做法：</p>{quiz(SAVE_WATER, save, setSave)}
        {!ctx.done[3] && <button type="button" className="btn" disabled={!save.length} onClick={() => allRight(SAVE_WATER, save) ? ctx.complete(3, "节约用水、防治水污染，人人有责。", { save }) : ctx.miss("再检查一下，有没有浪费水的做法或者漏选的。")}>确认</button>}</div>}
  </div>;
}
export const water = (seed: number): LessonConfig => ({
  phenomenon: { question: "北京、天津的水，为什么要从一千多千米外的丹江口水库调来？", cards: [
    { caption: "华北平原的一些地方，地下水位不断下降", art: <Art bg="#f6efdc"><rect y={60} width={320} height={120} fill="#c9a46a" /><rect x={150} y={60} width={20} height={100} fill="#7fb9d4" /><text x={160} y={45} fontSize={12} textAnchor="middle">机井越打越深</text></Art> },
    { caption: "南水北调中线干渠，清水一路向北流", art: <Art bg="#e8f2f7"><path d="M40 170 L280 20" stroke="#7fb9d4" strokeWidth={22} /><path d="M40 170 L280 20" stroke="#fff" strokeWidth={2} strokeDasharray="6 8" /></Art> },
  ] },
  guess: { question: "我国水资源的空间分布特点是", options: ["南多北少", "北多南少", "东西均匀"], right: 0, reveal: "南方水多地少，北方地多水少，所以要“南水北调”。" },
  tasks: [["空间分布", "比较南北方"], ["时间分布", "读降水柱状图"], ["南水北调", "认识三条线路"], ["节约用水", "选出正确做法"]],
  blanks: [{ text: ["我国水资源的空间分布", "。"], options: ["南多北少", "北多南少"] }, { text: ["时间上", "、冬春少。"], options: ["夏秋多", "冬春多"] }, { text: ["解决空间分布不均的措施是跨流域调水，如", "。"], options: ["南水北调", "西气东输"] }, { text: ["解决时间分配不均的措施是修建", "。"], options: ["水库", "铁路"] }, { text: ["全社会都要", "、防治水污染。"], options: ["节约用水", "多用水"] }],
  title: () => "中国的水资源（天地图）",
  scene: ctx => <WaterScene ctx={ctx} seed={seed} />,
});

/* ======================= 3.3 矿产资源 ======================= */
function MineralScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0);
  return <div>
    <Tabs tabs={["① 矿产分布", "② 能源输送", "③ 合理利用"]} at={tab} set={setTab} />
    {tab < 2 ? <Two map={<TdtMap base="ter">{tab === 0 ? <PinLayer items={MINES} /> : <MapLine line={GAS_PIPE} color="#d4a017" width={6} label={<Tag text="甲" color="#b07d10" />} />}</TdtMap>} side={tab === 0 ? <><p className="text-sm text-muted">给地图上的地点选出著名的矿产：</p>
      <Sorter items={names(MINES)} cats={catsOf(Object.values(MINES).map(v => v.answer))} answer={answersOf(MINES)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "我国矿产资源种类齐全、总量丰富，但分布不均，人均占有量不足。", { mines: p })} /></>
      : <><p className="text-sm text-muted">黄色的甲线从新疆塔里木盆地一路通到上海。它是：</p><Choice disabled={ctx.done[1]} options={["西气东输", "南水北调", "西电东送"]} onPick={o => o === "西气东输" ? ctx.complete(1, "西部天然气丰富，东部需求大，西气东输把天然气输往东部，减少燃煤污染。", { pipe: o }) : ctx.miss("塔里木盆地有丰富的天然气。")} /></>} />
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">矿产资源属于非可再生资源。合理利用矿产资源应该：</p><Choice disabled={ctx.done[2]} options={["依法开采、综合利用、回收再生", "想挖就挖，越多越好", "只开采不保护"]} onPick={o => o.startsWith("依法") ? ctx.complete(2, "还要积极开发太阳能、风能等新能源，走可持续发展之路。") : ctx.miss("矿产用一点少一点，不可再生。")} /></div>}
  </div>;
}
export const mineral = (): LessonConfig => ({
  phenomenon: { question: "上海家里做饭用的天然气，竟然来自四千千米外的新疆？", cards: [
    { caption: "上海居民家中的燃气灶", art: <Art><ellipse cx={160} cy={120} rx={70} ry={20} fill="#9aa3b5" />{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${130 + i * 15} 112 q4 -14 0 -24`} stroke="#4a9bff" strokeWidth={4} fill="none" />)}</Art> },
    { caption: "塔里木盆地的天然气井", art: <Art bg="#f6e7c4"><path d="M150 170 L160 60 L170 170Z" fill="#7a5230" /><circle cx={160} cy={55} r={8} fill="#cc4130" /></Art> },
  ] },
  guess: { question: "我国矿产资源的特点是", options: ["总量丰富，人均不足", "总量少，人均多", "分布均匀"], right: 0, reveal: "我国矿产总量丰富，但人均占有量不足，分布不均。" },
  tasks: [["矿产分布", "给六个地点配矿产"], ["能源输送", "认识西气东输"], ["合理利用", "可持续发展"]],
  blanks: [{ text: ["我国矿产资源总量", "。"], options: ["丰富", "很少"] }, { text: ["矿产资源人均占有量", "。"], options: ["不足", "很多"] }, { text: ["把新疆天然气输往东部的工程是", "。"], options: ["西气东输", "南水北调"] }, { text: ["利用矿产资源要走", "发展之路。"], options: ["可持续", "快速消耗"] }],
  title: () => "中国的矿产资源（天地图）",
  scene: ctx => <MineralScene ctx={ctx} />,
});

/* ======================= 3.4 海洋资源 ======================= */
function OceanScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0), f = useFinder(SEAS, ctx, 0, "seas", 4, "渤海是我国的内海；南海面积最大、最深；东海、黄海、南海都与太平洋相连。", tab === 0);
  return <div>
    <Tabs tabs={["① 认识四海", "② 海洋资源", "③ 保护海洋"]} at={tab} set={setTab} />
    {tab < 2 ? <Two map={<TdtMap base="vec" onPick={f.pick}>{tab === 0 ? f.pins : <PinLayer items={SEA_RESOURCES} />}</TdtMap>} side={tab === 0 ? <><p className="text-sm text-muted">在地图上依次点出我国的四大海域：</p>{f.list}</>
      : <><p className="text-sm text-muted">给地图上的地点选出主要的海洋资源：</p><Sorter items={names(SEA_RESOURCES)} cats={catsOf(Object.values(SEA_RESOURCES).map(v => v.answer))} answer={answersOf(SEA_RESOURCES)} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "海洋有生物、矿产、化学、能源和空间等多种资源。", { res: p })} /></>} />
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">近海过度捕捞，鱼越来越小、越来越少。保护海洋渔业资源的做法是：</p><Choice disabled={ctx.done[2]} options={["实行伏季休渔，限制网眼大小", "用更密的网多捕鱼", "把废水直接排进大海"]} onPick={o => o.startsWith("实行") ? ctx.complete(2, "还要发展海水养殖、建设海洋保护区，开发与保护并重。") : ctx.miss("要给鱼留下生长和繁殖的时间。")} /></div>}
  </div>;
}
export const ocean = (): LessonConfig => ({
  phenomenon: { question: "餐桌上的带鱼、盐罐里的盐，都来自哪片海？", cards: [
    { caption: "舟山渔港，渔船满载而归", art: <Art bg="#dbeeff"><rect y={110} width={320} height={70} fill="#7fb9d4" />{[40, 140, 240].map(x => <g key={x}><path d={`M${x} 110 h60 l-10 18 h-40z`} fill="#cc4130" /><line x1={x + 30} y1={110} x2={x + 30} y2={70} stroke="var(--ink)" strokeWidth={2} /></g>)}</Art> },
    { caption: "长芦盐场，晒盐池里堆起白花花的盐", art: <Art bg="#eef4f7">{[30, 120, 210].map(x => <rect key={x} x={x} y={100} width={80} height={50} fill="#bfe0ee" stroke="#9cc" />)}<path d="M130 100 l20 -30 l20 30z" fill="#fff" stroke="#ccc" /></Art> },
  ] },
  guess: { question: "我国的内海是", options: ["渤海", "黄海", "南海"], right: 0, reveal: "渤海被辽东半岛和山东半岛环抱，是我国的内海。" },
  tasks: [["认识四海", "在地图上点出四海"], ["海洋资源", "给四个地点配资源"], ["保护海洋", "合理开发"]],
  blanks: [{ text: ["我国的内海是", "。"], options: ["渤海", "黄海"] }, { text: ["我国面积最大、最深的海是", "。"], options: ["南海", "东海"] }, { text: ["舟山渔场主要发展", "。"], options: ["海洋渔业", "海盐"] }, { text: ["开发海洋资源的同时要加强", "。"], options: ["保护", "污染"] }],
  title: () => "中国的海洋资源（天地图）",
  scene: ctx => <OceanScene ctx={ctx} />,
});

/* ======================= 4.2 工业 ======================= */
function IndustryScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0), f = useFinder(INDUSTRY_BASES, ctx, 0, "bases", 3, "四大工业基地都在东部沿海，交通便利、科技发达、市场广阔。", tab === 0);
  return <div>
    <Tabs tabs={["① 四大工业基地", "② 工厂选址", "③ 发展方向"]} at={tab} set={setTab} />
    {tab === 0 ? <Two map={<TdtMap base="vec" onPick={f.pick}>{f.pins}</TdtMap>} side={<><p className="text-sm text-muted">在地图上依次点出四大工业基地的大致位置：</p>{f.list}</>} />
      : tab === 1 ? <div className="max-w-2xl"><p className="mb-3 text-sm text-muted">不同工厂应该建在哪里？</p><Sorter items={firstOf(INDUSTRY_SITES)} cats={catsOf(Object.values(secondOf(INDUSTRY_SITES)))} answer={secondOf(INDUSTRY_SITES)} done={ctx.done[1]} onMiss={ctx.miss} onDone={p => ctx.complete(1, "工业布局要考虑原料、能源、市场、交通、科技等条件。", { sites: p })} /></div>
      : <div className="max-w-2xl space-y-3"><p className="text-sm text-muted">我国工业转型升级的方向是：</p><Choice disabled={ctx.done[2]} options={["大力发展高新技术产业", "只发展高耗能工业", "停止发展工业"]} onPick={o => o.startsWith("大力") ? ctx.complete(2, "高新技术产业多分布在智力资源密集、交通便利的大城市，如北京中关村。") : ctx.miss("高耗能工业会带来污染和资源浪费。")} /></div>}
  </div>;
}
export const industry = (): LessonConfig => ({
  phenomenon: { question: "手机、汽车、钢铁……这些工厂为什么都建在那些地方？", cards: [
    { caption: "珠江三角洲的电子厂，流水线上生产手机", art: <Art><rect x={20} y={110} width={280} height={20} fill="#9aa3b5" />{[40, 100, 160, 220].map(x => <rect key={x} x={x} y={90} width={30} height={20} rx={3} fill="#1f2a33" />)}</Art> },
    { caption: "鞍山的钢铁厂，高炉日夜不停", art: <Art bg="#f2e6d9"><rect x={120} y={50} width={40} height={120} fill="#7a5a3a" /><rect x={180} y={30} width={18} height={140} fill="#9aa3b5" /><circle cx={189} cy={22} r={12} fill="#ccc" opacity={0.7} /></Art> },
  ] },
  guess: { question: "钢铁厂一般建在哪里？", options: ["靠近煤炭和铁矿产地", "靠近高校", "靠近旅游景点"], right: 0, reveal: "钢铁工业需要大量煤和铁矿石，多靠近原料和能源产地。" },
  tasks: [["四大工业基地", "在地图上点出"], ["工厂选址", "工业区位"], ["发展方向", "高新技术产业"]],
  blanks: [{ text: ["我国工业主要分布在", "。"], options: ["东部沿海", "西部内陆"] }, { text: ["我国最大的综合性工业基地是", "工业基地。"], options: ["沪宁杭", "辽中南"] }, { text: ["甘蔗制糖厂要靠近", "产地。"], options: ["原料", "市场"] }, { text: ["工业转型升级要大力发展", "产业。"], options: ["高新技术", "高耗能"] }],
  title: () => "中国的工业（天地图）",
  scene: ctx => <IndustryScene ctx={ctx} />,
});

/* ======================= 4.3 交通运输 ======================= */
function TransportScene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const [tab, setTab] = useState(0), order = lineLabels(Object.keys(RAIL_LINES), seed), [hub, setHub] = useState<string | null>(null);
  return <div>
    <Tabs tabs={["① 选择运输方式", "② 铁路干线", "③ 交通枢纽"]} at={tab} set={setTab} />
    {tab === 0 ? <div className="max-w-2xl"><p className="mb-3 text-sm text-muted">根据货物和距离，选出最合适的运输方式：</p><Sorter items={firstOf(CARGO)} cats={catsOf(Object.values(secondOf(CARGO)))} answer={secondOf(CARGO)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "贵重、急需、量小的货物用航空；大宗、远程用铁路或水运；短途、灵活用公路；液体和气体用管道。", { cargo: p })} /></div>
      : <Two map={<TdtMap base="vec">{tab === 1 ? <LabeledLines lines={RAIL_LINES} order={order} color="#7a3fb0" /> : <>{Object.values(RAIL_LINES).map(r => <MapLine key={r.name} line={r.line} color="#7a3fb0" width={4} />)}{Object.entries(HUB_OPTIONS).map(([k, at]) => <g key={k} className="cursor-pointer" onClick={() => setHub(k)}><MapPin at={at} label={k} color={hub === k ? "var(--danger)" : "var(--accent)"} active={hub === k} /></g>)}</>}</TdtMap>} side={tab === 1 ? <><p className="text-sm text-muted">给地图上的四条铁路干线选名称：</p>{lineSorter(RAIL_LINES, order, ctx, 1, "lines", "京广线、京沪线是南北干线，陇海线、兰新线是东西干线。")}</>
        : <><p className="text-sm text-muted">点出京广线和陇海线交会的城市：</p><div className="text-sm">已选：<b>{hub ?? "无"}</b></div>{!ctx.done[2] && <button type="button" className="btn" disabled={!hub} onClick={() => hub === "郑州" ? ctx.complete(2, "郑州是京广线与陇海线的交会点，是重要的铁路枢纽。", { hub }) : ctx.miss("顺着南北向的京广线和东西向的陇海线找交叉点。")}>确认</button>}</>} />}
  </div>;
}
export const transport = (seed: number): LessonConfig => ({
  phenomenon: { question: "早上在昆明采摘的鲜花，晚上就能出现在北京的花店，靠的是什么？", cards: [
    { caption: "昆明斗南花市，鲜花连夜装箱", art: <Art bg="#fdeef2">{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={30 + i * 24} cy={90 + (i % 2) * 20} r={10} fill={["#e85a8a", "#f0b73a", "#e8413b"][i % 3]} />)}</Art> },
    { caption: "运煤列车满载驶向东部沿海", art: <Art><line x1={0} y1={140} x2={320} y2={140} stroke="var(--ink)" strokeWidth={3} />{[20, 80, 140, 200, 260].map(x => <rect key={x} x={x} y={110} width={50} height={28} fill="#3b3b3b" />)}</Art> },
  ] },
  guess: { question: "运送急需的鲜花，最合适的运输方式是", options: ["航空运输", "水路运输", "管道运输"], right: 0, reveal: "鲜花易腐、价值高、量小，适合航空运输。" },
  tasks: [["选择运输方式", "给五种货物配方式"], ["铁路干线", "给四条干线选名称"], ["交通枢纽", "找出交会城市"]],
  blanks: [{ text: ["运送鲜花等急需货物，宜选择", "运输。"], options: ["航空", "水路"] }, { text: ["大宗煤炭远距离运输，宜选择", "运输。"], options: ["铁路", "航空"] }, { text: ["大宗货物远洋运输，宜选择", "运输。"], options: ["水路", "公路"] }, { text: ["京广线与陇海线交会于", "。"], options: ["郑州", "武汉"] }],
  title: () => "中国的交通运输（天地图）",
  scene: ctx => <TransportScene ctx={ctx} seed={seed} />,
});

/* ======================= 5.2 环境保护与发展 ======================= */
function EnvironmentScene({ ctx }: { ctx: LessonCtx }) {
  const [tab, setTab] = useState(0), [carbon, setCarbon] = useState<string[]>([]);
  return <div className="max-w-3xl">
    <Tabs tabs={["① 环境问题与对策", "② 低碳生活", "③ 双碳目标"]} at={tab} set={setTab} />
    {tab === 0 && <><p className="mb-3 text-sm text-muted">给每个环境问题选出对应的治理措施：</p><Sorter items={firstOf(ENV_MEASURES)} cats={catsOf(Object.values(secondOf(ENV_MEASURES)))} answer={secondOf(ENV_MEASURES)} done={ctx.done[0]} onMiss={ctx.miss} onDone={p => ctx.complete(0, "环境问题要从源头治理，坚持人与自然和谐共生。", { measures: p })} /></>}
    {tab === 1 && <div className="space-y-3"><p className="text-sm text-muted">选出所有低碳生活的做法：</p>{quiz(LOW_CARBON, carbon, setCarbon)}{!ctx.done[1] && <button type="button" className="btn" disabled={!carbon.length} onClick={() => allRight(LOW_CARBON, carbon) ? ctx.complete(1, "节约能源、减少浪费，从身边小事做起。", { carbon }) : ctx.miss("再检查一下，有没有浪费能源的做法或者漏选的。")}>确认</button>}</div>}
    {tab === 2 && <div className="space-y-3"><p className="text-sm text-muted">我国提出的“双碳”目标是：</p><Choice disabled={ctx.done[2]} options={["2030 年前碳达峰、2060 年前碳中和", "2060 年前碳达峰、2030 年前碳中和", "2020 年碳中和"]} onPick={o => o.startsWith("2030") ? ctx.complete(2, "碳达峰是二氧化碳排放量达到峰值后下降，碳中和是排放与吸收相抵。", { target: "2030-2060" }) : ctx.miss("先达峰，再中和。")} /></div>}
  </div>;
}
export const environment = (): LessonConfig => ({
  phenomenon: { question: "“绿水青山就是金山银山”，发展和保护能兼顾吗？", cards: [
    { caption: "塞罕坝：从荒原到百万亩人工林海", art: <Art bg="#eaf4e2">{Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${15 + i * 19} 160 l10 -40 l10 40z`} fill="#2f8a55" />)}</Art> },
    { caption: "曾经雾霾笼罩的城市，蓝天越来越多", art: <Art bg="#cfe6ff">{[40, 90, 140, 190, 240].map((x, i) => <rect key={x} x={x} y={80 + (i % 2) * 20} width={36} height={100} fill="#9aa3b5" />)}<circle cx={270} cy={40} r={20} fill="#ffcf4d" /></Art> },
  ] },
  guess: { question: "治理城市雾霾，最根本的办法是", options: ["发展清洁能源，减少燃煤", "多开空调", "每天洒水"], right: 0, reveal: "雾霾与燃煤、尾气排放有关，要从源头减少污染物排放。" },
  tasks: [["环境问题与对策", "四个问题配措施"], ["低碳生活", "选出正确做法"], ["双碳目标", "认识国家目标"]],
  blanks: [{ text: ["我们要走", "的可持续发展道路。"], options: ["人地协调", "先污染后治理"] }, { text: ["治理雾霾要发展", "。"], options: ["清洁能源", "燃煤发电"] }, { text: ["我国力争", "年前实现碳达峰。"], options: ["2030", "2060"] }, { text: ["我国努力争取", "年前实现碳中和。"], options: ["2060", "2030"] }],
  title: () => "环境保护与发展",
  scene: ctx => <EnvironmentScene ctx={ctx} />,
});
