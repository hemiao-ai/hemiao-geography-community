"use client";
import { useSyncExternalStore } from "react";
import type { LabResult } from "./verify";

export type Progress = Record<string, LabResult>;
export type ProgressScope = "guest";
export type Learning = { progress: Progress; started: Record<string, string>; ready: boolean };

const PROGRESS_KEY = "hm-geo-progress";
const WAITING: Learning = { progress: {}, started: {}, ready: false };
const EMPTY: Learning = { ...WAITING, ready: true };
const cache = new Map<ProgressScope, Learning>();
const listeners = new Set<() => void>();
const storageKey = (scope: ProgressScope) => `${PROGRESS_KEY}:${scope}`;

function currentLessonKeys<Value>(record?: Record<string, Value> | null) {
  const { earth, contour, ...current } = record ?? {};
  if (earth !== undefined) current["rj-g7a/c1s3"] ??= earth;
  if (contour !== undefined) current["rj-g7a/c2s2"] ??= contour;
  return current;
}

function read(scope: ProgressScope): Learning {
  try {
    const saved = localStorage.getItem(storageKey(scope));
    if (saved) {
      const data = JSON.parse(saved);
      return { progress: currentLessonKeys(data?.progress), started: currentLessonKeys(data?.started), ready: true };
    }
    if (scope === "guest") return { ...EMPTY, progress: currentLessonKeys(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") ?? {}) };
  } catch { /* 存储无法读取时使用空记录。 */ }
  return EMPTY;
}

function current(scope: ProgressScope) {
  const saved = cache.get(scope);
  if (saved) return saved;
  const next = read(scope);
  cache.set(scope, next);
  return next;
}

function onStorage(event: StorageEvent) {
  if (event.storageArea !== localStorage) return;
  for (const scope of cache.keys()) {
    if (!event.key || event.key === storageKey(scope) || (event.key === PROGRESS_KEY && scope === "guest")) cache.delete(scope);
  }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

export function useLearning(scope: ProgressScope | null) {
  return useSyncExternalStore(subscribe, () => scope ? current(scope) : WAITING, () => WAITING);
}

function save(scope: ProgressScope, next: Learning) {
  cache.set(scope, next);
  try { localStorage.setItem(storageKey(scope), JSON.stringify({ progress: next.progress, started: next.started })); }
  catch { /* 空间不足时只保留本次。 */ }
  listeners.forEach(listener => listener());
}

export function startLocalLesson(scope: "guest", key: string) {
  const previous = current(scope);
  if (previous.progress[key]) return;
  save(scope, { ...previous, started: { ...previous.started, [key]: new Date().toISOString() } });
}

export function saveLocalResult(scope: "guest", key: string, result: LabResult) {
  const previous = current(scope);
  const best = previous.progress[key];
  const started = { ...previous.started };
  delete started[key];
  save(scope, { ready: true, started, progress: { ...previous.progress, [key]: best && best.stars > result.stars
    ? { ...best, completedAt: result.completedAt } : result } });
}
