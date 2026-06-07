import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCurrentLevel, getXPProgress } from '@/utils/levelEngine';
import { calculateTimeline, daysToNextLevel } from '@/utils/timeline';
import { getAvatar } from '@/utils/avatars';
import type { CoachContext, KaiTrigger, KaiChatMessage } from '@/types/gamification';
import * as sfx from '@/utils/sound';
import { speak, stopVoice } from '@/utils/voice';

/* ── Build context from store ─────────────────────────────────────────────────── */
function buildContext(trigger: KaiTrigger, userMessage?: string, history?: KaiChatMessage[]): CoachContext | null {
  const { profile, userName, avatarId, userGoal, generatedLevels, kaiChat } = useGameStore.getState();
  if (!userGoal || !generatedLevels.length) return null;

  const cur  = getCurrentLevel(profile.portfolioValue, generatedLevels);
  const next = generatedLevels.find(l => l.level === cur.level + 1);
  const pct  = getXPProgress(profile.portfolioValue, generatedLevels);
  const avatar = getAvatar(avatarId);

  const prevVal = profile.previousPortfolioValue || profile.portfolioValue;
  const changePct = prevVal > 0 ? ((profile.portfolioValue - prevVal) / prevVal) * 100 : 0;
  const monthlyRate = 0.03;

  const tl = calculateTimeline(profile.portfolioValue, generatedLevels,
    { targetAmount: userGoal.targetAmount, timelineYears: userGoal.timelineYears }, monthlyRate, userGoal.monthlyContribution);

  const today = new Date().toISOString().split('T')[0];
  const daysSinceUpdate = profile.lastValueUpdateDate
    ? Math.floor((new Date(today).getTime() - new Date(profile.lastValueUpdateDate).getTime()) / 86_400_000) : 99;

  return {
    name: userName,
    avatarName: avatar.name,
    avatarVibe: avatar.vibe,
    goalTitle: userGoal.title,
    goalDescription: userGoal.description,
    targetAmount: userGoal.targetAmount,
    timelineYears: userGoal.timelineYears,
    portfolioValue: profile.portfolioValue,
    currentLevel: cur.level,
    totalLevels: generatedLevels.length,
    currentLevelName: cur.name,
    nextLevelName: next?.name ?? null,
    progressPercent: pct,
    amountToNextLevel: next ? Math.max(0, next.minValue - profile.portfolioValue) : 0,
    loginStreak: profile.loginStreak,
    bestStreak: profile.bestLoginStreak,
    portfolioChangePct: changePct,
    daysSinceLastUpdate: daysSinceUpdate,
    paceStatus: tl.paceStatus,
    daysAheadOrBehind: tl.daysAheadOrBehind,
    daysToNextLevel: daysToNextLevel(profile.portfolioValue, generatedLevels, monthlyRate, userGoal.monthlyContribution),
    trigger,
    userMessage,
    history: trigger === 'chat' ? (history ?? kaiChat) : undefined,
  };
}

async function fetchKaiMessage(ctx: CoachContext): Promise<string> {
  const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ctx) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  if (!data.message) throw new Error(data.error ?? 'No message');
  return data.message as string;
}

const FALLBACKS = [
  "add ur GEMINI_API_KEY in Vercel env vars and i'll actually start talking. until then i'm just a vibe.",
  "kai's brain is offline — drop GEMINI_API_KEY into vercel to wake me up.",
];

function detectTrigger(): KaiTrigger {
  const { profile, generatedLevels } = useGameStore.getState();
  if (!generatedLevels.length) return 'daily';
  const cur = getCurrentLevel(profile.portfolioValue, generatedLevels);
  const pct = getXPProgress(profile.portfolioValue, generatedLevels);
  if (pct >= 90 && cur.level < generatedLevels.length) return 'near_level';
  if (profile.loginStreak === 7 || profile.loginStreak === 30) return 'streak_milestone';
  if (profile.previousPortfolioValue > profile.portfolioValue) return 'portfolio_drop';
  return 'daily';
}

/* ════════════════════════════════════════════════════════════════════════════
   KAI BUBBLE — floating daily line near the Kai corner button
   ════════════════════════════════════════════════════════════════════════════ */
export function KaiBubble({ onOpenChat }: { onOpenChat: () => void }) {
  const { kaiDaily, setKaiDaily, setKaiLoading, kaiLoading, userGoal } = useGameStore();
  const [dismissed, setDismissed] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const needsRefresh = !kaiDaily || kaiDaily.date !== today;
  const spoke = useRef(false);

  useEffect(() => {
    if (!needsRefresh || !userGoal) return;
    const trigger = detectTrigger();
    const ctx = buildContext(trigger);
    if (!ctx) return;
    setKaiLoading(true);
    fetchKaiMessage(ctx)
      .then(msg => setKaiDaily({ text: msg, date: today, trigger }))
      .catch(() => setKaiDaily({ text: FALLBACKS[0], date: today, trigger: 'daily' }))
      .finally(() => setKaiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // Speak the daily line once it's loaded
  useEffect(() => {
    if (kaiDaily?.text && !spoke.current && kaiDaily.date === today) {
      spoke.current = true;
      sfx.message();
      const t = setTimeout(() => speak(kaiDaily.text, { rate: 1.06 }), 400);
      return () => clearTimeout(t);
    }
  }, [kaiDaily, today]);

  if (dismissed || (!kaiDaily && !kaiLoading)) return null;

  return (
    <div className="cc-kaibubble cc-slide-up">
      <div className="cc-kaibubble-orb cc-kai-talk" onClick={onOpenChat}>◕‿◕</div>
      <div className="cc-kaibubble-msg" onClick={onOpenChat}>
        {kaiLoading ? <span className="cc-kaibubble-dots"><i /><i /><i /></span> : kaiDaily?.text}
      </div>
      <button className="cc-kaibubble-x" onClick={() => { stopVoice(); setDismissed(true); }}>×</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   KAI CHAT DRAWER
   ════════════════════════════════════════════════════════════════════════════ */
export function KaiChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { kaiChat, addKaiChat, kaiLoading, setKaiLoading, userName, userGoal, avatarId } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const avatar = getAvatar(avatarId);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [kaiChat, open]);
  useEffect(() => { if (!open) stopVoice(); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || kaiLoading) return;
    setInput('');
    sfx.click();
    const userMsg: KaiChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    addKaiChat(userMsg);
    const history = [...kaiChat, userMsg];
    const ctx = buildContext('chat', text, history);
    if (!ctx) { addKaiChat({ role: 'assistant', content: 'set up your goal first.', timestamp: new Date().toISOString() }); return; }

    setKaiLoading(true);
    try {
      const reply = await fetchKaiMessage({ ...ctx, history: history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })) });
      addKaiChat({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
      sfx.message();
      speak(reply, { rate: 1.06 });
    } catch {
      addKaiChat({ role: 'assistant', content: FALLBACKS[1], timestamp: new Date().toISOString() });
    } finally {
      setKaiLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="cc-chat-backdrop" onClick={onClose}>
      <div className="cc-chat" onClick={e => e.stopPropagation()}>
        <div className="cc-chat-head">
          <div className="cc-chat-orb cc-kai-talk">◕‿◕</div>
          <div className="cc-chat-headtext">
            <div className="cc-chat-name">Kai</div>
            <div className="cc-chat-role">{userGoal ? `coaching ${avatar.emoji} ${userName} → ${userGoal.emoji} ${userGoal.title}` : 'your coach'}</div>
          </div>
          <button className="cc-chat-x" onClick={onClose}>×</button>
        </div>

        <div className="cc-chat-msgs cc-scroll">
          {kaiChat.length === 0 && (
            <div className="cc-chat-empty">
              <div className="cc-chat-empty-orb">◕‿◕</div>
              <p>ask me anything. i'm brutally honest and occasionally helpful.</p>
              <p className="cc-chat-empty-hints">"am i on track?" · "roast my pace" · "what do i do today?"</p>
            </div>
          )}
          {kaiChat.map((m, i) => (
            <div key={i} className={`cc-chat-bubble ${m.role === 'user' ? 'cc-chat-user' : 'cc-chat-kai'}`}>{m.content}</div>
          ))}
          {kaiLoading && <div className="cc-chat-bubble cc-chat-kai"><span className="cc-kaibubble-dots"><i /><i /><i /></span></div>}
          <div ref={bottomRef} />
        </div>

        <div className="cc-chat-input">
          <input autoFocus value={input} placeholder="talk to Kai..." onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn btn-primary" onClick={send} disabled={!input.trim() || kaiLoading}>send</button>
        </div>
      </div>
    </div>
  );
}
