"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle, Info, Lightbulb, SpeakerHigh, SpeakerSlash, WarningCircle } from "@/components/ui/Icon";
import { sfx, useSfxEnabled } from "@/lib/sfx";
import { OfficialSiteLink, SiteCredits } from "@/components/shell/SiteCredits";

export const STEPS = ["情境", "猜想", "探究", "归纳"] as const;
export interface FrameMeta { backHref: string; crumb: string; title: string; mode: "local" | "server" }
export const FrameContext = createContext<FrameMeta>({ backHref: "/home", crumb: "", title: "", mode: "local" });

export function LabFrame({ step, children }: { step: number; children: ReactNode }) {
  const meta = useContext(FrameContext), steps = STEPS;
  const soundOn = useSfxEnabled();
  const feedbackBeforeClick = useRef(0);
  return <div className="flex min-h-dvh flex-col"
    onClickCapture={() => { feedbackBeforeClick.current = sfx.lessonFeedbackVersion; }}
    onClick={event => {
      if (event.defaultPrevented || feedbackBeforeClick.current !== sfx.lessonFeedbackVersion) return;
      const button = event.target instanceof Element && event.target.closest("button:not(:disabled)");
      if (button && !button.hasAttribute("data-lesson-silent")) sfx.tap();
    }}>
    <header className="sticky top-0 z-30 border-b border-panel-border bg-[color-mix(in_oklab,var(--bg)_90%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href={meta.backHref} aria-label="返回课程" className="btn btn-secondary btn-sm w-9 px-0"><ArrowLeft size={17} /></Link>
        <div className="min-w-0 max-lg:flex-1"><div className="truncate text-xs text-muted">{meta.crumb}</div><div className="h-display truncate text-[18px]">{meta.title}</div></div>
        <ol className="ml-auto hidden items-center gap-1 lg:flex">
          {steps.map((s, i) => <li key={s} className="flex items-center">
            <span className={`flex h-8 items-center gap-2 rounded-full pr-3 pl-1 text-sm font-bold ${i === step ? "bg-raised text-ink" : i < step ? "text-ink" : "text-muted"}`}>
              <span className={`grid size-6 place-items-center rounded-full text-xs font-black ${i < step ? "bg-good text-white" : i === step ? "bg-ink text-bg" : "border border-panel-border"}`}>{i < step ? <Check size={12} weight="bold" /> : i + 1}</span>{s}
            </span>
            {i < steps.length - 1 && <span className={`mx-1 h-px w-6 ${i < step ? "bg-good/60" : "bg-panel-border"}`} />}
          </li>)}
        </ol>
        <button type="button" className="btn btn-secondary btn-sm ml-auto w-9 shrink-0 px-0 lg:ml-0"
          aria-label="课程音效" aria-pressed={soundOn} title={soundOn ? "关闭课程音效" : "开启课程音效"} data-lesson-silent
          onClick={() => {
            sfx.enabled = !soundOn;
            if (!soundOn) { sfx.preload(); sfx.tap(); }
          }}>
          {soundOn ? <SpeakerHigh size={17} aria-hidden="true" /> : <SpeakerSlash size={17} aria-hidden="true" />}
        </button>
        <span className="hidden rounded-lg border border-dashed border-panel-border px-2.5 py-1 text-xs font-bold text-muted sm:block">{meta.mode === "server" ? "账号记录" : "本机记录"}</span>
        <OfficialSiteLink className="shrink-0 max-sm:px-2" />
      </div>
    </header>
    <AnimatePresence mode="wait">
      <motion.main key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
        className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-5 sm:px-6">{children}</motion.main>
    </AnimatePresence>
    <SiteCredits />
  </div>;
}

export function Callout({ tone = "info", children }: { tone?: "info" | "good" | "bad" | "tip"; children: ReactNode }) {
  const style = { info: ["bg-raised text-ink", Info], good: ["bg-good/12 text-good", CheckCircle], bad: ["bg-danger/12 text-danger", WarningCircle], tip: ["bg-accent-3/12 text-accent-3", Lightbulb] }[tone];
  const Icon = style[1] as typeof Info;
  return <motion.div key={String(children)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm leading-6 font-semibold ${style[0]}`}><Icon size={18} weight="fill" className="mt-0.5 shrink-0" /><span>{children}</span></motion.div>;
}

/** 现象剧场：两张情境卡 + 一个"为什么" */
export function Phenomenon({ cards, question, onNext }: { cards: { art: ReactNode; caption: string }[]; question: string; onNext: () => void }) {
  return <div className="m-auto w-full max-w-4xl py-6 text-center">
    <div className="label">探险情境</div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {cards.map((c, i) => <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} className="panel overflow-hidden p-3">
        <div className="aspect-[16/9] overflow-hidden rounded-2xl">{c.art}</div>
        <p className="px-2 pt-3 pb-1 text-[15px] font-bold">{c.caption}</p>
      </motion.div>)}
    </div>
    <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-2xl font-black sm:text-3xl">{question}</motion.h2>
    <button type="button" className="btn mt-6" onClick={onNext}>先猜一猜</button>
  </div>;
}

export function Guess({ question, options, onNext }: { question: string; options: string[]; onNext: (choice: number) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return <div className="m-auto w-full max-w-2xl py-6">
    <div className="label text-center">提出猜想</div>
    <h2 className="mt-2 text-center text-2xl font-black">{question}</h2>
    <p className="mt-2 text-center text-sm text-muted">先凭直觉选一个，探究完再回来看看。</p>
    <div className="mt-6 grid gap-3">
      {options.map((o, i) => <button key={o} type="button" onClick={() => setPick(i)} aria-pressed={pick === i}
        className={`panel flex items-center gap-4 px-5 py-4 text-left text-[16px] font-bold shadow-none transition ${pick === i ? "border-ink outline-2 outline-ink" : "hover:border-ink/40"}`}>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-black ${pick === i ? "bg-ink text-bg" : "bg-raised text-muted"}`}>{String.fromCharCode(65 + i)}</span>{o}
      </button>)}
    </div>
    <div className="mt-6 text-center"><button type="button" className="btn" disabled={pick === null} onClick={() => pick !== null && onNext(pick)}>记下猜想，开始探究</button></div>
  </div>;
}

/** 结论填空：每空从候选里选，全部正确后回调 */
export interface Blank { text: [string, string]; options: string[]; answer: string }
export function Conclusion({ blanks, header, onCorrect, onMistake }: { blanks: Blank[]; header?: ReactNode; onCorrect: (answers: string[]) => void; onMistake: () => void }) {
  const [picked, setPicked] = useState<Record<number, string>>({}), [checked, setChecked] = useState(false);
  const all = blanks.every((_, i) => picked[i]);
  return <div className="m-auto w-full max-w-3xl py-6">
    <div className="label text-center">得出结论</div>
    <h2 className="mt-2 text-center text-2xl font-black">根据你的探究，补全规律</h2>
    {header}
    <div className="mt-6 space-y-3">
      {blanks.map((b, i) => { const state = checked ? (picked[i] === b.answer ? "ring-2 ring-good/70" : "ring-2 ring-danger/70") : "";
        return <div key={i} className={`panel p-4 shadow-none ${state}`}>
          <p className="text-[17px] font-bold leading-9">{b.text[0]}<span className="mx-1 inline-block min-w-20 rounded-lg bg-raised px-3 text-center text-accent-2">{picked[i] ?? "？"}</span>{b.text[1]}</p>
          <div className="mt-2 flex flex-wrap gap-2">{b.options.map(o => <button key={o} type="button" className="choice" aria-pressed={picked[i] === o} onClick={() => { setPicked(p => ({ ...p, [i]: o })); setChecked(false); }}>{o}</button>)}</div>
        </div>; })}
    </div>
    <div className="mt-6 flex flex-col items-center gap-3">
      {checked && !blanks.every((b, i) => picked[i] === b.answer) && <Callout tone="bad">红框里的结论还不对，回想一下刚才看到的现象。</Callout>}
      <button type="button" className="btn" disabled={!all} onClick={() => {
        setChecked(true);
        const correct = blanks.every((b, i) => picked[i] === b.answer);
        sfx.lessonAnswer(correct);
        if (correct) onCorrect(blanks.map((_, i) => picked[i])); else onMistake();
      }}>提交结论</button>
    </div>
  </div>;
}
