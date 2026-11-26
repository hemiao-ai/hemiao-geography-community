"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { CITIES, dateLabel, dayLength, declination, localTime, longerDay, SOLAR_TERMS } from "@/lib/astro";
import { earthTerm, ORBIT_LABELS, orbitOffset, summerIndex } from "@/lib/lessons";
import { Globe, Orbit, type View } from "@/components/geo/Globe";
import { Art, Field } from "./LabKit";
import type { LessonConfig, LessonCtx } from "./LessonShell";

const Tabs = ({ tabs, at, set }: { tabs: string[]; at: number; set: (i: number) => void }) => <div className="seg mb-4 flex-wrap">{tabs.map((t, i) => <button key={t} type="button" aria-pressed={at === i} onClick={() => set(i)}>{t}</button>)}</div>;
const hm = (h: number) => { const m = Math.round(h * 60) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const lat = (d: number) => `${Math.abs(d).toFixed(1)}°${d >= 0 ? "N" : "S"}`;

function DayBar({ name, hours }: { name: string; hours: number }) {
  const start = 12 - hours / 2;
  return <div className="flex items-center gap-3"><span className="w-12 text-sm font-bold">{name}</span>
    <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-[#1d2a3a]">
      <div className="absolute inset-y-0 bg-gradient-to-r from-[#ffd88a] via-[#ffe9b0] to-[#ffd88a]" style={{ left: `${(start / 24) * 100}%`, width: `${(hours / 24) * 100}%` }} />
      {Array.from({ length: 25 }, (_, h) => <span key={h} className="absolute bottom-0 w-px bg-black/35" style={{ left: `${(h / 24) * 100}%`, height: h % 6 === 0 ? 12 : 6 }} />)}
    </div></div>;
}

function Scene({ ctx, seed }: { ctx: LessonCtx; seed: number }) {
  const term = SOLAR_TERMS[earthTerm(seed)], offset = orbitOffset(seed);
  const [tab, setTab] = useState(0), [view, setView] = useState<View>({ lon0: 100, lat0: 18 }), [day, setDay] = useState(term.day > 200 ? 110 : 300), [utc, setUtc] = useState(1);
  const [longer, setLonger] = useState(""), [hours, setHours] = useState(""), [pos, setPos] = useState<number | null>(null);
  const bj = dayLength(CITIES.beijing.lat, day), sy = dayLength(CITIES.sydney.lat, day), d = declination(day);
  const labels = [0, 1, 2, 3].map(k => ORBIT_LABELS[(k - offset + 4) % 4]);
  return <div>
    <Tabs tabs={["① 直射点", "② 昼长", "③ 自转与时间", "④ 公转与四季"]} at={tab} set={setTab} />
    {tab < 3 ? <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[440px]"><Globe view={view} setView={setView} day={day} utc={utc} highlight={tab === 2 ? "beijing" : undefined} />
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px] text-muted"><span><i className="mr-1 inline-block h-0.5 w-4 bg-danger align-middle" />赤道</span><span><i className="mr-1 inline-block h-0.5 w-4 border-t-2 border-dashed border-accent-2 align-middle" />回归线</span><span><i className="mr-1 inline-block h-0.5 w-4 border-t-2 border-dotted border-accent align-middle" />极圈</span><span>拖动地球可以旋转</span></div></div>
      <div className="space-y-4">
        {tab === 0 && <>
          <p className="text-[15px] font-bold">任务：让太阳直射<span className="text-accent">{term.line}</span></p>
          <label className="block"><span className="label">日期：{dateLabel(day)}</span><input type="range" min={1} max={365} value={day} onChange={e => setDay(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
          <div className="rounded-[10px] bg-raised p-3 text-sm">太阳直射点：<b className="num">{lat(d)}</b></div>
          {!ctx.done[0] && <button type="button" className="btn" onClick={() => Math.abs(day - term.day) <= 2 ? ctx.complete(0, `${dateLabel(term.day)}前后是${term.name}，太阳直射${term.line}。直射点在南北回归线之间来回移动。`, { day }) : ctx.miss(`现在直射点在 ${lat(d)}，${term.line}在 ${lat(term.lat)}。`)}>就是这一天</button>}
        </>}
        {tab === 1 && <>
          <p className="text-sm text-muted">日期：{dateLabel(day)}（直射 {lat(d)}）。比较北京和悉尼的昼长：</p>
          <DayBar name="北京" hours={bj} /><DayBar name="悉尼" hours={sy} />
          <div className="flex justify-between px-14 text-[10px] text-muted num"><span>0 时</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
          <div className="w-48"><Field label="北京的昼长约（小时）" value={hours} set={setHours} /></div>
          <div className="seg">{([["a", "北京更长"], ["b", "悉尼更长"], ["equal", "差不多一样长"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={longer === k} onClick={() => setLonger(k)}>{l}</button>)}</div>
          {!ctx.done[1] && <button type="button" className="btn" disabled={!hours || !longer || !ctx.done[0]} onClick={() => {
            if (Math.abs(Number(hours) - bj) > 0.5) return ctx.miss("数一数亮的部分跨了几个小时格，每格 1 小时。");
            if (longer !== longerDay(bj, sy)) return ctx.miss("比一比两条亮带的长短。");
            ctx.complete(1, longer === "equal" ? "春分、秋分全球昼夜等长。" : "同一天，北半球昼长时南半球昼短：南北半球的季节相反。", { longer, bjHours: Number(hours) });
          }}>{ctx.done[0] ? "确认" : "先完成任务①"}</button>}
        </>}
        {tab === 2 && <>
          <p className="text-[15px] font-bold">任务：让北京迎来正午（太阳在北京正上方的经线上）</p>
          <label className="block"><span className="label">伦敦（0° 经线）地方时 {hm(utc)}</span><input type="range" min={0} max={23.9} step={0.1} value={utc} onChange={e => setUtc(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
          <p className="text-sm text-muted">拖动时间，看晨昏线怎样扫过地球。地球自西向东转，东边的地方先看到日出。</p>
          {!ctx.done[2] && <button type="button" className="btn" onClick={() => { const t = localTime(CITIES.beijing.lon, utc); if (Math.abs(t - 12) <= 0.5) ctx.complete(2, `伦敦 ${hm(utc)} 时，北京地方时约 12:00。经度每隔 15°，地方时相差 1 小时，东早西晚。`, { utc }); else ctx.miss(t < 12 ? "太阳还在北京东边，再往后拖一点。" : "太阳已经过了北京，往前拖一点。"); }}>北京正午了</button>}
        </>}
      </div>
    </div> : <div className="space-y-4">
      <Orbit labels={labels} picked={pos} onPick={setPos} day={day} />
      <p className="text-sm text-muted">地轴始终倾斜、北极指向同一方向。点出北半球是夏季（太阳直射北回归线）时，地球在哪个位置：</p>
      <div className="flex flex-wrap items-center gap-3"><span className="text-sm">已选：<b>{pos === null ? "无" : labels[pos]}</b></span>
        {!ctx.done[3] && <button type="button" className="btn" disabled={pos === null} onClick={() => { const idx = ORBIT_LABELS.indexOf(labels[pos!] as typeof ORBIT_LABELS[number]); if (idx === summerIndex(seed)) ctx.complete(3, "北极倾向太阳一侧时，太阳直射北半球，北半球昼长夜短、正午太阳高，是夏季。", { summerPos: idx }); else ctx.miss("看看哪个位置上，北极那一端朝着太阳。"); }}>确认位置</button>}</div>
    </div>}
  </div>;
}

export const earth = (seed: number): LessonConfig => ({
  phenomenon: { question: "同一天，为什么北京是夏天，悉尼却是冬天？", cards: [
    { caption: "6 月的北京，晚上 7 点多天还亮着", art: <Art bg="#ffe9c4"><circle cx={250} cy={60} r={26} fill="#ffb54d" /><rect x={40} y={110} width={240} height={70} fill="#c99b6a" />{[60, 110, 160, 210].map(x => <rect key={x} x={x} y={92} width={34} height={18} fill="#a5733f" />)}<text x={60} y={50} fontSize={18} fontWeight={800} fill="#6b3d12">19:30</text></Art> },
    { caption: "12 月的悉尼，人们在海滩上过圣诞节", art: <Art bg="#cfeaf7"><rect x={0} y={120} width={320} height={60} fill="#f2dca6" /><path d="M0 120 Q80 100 160 120 T320 120" fill="#7fc0e0" /><circle cx={60} cy={50} r={22} fill="#ffd04d" /><path d="M220 120 L240 70 L260 120Z" fill="#2f8a55" /><motion.circle cx={240} cy={66} r={4} fill="#e64" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} /></Art> },
  ] },
  guess: { question: "北半球为什么会有夏天？", options: ["夏天地球离太阳更近", "太阳直射点移到北半球，白天变长、太阳更高", "夏天地球转得更快"], right: 1, reveal: "四季是因为地轴倾斜、太阳直射点移动，不是因为离太阳远近。" },
  tasks: [["让太阳直射指定纬线", "拖动日期"], ["比较北京与悉尼的昼长", "读出昼长并比较"], ["让北京迎来正午", "拖动时间"], ["公转与四季", "找出北半球夏季的位置"]],
  blanks: [{ text: ["地球绕地轴", "自转。"], options: ["自西向东", "自东向西"] }, { text: ["地球自转产生了", "。"], options: ["昼夜交替", "四季变化"] }, { text: ["地球", "使太阳直射点在南北回归线之间移动，产生四季变化。"], options: ["公转", "自转"] }, { text: ["夏至日，太阳直射", "。"], options: ["北回归线", "赤道", "南回归线"] }, { text: ["南北半球的季节", "。"], options: ["相反", "相同"] }],
  title: () => "互动地球",
  scene: ctx => <Scene ctx={ctx} seed={seed} />,
});
