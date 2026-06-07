import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Typewriter } from './Typewriter';
import * as sfx from '@/utils/sound';
import { speak, stopVoice, isVoiceEnabled } from '@/utils/voice';

/* Kai's cold-open monologue. Dark comedy, satire, a little mean — but rooting for you. */
const LINES = [
  "oh. a new one.",
  "let me guess — you downloaded a *money game* because actual budgeting felt like a slow death.",
  "respect. self-awareness is step one. most people skip it.",
  "i'm Kai. your coach, your hype-man, and your personal source of guilt. mostly the guilt.",
  "here's the cold open: most people who say they'll 'start investing soon' never do. soon is the graveyard where dreams go to nap.",
  "but you showed up. that's either ambition or boredom. we'll find out which.",
  "this isn't a dashboard. it's a quest. you'll climb eras, dodge bad habits, and try not to embarrass us both.",
  "before we begin... who am i yelling at?",
];

export function StoryIntro() {
  const { setPhase, setUserName, userName } = useGameStore();
  const [line, setLine] = useState(0);
  const [name, setName] = useState(userName || '');
  const [lineComplete, setLineComplete] = useState(false);
  const isLast = line === LINES.length - 1;
  const spokenFor = useRef(-1);

  // Speak each line as it appears
  useEffect(() => {
    if (spokenFor.current === line) return;
    spokenFor.current = line;
    const clean = LINES[line].replace(/\*/g, '');
    speak(clean, { rate: 1.07, pitch: 1.0 });
    return () => stopVoice();
  }, [line]);

  const advance = () => {
    if (!lineComplete) return; // wait until line finishes typing
    sfx.click();
    if (isLast) return;        // last line waits for name submit
    setLineComplete(false);
    setLine(l => l + 1);
  };

  const skip = () => {
    stopVoice();
    sfx.whoosh();
    setLine(LINES.length - 1);
    setLineComplete(true);
  };

  const submitName = () => {
    const n = name.trim();
    if (!n) return;
    stopVoice();
    sfx.select();
    setUserName(n);
    setPhase('avatar');
  };

  // Render markdown-ish *emphasis*
  const renderLine = (t: string) => t.replace(/\*([^*]+)\*/g, '$1');

  return (
    <div className="cc-intro cc-bg" onClick={advance}>
      <div className="cc-intro-scanlines" aria-hidden />

      {/* Kai avatar — big, glowing, "speaking" */}
      <div className="cc-intro-kai">
        <div className="cc-intro-kai-orb cc-kai-talk">
          <span className="cc-intro-kai-face">◕ ◡ ◕</span>
        </div>
        <div className="cc-intro-kai-name">KAI</div>
        <div className="cc-intro-kai-role">your coach · mostly the guilt</div>
      </div>

      {/* Dialogue box */}
      <div className="cc-intro-box" onClick={(e) => { e.stopPropagation(); advance(); }}>
        <Typewriter
          key={line}
          text={renderLine(LINES[line])}
          speed={30}
          className="cc-intro-text"
          onDone={() => setLineComplete(true)}
        />

        {/* Name input on the last line */}
        {isLast && lineComplete && (
          <div className="cc-intro-namewrap cc-slide-up" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              className="cc-intro-name"
              placeholder="type your name, legend..."
              value={name}
              maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitName()}
            />
            <button className="btn btn-primary cc-intro-namebtn" onClick={submitName} disabled={!name.trim()}>
              that's me →
            </button>
          </div>
        )}

        {/* Advance hint */}
        {!isLast && lineComplete && (
          <div className="cc-intro-next cc-pulse-soft">tap to continue ▸</div>
        )}
      </div>

      {/* Skip + line counter */}
      <div className="cc-intro-foot">
        <span className="cc-intro-count">{line + 1} / {LINES.length}</span>
        {!isLast && (
          <button className="cc-intro-skip" onClick={(e) => { e.stopPropagation(); skip(); }}>
            skip intro »
          </button>
        )}
        {!isVoiceEnabled() && <span className="cc-intro-muted">🔇 voice off</span>}
      </div>
    </div>
  );
}
