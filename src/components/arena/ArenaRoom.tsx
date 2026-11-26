"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { newRunSeed } from "@/lib/run-seed";
import { ARENA_ROOM } from "@/data/arena-rooms";
import { DIRECTIONS, ROUND, STAGES, coordLabel, type LatlonInput, type LatlonQuestion, type LonLat } from "@/lib/arena/latlon";
import { comboMultiplier, createPlay, currentQuestion, finish, submit, type Grade, type PlayState, type RunResult } from "@/lib/arena/play";
import { saveArenaRun, useArenaRecords } from "@/lib/arena/records";
import { STAGE_BPM, arenaMusic, musicLayer, useMusicEnabled } from "@/lib/arena-music";
import { sfx, useSfxEnabled } from "@/lib/sfx";
import { AppShell } from "@/components/shell/AppShell";
import { ArrowCounterClockwise, ArrowLeft, Lightning, MusicNotes, Play, SpeakerHigh, SpeakerSlash, Timer } from "@/components/ui/Icon";
import { FlatGrid, PolarGrid, type Dot } from "./Graticule";

type Phase = "ready" | "count" | "play" | "result";
interface Fx { kind: "correct" | "retry" | "skip"; text: string; key: number; reveal?: LatlonQuestion; wrongAt?: LonLat; wrongChoice?: string }
type Saved = ReturnType<typeof saveArenaRun>;
const GRADE_LEVEL: Record<Grade, number> = { C: 0, B: 1, A: 2, S: 3, SS: 4, SSS: 4 };
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

function Choices({ q, fx, onAnswer }: { q: Extract<LatlonQuestion, { click?: undefined }>; fx: Fx | null; onAnswer: (v: string) => void }) {
  const reveal = fx?.kind === "skip";
  const cls = (c: string) => `choice h-auto min-h-14 gap-2.5 px-3.5 py-3 text-[15px] ${reveal && c === q.answer ? "border-good! bg-good/15!" : fx?.wrongChoice === c && !(reveal && c === q.answer) ? "border-accent-2! bg-accent-2/12!" : ""}`;
  if (q.choices === DIRECTIONS) {
    const grid = ["西北", "北", "东北", "西", "", "东", "西南", "南", "东南"];
    return <div className="mx-auto mt-5 grid max-w-72 grid-cols-3 gap-2">{grid.map((c, i) => c ? <button key={c} type="button" disabled={reveal} onClick={() => onAnswer(c)} className={`${cls(c)} justify-center`}>{c}</button>
      : <span key={i} className="grid place-items-center text-xs font-bold text-muted">方向</span>)}</div>;
  }
  if (q.choices.length === 4 && q.choices.every(c => c.length === 1)) {
    return <div className="mt-5 grid grid-cols-4 gap-2">{q.choices.map(c => <button key={c} type="button" disabled={reveal} onClick={() => onAnswer(c)} className={`${cls(c)} justify-center text-lg font-black`}>{c}</button>)}</div>;
  }
  return <div className={`mt-5 grid gap-3 ${q.choices.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>{q.choices.map((c, i) => <button key={c} type="button" disabled={reveal} onClick={() => onAnswer(c)} className={`${cls(c)} justify-start text-left`}>
    <span className="num grid size-6 shrink-0 place-items-center rounded-md bg-raised text-xs text-muted">{i + 1}</span><span className="num">{c}</span></button>)}</div>;
}

function QuestionView({ q, fx, onAnswer }: { q: LatlonQuestion; fx: Fx | null; onAnswer: (v: LatlonInput) => void }) {
  const reveal = fx?.kind === "skip";
  const dots: Dot[] = q.click ? [...(fx?.wrongAt ? [{ at: fx.wrongAt, tone: "bad" as const }] : []), ...(reveal ? [{ at: q.answer, tone: "good" as const }] : [])]
    : q.pins.map(p => ({ at: p.at, label: p.label, tone: p.label ? "pin" as const : "mark" as const }));
  const figure = q.view === null ? <div className="grid min-h-56 place-items-center rounded-[12px] bg-raised p-6 text-center"><p className="h-display text-[26px] leading-snug">“{q.prompt}”</p></div>
    : q.view.kind === "flat" ? <FlatGrid view={q.view} dots={dots} onPick={q.click && !reveal ? onAnswer : undefined} /> : <PolarGrid view={q.view} dots={dots} />;
  return <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
    <div className={`rounded-[14px] border border-panel-border bg-panel-solid p-3 sm:p-4 ${fx?.kind === "retry" ? "animate-[shake_.3s]" : ""}`}>{figure}</div>
    <div>
      <p className="text-sm font-semibold text-muted">{q.click ? "点击经纬网" : q.view === null ? "判断对错" : "选出正确答案"}</p>
      <h2 className="h-display mt-1 text-[24px] leading-snug sm:text-[28px]">{q.view === null ? "这句话对吗？" : `${q.prompt}${q.click ? "" : "？"}`}</h2>
      {q.click ? <p className="mt-3 text-sm leading-6 text-muted">误差在半格（2.5°）以内都算对。{reveal && <b className="ml-1 text-good">正确位置：{coordLabel(q.answer)}</b>}</p>
        : <Choices q={q} fx={fx} onAnswer={onAnswer} />}
    </div>
  </div>;
}

export function ArenaRoom() {
  const room = ARENA_ROOM;
  const records = useArenaRecords("guest"), reduce = useReducedMotion();
  const soundOn = useSfxEnabled(), musicOn = useMusicEnabled();
  const [phase, setPhase] = useState<Phase>("ready"), [count, setCount] = useState(3), [elapsed, setElapsed] = useState(0);
  const [play, setPlay] = useState<PlayState | null>(null), [fx, setFx] = useState<Fx | null>(null);
  const [result, setResult] = useState<{ run: RunResult; saved: Saved } | null>(null);
  const seed = useRef(0);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playRef = useRef<PlayState | null>(null), startAt = useRef(0), lockUntil = useRef(0), fxKey = useRef(0);

  const end = useCallback((state: PlayState, at: number) => {
    const run = finish(state, at);
    const saved = saveArenaRun("guest", room.id, run);
    setResult({ run, saved });
    setPhase("result");
    setFx(null);
    sfx.fanfare(GRADE_LEVEL[run.grade]);
  }, [room.id]);

  const begin = () => {
    if (sfx.enabled || arenaMusic.enabled) sfx.unlock();
    sfx.preload();
    seed.current = newRunSeed();
    lockUntil.current = 0;
    setCount(3);
    setResult(null);
    setFx(null);
    setPhase("count");
  };

  useEffect(() => {
    if (phase !== "count") return;
    if (count === 0) {
      sfx.go();
      startAt.current = performance.now(); playRef.current = createPlay(seed.current);
      setPlay(playRef.current); setElapsed(0); setPhase("play"); return;
    }
    sfx.countdown(count);
    const t = setTimeout(() => setCount(c => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setElapsed(performance.now() - startAt.current), 250);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play" || !musicOn) return;
    const syncMusic = () => {
      const state = playRef.current;
      if (document.hidden) arenaMusic.stop();
      else if (state && !state.done && !arenaMusic.playing) {
        arenaMusic.start(STAGE_BPM[currentQuestion(state).stage]);
        arenaMusic.setLayer(musicLayer(state.combo));
      }
    };
    syncMusic();
    document.addEventListener("visibilitychange", syncMusic);
    return () => {
      document.removeEventListener("visibilitychange", syncMusic);
      arenaMusic.stop();
    };
  }, [phase, musicOn]);

  useEffect(() => () => {
    if (resultTimer.current) clearTimeout(resultTimer.current);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const answer = useCallback((input: LatlonInput) => {
    const state = playRef.current, now = performance.now();
    if (!state || state.done || now < lockUntil.current) return;
    const at = Math.max(1, Math.round(now - startAt.current)), q = currentQuestion(state), { state: next, event } = submit(state, input, at), key = ++fxKey.current;
    const wrongAt = Array.isArray(input) ? input : undefined, wrongChoice = typeof input === "string" ? input : undefined;
    playRef.current = next; setPlay(next);
    sfx.tap();
    arenaMusic.setLayer(musicLayer(next.combo));
    const nextStage = next.done ? q.stage : currentQuestion(next).stage;
    const stageChanged = nextStage !== q.stage;
    if (stageChanged) arenaMusic.setTempo(STAGE_BPM[nextStage]);
    if (event.type === "correct") {
      sfx.correct(event.combo, event.judge === "perfect");
      if (event.tierUp) sfx.tier(Math.floor(Math.min(event.combo, 20) / 3), 0.18);
      setFx({ kind: "correct", key, text: `${event.judge === "perfect" ? "Perfect" : "Great"} +${event.gained}` }); lockUntil.current = now + 350;
    } else if (event.retry) {
      sfx.retry();
      if (event.brokeCombo) sfx.comboBreak();
      setFx({ kind: "retry", key, text: "再试一次", wrongAt, wrongChoice }); lockUntil.current = now + 300;
    } else {
      sfx.wrong();
      if (event.brokeCombo) sfx.comboBreak(0.12);
      setFx({ kind: "skip", key, text: "看一下正确答案", reveal: q, wrongAt, wrongChoice }); lockUntil.current = now + 1400;
    }
    const hold = event.type === "correct" ? 350 : event.retry ? 0 : 1400;
    const showAnswer = event.type === "wrong" && !event.retry;
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    if (next.done) resultTimer.current = setTimeout(() => end(next, at), hold + 200);
    else if (showAnswer || stageChanged) feedbackTimer.current = setTimeout(() => {
      if (showAnswer) setFx(f => f?.key === key && f.kind === "skip" ? null : f);
      if (stageChanged) sfx.stage();
    }, hold);
  }, [end]);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]") ||
        (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]"))) return;
      const q = playRef.current && !playRef.current.done && currentQuestion(playRef.current), n = Number(e.key);
      if (q && !q.click && q.choices !== DIRECTIONS && n >= 1 && n <= q.choices.length) answer(q.choices[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer]);

  const best = records?.rooms[room.id]?.best;
  const shown = fx?.reveal ?? (play && !play.done ? currentQuestion(play) : null);
  return <AppShell active="/arena" title={room.title} subtitle={`${room.book} · 闯关 ${ROUND} 题`}
    actions={<>
      <button type="button" className={`btn btn-secondary btn-sm w-9 px-0 ${musicOn ? "" : "opacity-50"}`} aria-label="背景音乐" aria-pressed={musicOn}
        title={musicOn ? "关闭背景音乐" : "开启背景音乐"} onClick={() => {
          if (!musicOn && phase === "play") sfx.unlock();
          arenaMusic.enabled = !musicOn;
        }}><MusicNotes size={17} weight={musicOn ? "fill" : "regular"} aria-hidden="true" /></button>
      <button type="button" className="btn btn-secondary btn-sm w-9 px-0" aria-label="音效" aria-pressed={soundOn}
        title={soundOn ? "关闭音效" : "开启音效"} onClick={() => {
          sfx.enabled = !soundOn;
          if (!soundOn) { sfx.tap(); sfx.preload(); }
        }}>{soundOn ? <SpeakerHigh size={17} aria-hidden="true" /> : <SpeakerSlash size={17} aria-hidden="true" />}</button>
      <Link href="/home" className="btn btn-secondary btn-sm"><ArrowLeft size={14} />学习首页</Link>
    </>}>
    {phase === "ready" && <div className="mx-auto max-w-5xl">
      <section className="panel p-6 sm:p-8">
        <h2 className="h-display text-3xl">{room.title}</h2>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-7 text-muted">{room.tips}</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">{STAGES.map((s, i) => <li key={s.label} className="rounded-[12px] border border-panel-border bg-panel-solid p-4">
          <div className="num text-xs font-bold text-muted">第 {s.from + 1}–{s.from + 5} 题</div>
          <div className="mt-1 font-bold">{s.label}</div>
          <div className="mt-1 text-xs leading-5 text-muted">{["读坐标、辨半球、分高中低纬度、判断经纬线特点", "点出坐标、只看度数判断东西经南北纬、多点判断、判方向", "读极地俯视图的坐标和半球，看自转方向判断南北极，判方向"][i]}</div>
          <div className="num mt-2 text-xs font-semibold text-accent-2">每题 {s.points} 分 · {s.targetMs / 1000} 秒内答对为 Perfect</div>
        </li>)}</ol>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button type="button" className="btn h-12 px-6 text-base" onClick={begin}><Play size={18} weight="fill" />开始闯关</button>
          {best && <span className="text-sm text-muted">本机最佳 <b className="num text-ink">{best.score}</b> 分{best.grade && <> · 评级 <b className="text-ink">{best.grade}</b></>}{best.elapsedMs ? <> · 用时 {clock(best.elapsedMs)}</> : null}</span>}
        </div>
      </section>
    </div>}

    {phase === "count" && <div className="grid min-h-[60vh] place-items-center">
      <AnimatePresence mode="wait"><motion.div key={count} initial={reduce ? false : { scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
        className="h-display num text-[120px] text-accent">{count || "开始"}</motion.div></AnimatePresence>
    </div>}

    {phase === "play" && play && shown && <div className="mx-auto max-w-[1100px] space-y-4">
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        <span className="num text-lg font-black">{shown.index + 1}<span className="text-sm font-semibold text-muted"> / {ROUND}</span></span>
        <span className="num text-2xl font-black">{play.score}<span className="ml-1 text-xs font-semibold text-muted">分</span></span>
        <span className={`flex items-center gap-1 font-bold ${play.combo >= 3 ? "text-accent-2" : "text-muted"}`}><Lightning size={18} weight={play.combo >= 3 ? "fill" : "regular"} /><span className="num">连击 {play.combo}</span>{comboMultiplier(play.combo) > 1 && <span className="num text-xs">×{comboMultiplier(play.combo)}</span>}</span>
        <span className="flex items-center gap-1 text-sm text-muted"><Timer size={16} /><span className="num">{clock(elapsed)}</span></span>
        <span className="ml-auto rounded-full bg-raised px-3 py-1 text-xs font-bold">第 {shown.stage + 1} 段 · {STAGES[shown.stage].label}</span>
        <ol className="flex w-full gap-1" aria-label="答题进度">{Array.from({ length: ROUND }, (_, i) => <li key={i} className={`h-1.5 flex-1 rounded-full ${i < play.index ? "bg-accent" : i === shown.index ? "bg-accent/40" : "bg-panel-border"}`} />)}</ol>
      </div>
      <section className="panel relative p-5 sm:p-6">
        <QuestionView q={shown} fx={fx} onAnswer={answer} />
        <AnimatePresence>{fx && <motion.div key={fx.key} initial={reduce ? false : { y: 8, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className={`num pointer-events-none absolute top-4 right-5 rounded-full px-3 py-1 text-sm font-black ${fx.kind === "correct" ? "bg-good/15 text-good" : fx.kind === "retry" ? "bg-accent-2/15 text-accent-2" : "bg-danger/12 text-danger"}`}>{fx.text}</motion.div>}</AnimatePresence>
      </section>
    </div>}

    {phase === "result" && result && <ResultView {...result} onAgain={begin} />}
  </AppShell>;
}

function ResultView({ run, saved, onAgain }: { run: RunResult; saved: Saved; onAgain: () => void }) {
  const reduce = useReducedMotion();
  return <div className="mx-auto max-w-4xl">
    <section className="panel p-6 text-center sm:p-8">
      {saved.isBest && <span className="inline-block rotate-[-4deg] rounded-[10px] border-2 border-dashed border-accent-2 px-3 py-1 text-sm font-black text-accent-2">{saved.previousBest === null ? "首次纪录" : "刷新本机纪录"}</span>}
      <motion.div initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="h-display num mt-4 text-[88px] leading-none text-accent">{run.grade}</motion.div>
      <div className="num mt-2 text-3xl font-black">{run.score}<span className="ml-1 text-sm font-semibold text-muted">分</span></div>
      <dl className="mx-auto mt-6 grid max-w-xl grid-cols-4 divide-x divide-panel-border rounded-[12px] border border-panel-border bg-panel-solid py-3">
        <div><dt className="label">答对</dt><dd className="num text-xl font-bold">{run.correct}/{run.total}</dd></div>
        <div><dt className="label">Perfect</dt><dd className="num text-xl font-bold">{run.perfect}</dd></div>
        <div><dt className="label">最高连击</dt><dd className="num text-xl font-bold">{run.maxCombo}</dd></div>
        <div><dt className="label">用时</dt><dd className="num text-xl font-bold">{clock(run.elapsedMs)}</dd></div>
      </dl>
      <p className="mt-5 text-sm text-muted" role="status">本局成绩已保存到此浏览器。
        {saved.previousBest !== null && !saved.isBest && <span className="ml-2">本机最佳 {saved.previousBest} 分</span>}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn h-12 px-6" onClick={onAgain}><ArrowCounterClockwise size={18} weight="bold" />再来一局</button>
        <Link href="/home" className="btn btn-secondary h-12 px-6">学习首页</Link>
      </div>
    </section>
  </div>;
}
