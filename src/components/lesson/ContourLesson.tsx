"use client";
import { useMemo, useState } from "react";
import { riverLabel } from "@/lib/lessons";
import { FEATURES, hits, makeTerrain, profile, profileLine, profileOptions, riverLines, routes, toMap, type Feature, type Pt } from "@/lib/terrain";
import { ContourMap, ProfileChart, TerrainBlock } from "@/components/geo/Terrain";
import { Art } from "./LabKit";
import type { LessonConfig, LessonCtx } from "./LessonShell";

const Tabs = ({ tabs, at, set }: { tabs: string[]; at: number; set: (i: number) => void }) => <div className="seg mb-4 flex-wrap">{tabs.map((t, i) => <button key={t} type="button" aria-pressed={at === i} onClick={() => set(i)}>{t}</button>)}</div>;
const ROUTE_COLORS: Record<string, string> = { ridge: "#136f99", cliff: "#cc4130", direct: "#7a3fb0" };
const ROUTE_ORDER = (seed: number) => [["ridge", "cliff", "direct"], ["cliff", "direct", "ridge"], ["direct", "ridge", "cliff"]][Math.abs(Math.floor(seed / 5)) % 3];

function Scene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const t = useMemo(() => makeTerrain(seed), [seed]);
  const [tab, setTab] = useState(0), [hover, setHover] = useState<Pt | null>(null), [sel, setSel] = useState<Feature>("peak"), [marks, setMarks] = useState<Partial<Record<Feature, Pt>>>({});
  const [prof, setProf] = useState<number | null>(null), [route, setRoute] = useState<string | null>(null);
  const [A, B] = profileLine(t), order = profileOptions(seed), rl = riverLabel(seed), rs = routes(t), lines = riverLines(t);
  const candidates = [profile(t, A, B, 50), profile(t, B, A, 50), profile(t, toMap(t, [0.5, 0.04]), toMap(t, [0.5, 0.96]), 50)];
  const names = ["①", "②", "③"], rorder = ROUTE_ORDER(seed);
  function mark(p: Pt) {
    if (tab !== 0 || ctx.done[0]) return;
    if (!hits(t, sel, p)) return ctx.miss(`这里不是${FEATURES[sel]}。${{ peak: "山峰在一圈圈闭合等高线的中心，数值最大。", ridge: "山脊处等高线向低处凸出。", valley: "山谷处等高线向高处凸出。", saddle: "鞍部在两座山峰之间，像马鞍一样相对低。", cliff: "陡崖处几条等高线挤在一起甚至重合。" }[sel]}`);
    const next = { ...marks, [sel]: p }; setMarks(next); ctx.say(`找到了${FEATURES[sel]}。`);
    const rest = (Object.keys(FEATURES) as Feature[]).filter(f => !next[f]);
    if (rest.length) setSel(rest[0]); else ctx.complete(0, "五种地形部位都找到了：对照左边的立体山体看看它们的样子。", { marks: next });
  }
  return <div>
    <Tabs tabs={["① 找地形部位", "② 地形剖面", "③ 河流在哪", "④ 登山路线"]} at={tab} set={setTab} />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div><div className="label mb-1">立体沙盘（鼠标在右图移动，这里同步标出位置）</div><TerrainBlock t={t} marker={hover} /></div>
      <div className="space-y-3">
        <ContourMap t={t} onPoint={mark} onHover={setHover}>
          {tab === 0 && Object.entries(marks).map(([f, p]) => <g key={f} transform={`translate(${p[0]} ${p[1]})`}><circle r={0.014} fill="var(--accent)" stroke="#fff" strokeWidth={0.004} /><text y={-0.022} fontSize={0.03} textAnchor="middle" fontWeight={800} fill="var(--ink)" paintOrder="stroke" stroke="#fff" strokeWidth={0.008}>{FEATURES[f as Feature]}</text></g>)}
          {tab === 1 && <g><line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="var(--accent)" strokeWidth={0.005} strokeDasharray="0.015 0.01" />{[[A, "A"], [B, "B"]].map(([p, l]) => <text key={l as string} x={(p as Pt)[0]} y={(p as Pt)[1] - 0.015} fontSize={0.036} fontWeight={800} textAnchor="middle" fill="var(--accent)" paintOrder="stroke" stroke="#fff" strokeWidth={0.008}>{l as string}</text>)}</g>}
          {tab === 2 && (["valley", "ridge"] as const).map(k => <g key={k}><line x1={lines[k][0][0]} y1={lines[k][0][1]} x2={lines[k][1][0]} y2={lines[k][1][1]} stroke="#1f6fd1" strokeWidth={0.006} strokeDasharray="0.012 0.008" /><text x={lines[k][1][0]} y={lines[k][1][1] + 0.035} fontSize={0.036} fontWeight={800} textAnchor="middle" fill="#1f6fd1" paintOrder="stroke" stroke="#fff" strokeWidth={0.008}>{rl[k]}</text></g>)}
          {tab === 3 && rorder.map((k, i) => <g key={k}><polyline points={rs[k].map(p => p.join(",")).join(" ")} fill="none" stroke={ROUTE_COLORS[k]} strokeWidth={route === k ? 0.009 : 0.005} strokeLinejoin="round" /><text x={rs[k][0][0]} y={rs[k][0][1]} fontSize={0.04} fontWeight={800} textAnchor="middle" fill={ROUTE_COLORS[k]} paintOrder="stroke" stroke="#fff" strokeWidth={0.01}>{names[i]}</text></g>)}
        </ContourMap>
        {tab === 0 && <div className="flex flex-wrap items-center gap-2"><span className="label">要找：</span>{(Object.keys(FEATURES) as Feature[]).map(f => <button key={f} type="button" className="choice" aria-pressed={sel === f} disabled={!!marks[f] || ctx.done[0]} onClick={() => setSel(f)}>{marks[f] ? "✓ " : ""}{FEATURES[f]}</button>)}<span className="w-full text-xs text-muted">先选一种地形部位，再在等高线图上点出它的位置。</span></div>}
        {tab === 1 && <><p className="text-sm text-muted">沿 A—B 线切开山体，哪一个是它的剖面图？</p><div className="grid grid-cols-3 gap-2">{order.map((c, i) => <ProfileChart key={i} data={candidates[c]} label={names[i]} active={prof === i} onClick={() => setProf(i)} />)}</div>
          {!ctx.done[1] && <button type="button" className="btn" disabled={prof === null} onClick={() => prof === order.indexOf(0) ? ctx.complete(1, "A 端先爬上主峰，下到鞍部，再上次峰，最后到 B 端下坡。", { profile: prof }) : ctx.miss("从 A 出发，先经过哪座山峰？两座山哪座更高？")}>确认剖面</button>}</>}
        {tab === 2 && <><p className="text-sm text-muted">下雨后，雨水会汇集成小河。蓝色虚线{rl.valley}、{rl.ridge}哪一条会形成河流？</p><div className="flex gap-2">{(["valley", "ridge"] as const).map(k => <button key={k} type="button" className="choice" disabled={ctx.done[2]} onClick={() => k === "valley" ? ctx.complete(2, "山谷处地势低，雨水向谷底汇集形成河流；山脊是分水岭。", { river: "valley" }) : ctx.miss("这条线上等高线向低处凸出，是山脊，水会从两边流走。")}>{rl[k]}</button>)}</div></>}
        {tab === 3 && <><p className="text-sm text-muted">三条路线都能到主峰。哪条坡度最缓、最适合登山？</p><div className="flex gap-2">{rorder.map((k, i) => <button key={k} type="button" className="choice" aria-pressed={route === k} onClick={() => setRoute(k)} style={{ color: route === k ? undefined : ROUTE_COLORS[k] }}>路线{names[i]}</button>)}</div>
          {!ctx.done[3] && <button type="button" className="btn" disabled={!route} onClick={() => route === "ridge" ? ctx.complete(3, "这条路线上等高线最稀疏，坡度最缓；穿过等高线密集处和陡崖的路线又陡又危险。", { route }) : ctx.miss(route === "cliff" ? "这条路线经过等高线重合的陡崖，太危险了。" : "这条路线上等高线比较密，坡较陡。")}>就走这条</button>}</>}
      </div>
    </div>
  </div>;
}

export const contour = (seed: number): LessonConfig => ({
  phenomenon: { question: "平平的一张图，怎么看出哪里是山顶、哪里能爬、哪里有河？", cards: [
    { caption: "登山前，向导拿出一张画满弯弯曲曲线条的地图", art: <Art bg="#f6efdc">{[60, 46, 32, 18].map(r => <ellipse key={r} cx={120} cy={95} rx={r * 1.5} ry={r} fill="none" stroke="#7a5a35" strokeWidth={1.4} />)}{[40, 26, 12].map(r => <ellipse key={r} cx={230} cy={80} rx={r * 1.3} ry={r} fill="none" stroke="#7a5a35" strokeWidth={1.4} />)}</Art> },
    { caption: "从侧面看，一层层线条原来是一座座山", art: <Art bg="#e8f2f7"><path d="M10 160 L80 110 L120 60 L150 95 L175 85 L210 50 L250 110 L310 160Z" fill="#c9a46a" /><path d="M10 160 L80 110 L120 60 L150 95 L175 85 L210 50 L250 110 L310 160" fill="none" stroke="#7a5a35" strokeWidth={2} />{[130, 105, 80].map(y => <line key={y} x1={20} x2={300} y1={y} y2={y} stroke="#7a5a35" strokeDasharray="4 4" opacity={0.5} />)}</Art> },
  ] },
  guess: { question: "等高线画得很密的地方，坡度是", options: ["很缓", "很陡", "和疏密无关"], right: 1, reveal: "等高线越密，同样水平距离内高差越大，坡越陡。" },
  tasks: [["找出五种地形部位", "山峰、山脊、山谷、鞍部、陡崖"], ["选出正确的剖面图", "沿 A—B 切开山体"], ["判断河流位置", "雨水往哪里汇集"], ["规划登山路线", "选最缓、最安全的"]],
  blanks: [{ text: ["等高线向海拔高处凸出的部位是", "。"], options: ["山谷", "山脊"] }, { text: ["等高线向海拔低处凸出的部位是", "。"], options: ["山脊", "山谷"] }, { text: ["等高线越密集，坡度越", "。"], options: ["陡", "缓"] }, { text: ["两座山峰之间相对低洼的部位是", "。"], options: ["鞍部", "陡崖"] }, { text: ["河流一般发育在", "。"], options: ["山谷", "山脊"] }],
  title: () => "等高线沙盘",
  scene: ctx => <Scene ctx={ctx} seed={seed} />,
});
