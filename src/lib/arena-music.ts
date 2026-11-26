"use client";
/**
 * 竞技场氛围音乐：Web Audio 实时合成（移植自禾苗数学竞技场），不使用素材文件。
 * 四层声部：底鼓与贝斯 → 踩镲 → 军鼓 → 旋律，连击越高叠加越多；难度段越高节拍越快。开关存 hm-geo-music，与音效分开。
 */
import { useSyncExternalStore } from "react";
import { sfx } from "./sfx";

export type MusicLayer = 0 | 1 | 2 | 3;
/** 连击 3、5、7 起分别叠加第 2、3、4 层，与连击倍率档位一致 */
export const musicLayer = (combo: number): MusicLayer => (combo >= 7 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1 : 0);
export const STAGE_BPM = [100, 112, 124] as const;
const KEY = "hm-geo-music";

class ArenaMusic {
  private ctx: AudioContext | null = null;
  private mix: GainNode | null = null;
  private layers: GainNode[] = [];
  private sources = new Set<AudioScheduledSourceNode>();
  private timer: number | null = null;
  private noise: AudioBuffer | null = null;
  private fromBpm = 100; private targetBpm = 100; private tempoAt = 0;
  private step = 0; private nextAt = 0;
  private on: boolean | null = null;
  private listeners = new Set<() => void>();

  get enabled() {
    if (this.on === null) { try { this.on = localStorage.getItem(KEY) === "on"; } catch { this.on = false; } }
    return this.on;
  }
  set enabled(value: boolean) {
    this.on = value;
    try { localStorage.setItem(KEY, value ? "on" : "off"); } catch { /* 只在本页生效 */ }
    if (!value) this.stop();
    this.listeners.forEach(l => l());
  }
  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  get playing() { return this.timer !== null; }

  start(bpm: number = STAGE_BPM[0]) {
    if (!this.enabled || typeof window === "undefined" || document.hidden) return;
    this.stop();
    const ctx = sfx.unlock(), bus = sfx.bus;
    if (!ctx || !bus) return;
    try {
      this.ctx = ctx; this.fromBpm = bpm; this.targetBpm = bpm; this.tempoAt = ctx.currentTime; this.step = 0;
      this.mix = ctx.createGain(); this.mix.gain.value = 0.32; this.mix.connect(bus);
      this.layers = Array.from({ length: 4 }, (_, i) => { const g = ctx.createGain(); g.gain.value = i === 0 ? 1 : 0; g.connect(this.mix!); return g; });
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.nextAt = ctx.currentTime + 0.03;
      this.schedule();
      this.timer = window.setInterval(() => this.schedule(), 25);
    } catch { this.stop(); }
  }

  setLayer(level: MusicLayer) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 1; i < this.layers.length; i++) {
      const g = this.layers[i].gain;
      if (typeof g.cancelAndHoldAtTime === "function") g.cancelAndHoldAtTime(now); else { g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); }
      g.linearRampToValueAtTime(level >= i ? 1 : 0, now + 0.3);
    }
  }
  /** 两秒内平滑过渡到新节拍 */
  setTempo(bpm: number) {
    if (!this.ctx || bpm === this.targetBpm) return;
    const now = this.ctx.currentTime;
    this.fromBpm = this.tempo(now); this.targetBpm = bpm; this.tempoAt = now;
  }
  private tempo(at: number) { const k = Math.max(0, Math.min(1, (at - this.tempoAt) / 2)); return this.fromBpm + (this.targetBpm - this.fromBpm) * k; }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.mix) return;
    if (this.nextAt < ctx.currentTime - 0.1) { this.step += Math.floor((ctx.currentTime - this.nextAt) / (30 / this.tempo(ctx.currentTime))); this.nextAt = ctx.currentTime + 0.01; }
    while (this.nextAt < ctx.currentTime + 0.1) { this.playStep(this.step, this.nextAt); this.nextAt += 30 / this.tempo(this.nextAt); this.step++; }
  }
  private track(src: AudioScheduledSourceNode, nodes: AudioNode[], at: number, dur: number) {
    this.sources.add(src);
    src.onended = () => { this.sources.delete(src); src.disconnect(); nodes.forEach(n => n.disconnect()); };
    src.start(at); src.stop(at + dur + 0.02);
  }
  private tone(layer: number, at: number, freq: number, dur: number, vol: number, type: OscillatorType, endFreq?: number) {
    const ctx = this.ctx; if (!ctx || !this.layers[layer]) return;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, at);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.layers[layer]); this.track(osc, [g], at, dur);
  }
  private hit(layer: number, at: number, dur: number, vol: number, freq: number, type: BiquadFilterType) {
    const ctx = this.ctx; if (!ctx || !this.noise || !this.layers[layer]) return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.layers[layer]); this.track(src, [f, g], at, dur);
  }
  /** 一个八分音符：16 步为一小节循环，旋律用五声音阶 */
  private playStep(step: number, at: number) {
    if (step % 2 === 0) this.tone(0, at, 130, 0.16, 0.2, "sine", 45);
    const bass = [0, 0, 7, 5, 0, 0, 9, 7][step % 8];
    this.tone(0, at, 55 * 2 ** (bass / 12), 0.2, 0.1, "triangle");
    this.hit(1, at, 0.04, 0.035, 5000, "highpass");
    if (step % 8 === 2 || step % 8 === 6) this.hit(2, at, 0.12, 0.08, 1800, "bandpass");
    const note = [0, -1, 2, -1, 4, -1, 2, 3, 4, -1, 2, -1, 1, -1, 0, -1][step % 16];
    if (note >= 0) this.tone(3, at, 293.66 * 2 ** ([0, 2, 4, 7, 9][note] / 12), 0.2, 0.07, "sine");
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    if (this.mix && this.ctx) this.mix.gain.setValueAtTime(0, this.ctx.currentTime);
    for (const s of this.sources) { try { s.stop(); } catch { /* 已结束 */ } }
    this.sources.clear(); this.layers.forEach(l => l.disconnect()); this.mix?.disconnect();
    this.layers = []; this.mix = null; this.ctx = null; this.noise = null;
  }
}

export const arenaMusic = new ArenaMusic();
export const useMusicEnabled = () => useSyncExternalStore(arenaMusic.subscribe, () => arenaMusic.enabled, () => false);
