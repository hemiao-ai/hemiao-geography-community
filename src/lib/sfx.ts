"use client";
/**
 * 课程和竞技场音效。默认使用 Kenney 的 CC0 采样（public/sfx/kenney，授权见同目录 License.txt），每一类也可切回运行时合成音（移植自禾苗数学）。
 * 首次用户操作后才创建 AudioContext；开关存 hm-geo-sfx，各类采样的选择存 hm-geo-sfx-kit。
 */
import { useSyncExternalStore } from "react";

const KEY = "hm-geo-sfx", KIT_KEY = "hm-geo-sfx-kit", PENTATONIC = [0, 2, 4, 7, 9];
type Slot = "click" | "correct" | "wrong" | "tier" | "finish";
const SYNTH = "synth";
/** 候选采样：id 对应 public/sfx/kenney/<id>.m4a；source 为 Kenney 原始素材包与文件名 */
const SAMPLES: Record<Slot, { title: string; options: { id: string; source: string }[] }> = {
  click: { title: "点击", options: [{ id: "click-a", source: "Interface Sounds / click_001" }, { id: "click-b", source: "UI Audio / click1" }, { id: "click-c", source: "Interface Sounds / select_001" }] },
  correct: { title: "答对", options: [{ id: "correct-a", source: "Interface Sounds / confirmation_001" }, { id: "correct-b", source: "Interface Sounds / confirmation_002" }, { id: "correct-c", source: "Interface Sounds / glass_001" }, { id: "correct-d", source: "Music Jingles / HIT00" }] },
  wrong: { title: "答错", options: [{ id: "wrong-a", source: "Interface Sounds / error_004" }, { id: "wrong-b", source: "Interface Sounds / error_008" }, { id: "wrong-c", source: "Interface Sounds / error_006" }] },
  tier: { title: "连击升档", options: [{ id: "tier-a", source: "Digital Audio / powerUp2" }, { id: "tier-b", source: "Digital Audio / powerUp5" }, { id: "tier-c", source: "Music Jingles / PIZZI00" }] },
  finish: { title: "结算", options: [{ id: "finish-a", source: "Music Jingles / STEEL01" }, { id: "finish-b", source: "Music Jingles / PIZZI07" }, { id: "finish-c", source: "Music Jingles / NES00" }, { id: "finish-d", source: "Music Jingles / SAX03" }] },
};
type Kit = Record<Slot, string>;
const DEFAULT_KIT: Kit = { click: "click-a", correct: "correct-a", wrong: "wrong-a", tier: "tier-a", finish: "finish-a" };
function readKit(): Kit {
  try {
    const saved = JSON.parse(localStorage.getItem(KIT_KEY) ?? "{}") ?? {};
    return Object.fromEntries((Object.keys(SAMPLES) as Slot[]).map(slot => {
      const v = saved[slot]; return [slot, v === SYNTH || SAMPLES[slot].options.some(o => o.id === v) ? v : DEFAULT_KIT[slot]];
    })) as Kit;
  } catch { return DEFAULT_KIT; }
}
const noteFreq = (n: number, base = 523.25) => { const step = Math.round(n); return base * 2 ** ((PENTATONIC[((step % 5) + 5) % 5] + Math.floor(step / 5) * 12) / 12); };

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private busNode: AudioNode | null = null;
  private on: boolean | null = null;
  private listeners = new Set<() => void>();
  private kitValue: Kit | null = null;
  private buffers = new Map<string, AudioBuffer | Promise<AudioBuffer | null>>();
  private lessonFeedbackCount = 0;

  private get kit() { if (!this.kitValue) this.kitValue = readKit(); return this.kitValue; }
  /** 解码采样并缓存；返回 null 表示加载失败（此时退回合成音） */
  private load(id: string): Promise<AudioBuffer | null> {
    const hit = this.buffers.get(id);
    if (hit) return Promise.resolve(hit);
    const ctx = this.unlock();
    if (!ctx) return Promise.resolve(null);
    const job = fetch(`/sfx/kenney/${id}.m4a`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then(b => ctx.decodeAudioData(b))
      .then(buf => { this.buffers.set(id, buf); return buf; }).catch(() => { this.buffers.delete(id); return null; });
    this.buffers.set(id, job);
    return job;
  }
  /** 预加载当前选择的全部采样，开局前调用 */
  preload() {
    if (!this.enabled) return;
    for (const id of Object.values(this.kit)) if (id !== SYNTH) void this.load(id);
  }
  /** 播放已解码的采样；未就绪时返回 false，由调用方退回合成音 */
  private sample(id: string, { gain = 1, rate = 1, at = 0 } = {}) {
    const ctx = this.ready(), buf = this.buffers.get(id);
    if (!ctx || !this.master || !(buf instanceof AudioBuffer)) { if (ctx && !buf) void this.load(id); return false; }
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain;
    src.connect(g).connect(this.master); src.start(ctx.currentTime + at);
    return true;
  }
  private use(slot: Slot, opts?: { gain?: number; rate?: number; at?: number }) {
    if (!this.enabled) return false;
    const id = this.kit[slot];
    return id !== SYNTH && this.sample(id, opts);
  }

  get enabled() {
    if (this.on === null) { try { this.on = localStorage.getItem(KEY) === "on"; } catch { this.on = false; } }
    return this.on;
  }
  set enabled(value: boolean) {
    this.on = value;
    try { localStorage.setItem(KEY, value ? "on" : "off"); } catch { /* 隐私模式下只在本页生效 */ }
    if (this.master) this.master.gain.value = value ? 0.4 : 0;
    this.listeners.forEach(l => l());
  }
  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };

  unlock() {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? 0.4 : 0;
        this.busNode = this.ctx.createDynamicsCompressor(); this.busNode.connect(this.ctx.destination); this.master.connect(this.busNode);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
      return this.ctx;
    } catch { return null; }
  }
  private ready() { return this.enabled ? this.unlock() : null; }
  /** 供背景音乐共用的 AudioContext 与总线（不受音效开关影响） */
  get bus() { return this.busNode; }

  private tone(freq: number, { at = 0, dur = 0.12, type = "triangle" as OscillatorType, gain = 0.2, slideTo = 0 } = {}) {
    const ctx = this.ready(); if (!ctx || !this.master) return;
    const t = ctx.currentTime + at, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master); osc.start(t); osc.stop(t + dur + 0.02);
  }
  private noise(dur: number, cutoff: number, gain: number) {
    const ctx = this.ready(); if (!ctx || !this.master) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = "highpass"; f.frequency.value = cutoff; g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master); src.start();
  }

  /** 点击选项或经纬网 */
  tap() { if (!this.use("click", { gain: 0.8 })) this.noise(0.025, 2400, 0.14); }

  get lessonFeedbackVersion() { return this.lessonFeedbackCount; }

  lessonAnswer(correct: boolean) {
    this.lessonFeedbackCount++;
    if (correct) this.correct(1, false);
    else this.retry();
  }
  /** 答对：连击越高音越高；Perfect 多一个亮音 */
  correct(combo: number, perfect: boolean) {
    // 采样随连击升调，每档约一个半音，最多升 10 档
    if (this.use("correct", { rate: 2 ** (Math.min(combo - 1, 10) / 12), gain: perfect ? 1 : 0.8 })) return;
    const step = Math.min(combo, 14);
    this.tone(noteFreq(step), { dur: 0.14, gain: 0.16 });
    this.tone(noteFreq(step + 2), { at: 0.06, dur: 0.2, gain: perfect ? 0.16 : 0.1 });
    if (perfect) this.tone(noteFreq(step + 7), { at: 0.12, dur: 0.3, type: "sine", gain: 0.08 });
  }
  /** 答错还有一次机会 */
  retry() { if (!this.use("wrong", { gain: 0.6, rate: 1.12 })) this.tone(330, { dur: 0.14, gain: 0.1, slideTo: 262 }); }
  /** 两次答错，跳到下一题 */
  wrong() { if (this.use("wrong")) return; this.tone(392, { dur: 0.2, gain: 0.11, slideTo: 330 }); this.tone(311, { at: 0.18, dur: 0.36, gain: 0.11, slideTo: 220 }); }
  comboBreak(at = 0) { this.tone(523, { at, dur: 0.3, gain: 0.08, slideTo: 196 }); }
  /** 连击达到新档位 */
  tier(level: number, at: number) {
    if (this.use("tier", { at, gain: 0.8, rate: 2 ** (Math.min(level, 6) / 12) })) return;
    for (let i = 0; i < 4; i++) this.tone(noteFreq(level * 2 + i * 2), { at: at + i * 0.055, dur: 0.16, type: "square", gain: 0.06 });
    this.tone(noteFreq(level * 2 + 10), { at: at + 0.24, dur: 0.5, type: "sine", gain: 0.1 });
  }
  /** 进入新的难度段 */
  stage() { [0, 4, 7].forEach((s, i) => this.tone(noteFreq(s + 3, 392), { at: i * 0.07, dur: 0.22, type: "sine", gain: 0.1 })); }
  countdown(n: number) { this.tone(125, { dur: 0.13, type: "sine", gain: 0.12, slideTo: 48 }); this.tone([392, 494, 587][Math.max(0, Math.min(2, 3 - n))], { dur: 0.17, gain: 0.1 }); }
  go() { this.tone(523, { dur: 0.26, gain: 0.12, slideTo: 880 }); }
  /** 结算：评级越高旋律越长 */
  fanfare(level: number) {
    // 采样版：C、B 评级降低音量，S 以上额外叠一个升档音
    if (this.use("finish", { gain: level >= 2 ? 1 : 0.7 })) { if (level >= 3) this.use("tier", { at: 0.15, gain: 0.5 }); return; }
    const melody = [0, 2, 4, 5, 7, 10].slice(0, 2 + level);
    melody.forEach((s, i) => this.tone(noteFreq(s + 3), { at: i * 0.11, dur: i === melody.length - 1 ? 0.8 : 0.16, gain: 0.14 }));
    if (level >= 3) [0, 2, 4].forEach(s => this.tone(noteFreq(s + 10, 261.63), { at: melody.length * 0.11, dur: 1, type: "sine", gain: 0.07 }));
  }
}

export const sfx = new Sfx();
export const useSfxEnabled = () => useSyncExternalStore(sfx.subscribe, () => sfx.enabled, () => false);
