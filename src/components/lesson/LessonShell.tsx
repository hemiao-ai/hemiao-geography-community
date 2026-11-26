"use client";
import { useCallback, useState, type ReactNode } from "react";
import { LESSONS, type LessonType } from "@/lib/lessons";
import { sfx } from "@/lib/sfx";
import { Card } from "@/components/shell/AppShell";
import { Callout, Conclusion, Guess, LabFrame, Phenomenon, type Blank } from "./LabFrame";
import { TaskList } from "./LabKit";

export interface LessonCtx {
  /** 第 i 个任务完成，可附带要交给服务端验算的数据 */
  complete: (i: number, text?: string, data?: Record<string, unknown>) => void;
  miss: (text: string) => void;
  say: (text: string, ok?: boolean) => void;
  done: boolean[];
}
export interface LessonConfig {
  phenomenon: { question: string; cards: { art: ReactNode; caption: string }[] };
  guess: { question: string; options: string[]; right: number; reveal: string };
  tasks: [string, string][];
  /** 结论填空：答案取自 LESSONS[type].conclusion 的同一位置 */
  blanks: { text: [string, string]; options: string[] }[];
  scene: (ctx: LessonCtx) => ReactNode;
  title?: (ctx: LessonCtx) => string;
}

function Quiz({ type, onDone, onMistake }: { type: LessonType; onDone: (answers: string[]) => void; onMistake: () => void }) {
  const items = LESSONS[type].quiz, [i, setI] = useState(0), [answers, setAnswers] = useState<string[]>([]), [wrong, setWrong] = useState<string | null>(null);
  const item = items[i];
  return <div className="m-auto w-full max-w-2xl py-6">
    <div className="label text-center">巩固练习 · {i + 1}/{items.length}</div>
    <h2 className="mt-2 text-center text-2xl font-black">{item.q}</h2>
    <div className="mt-6 grid gap-3">{item.options.map((o, k) => <button key={o} type="button" data-lesson-silent onClick={() => {
      if (o !== item.answer) { sfx.lessonAnswer(false); setWrong(o); onMistake(); return; }
      const next = [...answers, o]; setWrong(null); setAnswers(next);
      if (i + 1 === items.length) onDone(next);
      else { sfx.lessonAnswer(true); setI(i + 1); }
    }} className={`panel flex items-center gap-4 px-5 py-4 text-left text-[16px] font-bold shadow-none transition hover:border-ink/40 ${wrong === o ? "border-danger outline-2 outline-danger/60" : ""}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-raised text-sm font-black text-muted">{String.fromCharCode(65 + k)}</span>{o}</button>)}</div>
    {wrong && <div className="mt-4"><Callout tone="bad">再想一想，“{wrong}”不对。</Callout></div>}
  </div>;
}

export function LessonShell({ type, config, onFinish }: { type: LessonType; config: LessonConfig; onFinish: (e: unknown) => void }) {
  const spec = LESSONS[type];
  const [step, setStep] = useState(0), [guess, setGuess] = useState(0), [mistakes, setMistakes] = useState(0), [quizStep, setQuizStep] = useState(false), [concl, setConcl] = useState<string[]>([]);
  const [done, setDone] = useState<boolean[]>(() => config.tasks.map(() => false)), [data, setData] = useState<Record<string, unknown>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const complete = useCallback((i: number, text?: string, extra?: Record<string, unknown>) => {
    sfx.lessonAnswer(true);
    setDone(d => d.map((v, k) => (k === i ? true : v))); if (extra) setData(o => ({ ...o, ...extra })); if (text) setMsg({ ok: true, text });
  }, []);
  const miss = useCallback((text: string) => { sfx.lessonAnswer(false); setMistakes(m => m + 1); setMsg({ ok: false, text }); }, []);
  const say = useCallback((text: string, ok = true) => { sfx.lessonAnswer(ok); setMsg({ ok, text }); }, []);
  const ctx: LessonCtx = { complete, miss, say, done }, all = done.every(Boolean);
  const blanks: Blank[] = config.blanks.map((b, i) => ({ ...b, answer: spec.conclusion[i] }));
  return <LabFrame step={step}>
    {step === 0 && <Phenomenon question={config.phenomenon.question} cards={config.phenomenon.cards} onNext={() => setStep(1)} />}
    {step === 1 && <Guess question={config.guess.question} options={config.guess.options} onNext={g => { setGuess(g); setStep(2); }} />}
    {step === 2 && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] wide:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0" title={config.title?.(ctx) ?? config.tasks[Math.max(0, done.findIndex(d => !d))]?.[0] ?? "探究完成"}>
        <div onClickCapture={() => setMsg(null)}>{config.scene(ctx)}</div>
        {msg && <div className="mt-4"><Callout tone={msg.ok ? "good" : "bad"}>{msg.text}</Callout></div>}
      </Card>
      <aside className="flex flex-col gap-5"><TaskList tasks={config.tasks.map(([t, sub], i) => [t, done[i], sub])} />
        <button type="button" className="btn" disabled={!all} onClick={() => setStep(3)}>{all ? "去归纳规律" : `完成 ${config.tasks.length} 个任务后归纳`}</button></aside>
    </div>}
    {step === 3 && !quizStep && <Conclusion blanks={blanks} onMistake={() => setMistakes(m => m + 1)} onCorrect={a => { setConcl(a); setQuizStep(true); }}
      header={<p className="mt-2 text-center text-sm text-muted">{guess === config.guess.right ? `你一开始就猜对了：${config.guess.reveal}` : `探究中发现：${config.guess.reveal}`}</p>} />}
    {step === 3 && quizStep && <Quiz type={type} onMistake={() => setMistakes(m => m + 1)} onDone={quiz => onFinish({ done: done.filter(Boolean).length, data, conclusion: concl, quiz, mistakes })} />}
  </LabFrame>;
}

/** 把若干条目逐一归类：每个条目点选一个类别，全部正确后回调 */
export function Sorter<K extends string>({ items, cats, answer, onDone, onMiss, done }: { items: Record<string, string>; cats: Record<K, string>; answer: Record<string, K>; onDone: (picked: Record<string, K>) => void; onMiss: (t: string) => void; done: boolean }) {
  const [picked, setPicked] = useState<Record<string, K>>({});
  const full = Object.keys(items).every(k => picked[k]);
  return <div className="space-y-2">
    {Object.entries(items).map(([k, label]) => <div key={k} className={`flex flex-wrap items-center gap-2 rounded-[10px] p-2 ${done ? "bg-good/8" : "bg-raised"}`}>
      <span className={`text-sm font-semibold ${Object.keys(cats).length > 3 ? "w-full" : "min-w-36 flex-1"}`}>{label}</span>
      <div className="seg flex-wrap">{(Object.keys(cats) as K[]).map(c => <button key={c} type="button" className="whitespace-nowrap" disabled={done} aria-pressed={picked[k] === c} onClick={() => setPicked(p => ({ ...p, [k]: c }))}>{cats[c]}</button>)}</div>
    </div>)}
    {!done && <button type="button" className="btn mt-2" disabled={!full} onClick={() => {
      const bad = Object.keys(items).filter(k => picked[k] !== answer[k]);
      if (bad.length) onMiss(`“${items[bad[0]]}”分错了，再想一想。`);
      else {
        const feedbackVersion = sfx.lessonFeedbackVersion;
        onDone(picked);
        if (sfx.lessonFeedbackVersion === feedbackVersion) sfx.lessonAnswer(true);
      }
    }}>检查分类</button>}
  </div>;
}
