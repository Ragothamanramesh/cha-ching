/* ══════════════════════════════════════════════════════════════════════════════
   KAI VOICE — Web Speech API (SpeechSynthesis)
   Kai talks out loud. Free, built into every browser, zero API cost.
   ══════════════════════════════════════════════════════════════════════════════ */

let enabled = true;
let cachedVoice: SpeechSynthesisVoice | null = null;

export function voiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function setVoiceEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem('cc-voice', v ? '1' : '0'); } catch { /**/ }
  if (!v) stopVoice();
}

export function isVoiceEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('cc-voice');
    if (s !== null) enabled = s === '1';
  }
  return enabled;
}

// Pick the best-sounding voice — prefer a natural en-US one, avoid robotic defaults
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Preference order: known good natural voices → any en-US → any en → first
  const prefer = [
    'Google US English', 'Microsoft Aria', 'Microsoft Guy', 'Samantha',
    'Microsoft Zira', 'Microsoft David',
  ];
  for (const name of prefer) {
    const v = voices.find(x => x.name.includes(name));
    if (v) { cachedVoice = v; return v; }
  }
  cachedVoice = voices.find(v => v.lang === 'en-US')
    ?? voices.find(v => v.lang.startsWith('en'))
    ?? voices[0];
  return cachedVoice;
}

// Some browsers load voices async — warm them up
export function primeVoices() {
  if (!voiceSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice(); };
}

export interface SpeakOpts {
  rate?: number;     // 0.1–10, default ~1.05 (slightly snappy)
  pitch?: number;    // 0–2, default ~1
  volume?: number;   // 0–1
  onEnd?: () => void;
  onStart?: () => void;
}

/** Speak text aloud as Kai. Strips emojis so they aren't read as "grinning face". */
export function speak(text: string, opts: SpeakOpts = {}) {
  if (!enabled || !voiceSupported()) { opts.onEnd?.(); return; }

  window.speechSynthesis.cancel(); // never overlap

  // Strip emojis + excess punctuation so TTS sounds clean
  const clean = text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) { opts.onEnd?.(); return; }

  const u = new SpeechSynthesisUtterance(clean);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate   = opts.rate   ?? 1.05;
  u.pitch  = opts.pitch  ?? 1.0;
  u.volume = opts.volume ?? 1.0;
  if (opts.onStart) u.onstart = opts.onStart;
  if (opts.onEnd)   u.onend   = opts.onEnd;

  window.speechSynthesis.speak(u);
}

export function stopVoice() {
  if (voiceSupported()) window.speechSynthesis.cancel();
}
