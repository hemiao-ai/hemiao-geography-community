"use client";
import { useSyncExternalStore } from "react";

export type Theme = "paper" | "night";
const KEY = "hm-geo-theme";

const listeners = new Set<() => void>();
const read = (): Theme => (typeof document !== "undefined" && document.documentElement.dataset.theme === "night" ? "night" : "paper");
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* 隐私模式下只在本页生效 */ }
  listeners.forEach(l => l());
}
export const useTheme = () => useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => "paper" as Theme);
