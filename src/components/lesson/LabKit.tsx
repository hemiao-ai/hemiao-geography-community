"use client";
import type { ReactNode } from "react";
import { Card } from "@/components/shell/AppShell";
import { Check } from "@/components/ui/Icon";

export const numInput = "num mt-1.5 h-11 w-full rounded-[10px] border border-panel-border bg-panel-solid px-3 text-lg font-bold outline-none focus:border-ink";
export function TaskList({ tasks }: { tasks: [string, boolean, string?][] }) {
  return <Card title="探究任务" extra={<span className="num text-sm font-bold text-muted">{tasks.filter(t => t[1]).length}/{tasks.length}</span>}>
    <ol className="space-y-2">{tasks.map(([t, ok, sub], i) => <li key={t} className={`flex gap-3 rounded-[10px] p-2.5 ${ok ? "bg-good/10" : "bg-raised"}`}>
      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${ok ? "bg-good text-white" : "border border-panel-border"}`}>{ok ? <Check size={12} weight="bold" /> : i + 1}</span>
      <span className="min-w-0"><span className="block text-sm font-semibold">{t}</span>{sub && <span className="block text-xs text-muted">{sub}</span>}</span></li>)}</ol>
  </Card>;
}
export function Field({ label, value, set, onEnter }: { label: string; value: string; set: (v: string) => void; onEnter?: () => void }) {
  return <label className="block"><span className="label">{label}</span><input value={value} inputMode="decimal" onChange={e => set(e.target.value.replace(/[^\d.]/g, ""))} onKeyDown={e => { if (e.key === "Enter") onEnter?.(); }} className={numInput} /></label>;
}
export function Art({ children, bg = "var(--canvas)" }: { children: ReactNode; bg?: string }) {
  return <svg viewBox="0 0 320 180" className="size-full"><rect width="320" height="180" fill={bg} />{children}</svg>;
}
