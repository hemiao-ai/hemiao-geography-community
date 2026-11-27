"use client";

import Link from "next/link";
import { useState } from "react";
import type { LessonType } from "@/lib/lessons";
import { saveLocalResult, startLocalLesson } from "@/lib/progress";
import { newRunSeed } from "@/lib/run-seed";
import { sfx } from "@/lib/sfx";
import { verifyLesson, type LabResult } from "@/lib/verify";
import { pointKey } from "@/data/catalog";
import { ArrowRight, ArrowsClockwise, Star } from "@/components/ui/Icon";
import { Callout, FrameContext, LabFrame } from "./LabFrame";
import { LessonView } from "./LessonView";

export function Workbench({ bookId, pointId, type, title, crumb, backHref }: {
  bookId: string; pointId: string; type: LessonType; title: string; crumb: string; backHref: string;
}) {
  const key = pointKey(bookId, pointId);
  const [run, setRun] = useState<{ seed: number; revision: number } | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);
  const [error, setError] = useState("");
  const start = () => {
    sfx.preload();
    startLocalLesson("guest", key);
    const seed = newRunSeed();
    setRun(previous => ({ seed, revision: (previous?.revision ?? 0) + 1 }));
    setResult(null);
    setError("");
  };
  const finish = (evidence: unknown) => {
    if (!run) return;
    try {
      const next = verifyLesson(type, run.seed, evidence);
      saveLocalResult("guest", key, next);
      setResult(next);
      sfx.fanfare(Math.min(next.stars, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "本次探究无法验算，请重试。");
    }
  };

  return <FrameContext.Provider value={{ backHref, title, crumb, pointKey: key, mode: "local" }}>
    {!run ? <LabFrame step={0}><div className="m-auto py-8 text-center">
      <h1 className="h-display text-3xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">完成情境、猜想、探究和归纳四个环节。</p>
      <button type="button" className="btn mt-5" onClick={start}>开始探险<ArrowRight size={16} aria-hidden="true" /></button>
    </div></LabFrame> : result ? <LabFrame step={4}><section className="panel m-auto w-full max-w-md p-8 text-center">
      <div className="flex justify-center gap-2" aria-label={`${result.stars} 星`}>{[1, 2, 3].map(i => <Star key={i} size={40} weight={i <= result.stars ? "fill" : "regular"} className={i <= result.stars ? "text-accent-3" : "text-muted/40"} aria-hidden="true" />)}</div>
      <h1 className="h-display mt-4 text-2xl">探险完成！</h1>
      <p className="mt-2 text-sm text-muted" role="status">学习结果已在本机验算并保存。</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Link href="/home" className="btn btn-secondary">学习首页</Link><button type="button" className="btn" onClick={start}><ArrowsClockwise size={16} aria-hidden="true" />再探一次</button></div>
    </section></LabFrame> : error ? <LabFrame step={4}><div className="m-auto space-y-4" role="alert">
      <Callout tone="bad">{error}</Callout><button type="button" className="btn" onClick={start}>重新开始</button>
    </div></LabFrame> : <LessonView key={run.revision} type={type} seed={run.seed} onFinish={finish} />}
  </FrameContext.Provider>;
}
