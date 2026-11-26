"use client";
/** 竞技场本机成绩：按学习身份（游客 / 账号）分开存放在 localStorage。 */
import { useSyncExternalStore } from "react";
import type { ProgressScope } from "../progress";
import type { RunResult } from "./play";

export interface BestRun extends RunResult { at: string }
export interface RoomRecord { best: BestRun | null; plays: number; lastPlayedAt?: string }
export interface ArenaRecords { rooms: Record<string, RoomRecord> }
const KEY = "hm-geo-arena", EMPTY: ArenaRecords = { rooms: {} };
const cache = new Map<string, ArenaRecords>(), listeners = new Set<() => void>();
const keyOf = (scope: ProgressScope) => `${KEY}:${scope}`;

function read(scope: ProgressScope): ArenaRecords {
  try {
    const data = JSON.parse(localStorage.getItem(keyOf(scope)) ?? "null");
    if (data && typeof data === "object" && data.rooms && typeof data.rooms === "object") return { rooms: data.rooms };
  } catch { /* 无法读取时使用空记录 */ }
  return EMPTY;
}
const current = (scope: ProgressScope) => { const hit = cache.get(scope); if (hit) return hit; const next = read(scope); cache.set(scope, next); return next; };
function subscribe(listener: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key?.startsWith(KEY)) { cache.clear(); listener(); } };
  listeners.add(listener); window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export const useArenaRecords = (scope: ProgressScope | null) =>
  useSyncExternalStore(subscribe, () => (scope ? current(scope) : null), () => null);

export function saveArenaRun(scope: ProgressScope, roomId: string, run: RunResult) {
  const prev = current(scope), room = prev.rooms[roomId] ?? { best: null, plays: 0 };
  const isBest = !room.best || run.score > room.best.score || (run.score === room.best.score && run.elapsedMs < (room.best.elapsedMs ?? Infinity));
  const at = new Date().toISOString();
  const next: ArenaRecords = { rooms: { ...prev.rooms, [roomId]: { plays: room.plays + 1, best: isBest ? { ...run, at } : room.best, lastPlayedAt: at } } };
  cache.set(scope, next);
  try { localStorage.setItem(keyOf(scope), JSON.stringify(next)); } catch { /* 空间不足时只保留本次 */ }
  listeners.forEach(l => l());
  return { isBest, previousBest: room.best?.score ?? null };
}
