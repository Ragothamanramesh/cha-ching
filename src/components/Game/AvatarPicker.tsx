import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { AVATARS } from '@/utils/avatars';
import * as sfx from '@/utils/sound';
import { speak, stopVoice } from '@/utils/voice';

/* Kai's reactions when you hover/select each avatar — keeps the personality alive */
const KAI_REACT: Record<string, string> = {
  goblin:  "the goblin. you'll have a net worth and zero friends. worth it.",
  shark:   "the shark. high risk, high reward, high blood pressure. let's go.",
  monk:    "the monk. boring. disciplined. annoyingly rich in 20 years.",
  gremlin: "the gremlin. pure chaos. i can't protect you. i won't try.",
  phoenix: "the phoenix. been broke, came back. i love a redemption arc.",
  owl:     "the strategist. you'll out-spreadsheet everyone. nerd. respect.",
  cat:     "the opportunist. suspiciously lucky. i'm watching you.",
  robot:   "the machine. no emotion, pure discipline. genuinely terrifying.",
};

export function AvatarPicker() {
  const { setAvatar, setPhase, userName } = useGameStore();
  const [picked, setPicked] = useState<string | null>(null);
  const greeted = useRef(false);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    speak(`alright ${userName}. pick your fighter. choose wisely — or don't, i'm not your mom.`, { rate: 1.07 });
    return () => stopVoice();
  }, [userName]);

  const choose = (id: string) => {
    sfx.select();
    setPicked(id);
    stopVoice();
    speak(KAI_REACT[id] ?? '', { rate: 1.08 });
  };

  const confirm = () => {
    if (!picked) return;
    stopVoice();
    sfx.chaChing();
    setAvatar(picked);
    setPhase('goal');
  };

  return (
    <div className="cc-avatar cc-bg">
      <div className="cc-avatar-head">
        <div className="cc-avatar-kai">🪙</div>
        <h1 className="cc-avatar-title">pick your fighter</h1>
        <p className="cc-avatar-sub">
          {picked ? KAI_REACT[picked] : `who are you in the money game, ${userName.split(' ')[0]}?`}
        </p>
      </div>

      <div className="cc-avatar-grid">
        {AVATARS.map((a, i) => {
          const active = picked === a.id;
          return (
            <button key={a.id}
              className={`cc-avatar-card ${active ? 'cc-avatar-active' : ''}`}
              onClick={() => choose(a.id)}
              onMouseEnter={() => sfx.click()}
              style={{
                animationDelay: `${i * 0.05}s`,
                borderColor: active ? a.color : 'var(--border)',
                boxShadow: active ? `4px 4px 0 ${a.color}, 0 0 30px ${a.glow}` : 'none',
                background: active ? `${a.color}12` : 'var(--card)',
              }}>
              <div className="cc-avatar-emoji" style={{ filter: active ? `drop-shadow(0 0 12px ${a.glow})` : 'none' }}>
                {a.emoji}
              </div>
              <div className="cc-avatar-name" style={{ color: active ? a.color : 'var(--text)' }}>{a.name}</div>
              <div className="cc-avatar-vibe">{a.vibe}</div>
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary cc-avatar-confirm" onClick={confirm} disabled={!picked}
        style={{ opacity: picked ? 1 : 0.35 }}>
        lock it in 🔒
      </button>
    </div>
  );
}
