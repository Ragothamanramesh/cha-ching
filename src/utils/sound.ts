/* ══════════════════════════════════════════════════════════════════════════════
   CHA-CHING SOUND ENGINE
   Fully synthesized via Web Audio API — zero asset files, works offline.
   Every sound is generated from oscillators + envelopes at runtime.
   ══════════════════════════════════════════════════════════════════════════════ */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

// Lazy-init on first user gesture (browsers block audio before interaction)
function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem('cc-muted', v ? '1' : '0'); } catch { /**/ }
}
export function isMuted(): boolean {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('cc-muted');
    if (s !== null) muted = s === '1';
  }
  return muted;
}

// ── Primitive: a single enveloped tone ───────────────────────────────────────
function tone(opts: {
  freq: number;
  type?: OscillatorType;
  start?: number;     // offset seconds from now
  dur: number;
  vol?: number;
  glideTo?: number;   // frequency to glide to over duration
}) {
  const c = audio();
  const g = masterGain!;
  const t0 = c.currentTime + (opts.start ?? 0);
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.glideTo) osc.frequency.exponentialRampToValueAtTime(opts.glideTo, t0 + opts.dur);

  const peak = opts.vol ?? 0.3;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);            // fast attack
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);       // decay

  osc.connect(env);
  env.connect(g);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

// ── Primitive: filtered noise burst (for cash-register clack, sparkles) ───────
function noise(opts: { dur: number; start?: number; vol?: number; hp?: number; lp?: number }) {
  const c = audio();
  const t0 = c.currentTime + (opts.start ?? 0);
  const frames = Math.floor(c.sampleRate * opts.dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  let node: AudioNode = src;
  if (opts.hp) { const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = opts.hp; node.connect(f); node = f; }
  if (opts.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass';  f.frequency.value = opts.lp; node.connect(f); node = f; }

  const env = c.createGain();
  const peak = opts.vol ?? 0.15;
  env.gain.setValueAtTime(peak, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  node.connect(env);
  env.connect(masterGain!);
  src.start(t0);
  src.stop(t0 + opts.dur + 0.02);
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE SOUNDS
   ══════════════════════════════════════════════════════════════════════════════ */

// 💰 The signature "cha-CHING" — cash register: clack + bright two-note bell shimmer
export function chaChing() {
  if (muted) return;
  // "cha" — the drawer clack
  noise({ dur: 0.05, vol: 0.25, hp: 2000, lp: 7000 });
  // "ching" — bright bell, major third stacked (C6 + E6 + G6 sparkle)
  tone({ freq: 1046, type: 'triangle', start: 0.04, dur: 0.5, vol: 0.32 });
  tone({ freq: 1318, type: 'triangle', start: 0.05, dur: 0.55, vol: 0.26 });
  tone({ freq: 1568, type: 'sine',     start: 0.06, dur: 0.6,  vol: 0.20 });
  // sparkle tail
  tone({ freq: 2093, type: 'sine', start: 0.12, dur: 0.4, vol: 0.12 });
}

// 🪙 Single coin drop — quick metallic ping
export function coin() {
  if (muted) return;
  tone({ freq: 988,  type: 'square', dur: 0.08, vol: 0.18 });
  tone({ freq: 1318, type: 'square', start: 0.06, dur: 0.12, vol: 0.16 });
}

// 🔘 Soft UI click / tap
export function click() {
  if (muted) return;
  tone({ freq: 420, type: 'sine', dur: 0.05, vol: 0.12, glideTo: 600 });
}

// ✅ Selection confirm — pleasant upward blip
export function select() {
  if (muted) return;
  tone({ freq: 523, type: 'triangle', dur: 0.09, vol: 0.18 });
  tone({ freq: 784, type: 'triangle', start: 0.07, dur: 0.12, vol: 0.16 });
}

// 🎺 Era / level up — triumphant ascending arpeggio (C-E-G-C major)
export function levelUp() {
  if (muted) return;
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.1, dur: 0.4, vol: 0.28 }));
  // big chord finish + cha-ching layered on top
  tone({ freq: 1046, type: 'sine', start: 0.4, dur: 0.7, vol: 0.22 });
  tone({ freq: 1318, type: 'sine', start: 0.4, dur: 0.7, vol: 0.18 });
  noise({ dur: 0.5, start: 0.4, vol: 0.06, hp: 6000 }); // shimmer
}

// 🏅 Badge unlock — bright two-tone "ta-da"
export function badge() {
  if (muted) return;
  tone({ freq: 659, type: 'triangle', dur: 0.12, vol: 0.24 });
  tone({ freq: 988, type: 'triangle', start: 0.1, dur: 0.3, vol: 0.24 });
  noise({ dur: 0.25, start: 0.1, vol: 0.05, hp: 7000 });
}

// 📉 Portfolio drop — sad descending wah
export function drop() {
  if (muted) return;
  tone({ freq: 440, type: 'sawtooth', dur: 0.5, vol: 0.18, glideTo: 180 });
}

// 🔥 Streak tick — quick rising whoosh
export function streak() {
  if (muted) return;
  tone({ freq: 600, type: 'sine', dur: 0.2, vol: 0.16, glideTo: 1200 });
  noise({ dur: 0.18, vol: 0.06, hp: 3000, lp: 8000 });
}

// 💬 Kai message arrives — soft friendly blip
export function message() {
  if (muted) return;
  tone({ freq: 700, type: 'sine', dur: 0.08, vol: 0.14 });
  tone({ freq: 900, type: 'sine', start: 0.06, dur: 0.1, vol: 0.12 });
}

// ⌨️ Typewriter tick (for Kai's typing animation) — very subtle
export function typeTick() {
  if (muted) return;
  tone({ freq: 1200 + Math.random() * 400, type: 'square', dur: 0.015, vol: 0.04 });
}

// 🎲 Whoosh — screen transitions
export function whoosh() {
  if (muted) return;
  noise({ dur: 0.3, vol: 0.10, hp: 400, lp: 4000 });
}

// Prime the audio context on first gesture (call from a click handler)
export function primeAudio() {
  audio();
}
