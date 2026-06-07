import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCurrentLevel, getXPProgress } from '@/utils/levelEngine';
import { calculateTimeline, daysToNextLevel } from '@/utils/timeline';
import type { CoachContext, KaiTrigger, KaiChatMessage } from '@/types/gamification';

// ── Build context object from store state ──────────────────────────────────────
function buildContext(trigger: KaiTrigger, userMessage?: string, history?: KaiChatMessage[]): CoachContext | null {
  const { profile, userName, userGoal, generatedLevels, kaiChat } = useGameStore.getState();
  if (!userGoal || !generatedLevels.length) return null;

  const cur  = getCurrentLevel(profile.portfolioValue, generatedLevels);
  const next = generatedLevels.find(l => l.level === cur.level + 1);
  const pct  = getXPProgress(profile.portfolioValue, generatedLevels);

  // Very rough monthly growth estimate from portfolio change
  const prevVal = profile.previousPortfolioValue || profile.portfolioValue;
  const changePct = prevVal > 0 ? ((profile.portfolioValue - prevVal) / prevVal) * 100 : 0;
  const monthlyRate = 0.03; // default 3%; replace with real data when Robinhood connected

  const tl = calculateTimeline(
    profile.portfolioValue,
    generatedLevels,
    { targetAmount: userGoal.targetAmount, timelineYears: userGoal.timelineYears },
    monthlyRate,
    userGoal.monthlyContribution,
  );

  const today = new Date().toISOString().split('T')[0];
  const daysSinceUpdate = profile.lastValueUpdateDate
    ? Math.floor((new Date(today).getTime() - new Date(profile.lastValueUpdateDate).getTime()) / 86_400_000)
    : 99;

  const dtNL = daysToNextLevel(profile.portfolioValue, generatedLevels, monthlyRate, userGoal.monthlyContribution);

  return {
    name:             userName,
    goalTitle:        userGoal.title,
    goalDescription:  userGoal.description,
    targetAmount:     userGoal.targetAmount,
    timelineYears:    userGoal.timelineYears,
    portfolioValue:   profile.portfolioValue,
    currentLevel:     cur.level,
    totalLevels:      generatedLevels.length,
    currentLevelName: cur.name,
    nextLevelName:    next?.name ?? null,
    progressPercent:  pct,
    amountToNextLevel: next ? Math.max(0, next.minValue - profile.portfolioValue) : 0,
    loginStreak:      profile.loginStreak,
    bestStreak:       profile.bestLoginStreak,
    portfolioChangePct: changePct,
    daysSinceLastUpdate: daysSinceUpdate,
    paceStatus:       tl.paceStatus,
    daysAheadOrBehind: tl.daysAheadOrBehind,
    daysToNextLevel:  dtNL,
    trigger,
    userMessage,
    history: trigger === 'chat' ? (history ?? kaiChat) : undefined,
  };
}

// ── API call ───────────────────────────────────────────────────────────────────
async function fetchKaiMessage(ctx: CoachContext): Promise<string> {
  const res = await fetch('/api/coach', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(ctx),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  if (!data.message) throw new Error(data.error ?? 'No message');
  return data.message as string;
}

// ── Fallback messages when API is unavailable ──────────────────────────────────
const FALLBACKS = [
  "Connect your ANTHROPIC_API_KEY in Vercel to enable personalized coaching.",
  "Kai is offline — add ANTHROPIC_API_KEY to your Vercel environment to activate.",
];

// ── Determine today's trigger ──────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// Kai Daily Card
// ═══════════════════════════════════════════════════════════════════════════════
export function KaiCard({ onOpenChat }: { onOpenChat: () => void }) {
  const { kaiDaily, setKaiDaily, setKaiLoading, kaiLoading, profile, userGoal } = useGameStore();
  const today = new Date().toISOString().split('T')[0];
  const needsRefresh = !kaiDaily || kaiDaily.date !== today;

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

  const pulse = profile.loginStreak >= 3;

  return (
    <div className="card p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, #8b5cf6, transparent)' }} />

      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              boxShadow: pulse ? '0 0 16px rgba(139,92,246,0.5)' : 'none' }}>
            K
          </div>
          {pulse && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 6px #30d158' }} />
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-white">Kai</span>
            <span className="text-[9px] text-gray-700 uppercase tracking-widest">your coach</span>
          </div>

          {kaiLoading ? (
            <div className="flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  style={{ animation: `cc-glow-pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-gray-300 leading-relaxed">
              {kaiDaily?.text ?? '…'}
            </p>
          )}
        </div>

        {/* Chat button */}
        <button
          onClick={onOpenChat}
          className="flex-shrink-0 btn btn-ghost text-[10px] px-2.5 py-1.5"
        >
          Chat →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Kai Chat Drawer
// ═══════════════════════════════════════════════════════════════════════════════
export function KaiChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { kaiChat, addKaiChat, kaiLoading, setKaiLoading, userName, userGoal } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kaiChat, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || kaiLoading) return;
    setInput('');

    const userMsg: KaiChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    addKaiChat(userMsg);

    // Build context with conversation history
    const history: KaiChatMessage[] = [...kaiChat, userMsg];
    const ctx = buildContext('chat', text, history);
    if (!ctx) { addKaiChat({ role: 'assistant', content: 'Set up your goal first.', timestamp: new Date().toISOString() }); return; }

    setKaiLoading(true);
    try {
      const reply = await fetchKaiMessage({
        ...ctx,
        history: history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
      });
      addKaiChat({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    } catch {
      addKaiChat({ role: 'assistant', content: FALLBACKS[1], timestamp: new Date().toISOString() });
    } finally {
      setKaiLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-xl mx-auto rounded-t-2xl flex flex-col"
        style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', height: '75vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>K</div>
            <div>
              <div className="text-[13px] font-bold text-white">Kai</div>
              <div className="text-[9px] text-gray-600">
                {userGoal ? `Coaching ${userName} toward ${userGoal.emoji} ${userGoal.title}` : 'Personal trading coach'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 cc-scroll">
          {kaiChat.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-[13px] text-gray-500">Ask Kai anything about your journey.</p>
              <p className="text-[11px] text-gray-700 mt-1">
                Try: "Am I on track?" · "How much do I need per month?" · "What happens if I stop contributing?"
              </p>
            </div>
          )}

          {kaiChat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                style={msg.role === 'user'
                  ? { background: '#30d15820', border: '1px solid #30d15833', color: '#d1fae5' }
                  : { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#e9d5ff' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {kaiLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    style={{ animation: `cc-glow-pulse 1s ease ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2 items-center">
            <input
              autoFocus={open}
              className="flex-1 inset px-4 py-2.5 text-sm text-white bg-transparent outline-none rounded-xl"
              placeholder="Ask Kai anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              onClick={send}
              disabled={!input.trim() || kaiLoading}
              className="btn btn-primary px-4 py-2.5 disabled:opacity-30"
            >
              Send
            </button>
          </div>
          <p className="text-[9px] text-gray-700 text-center mt-2">
            Kai uses your real portfolio data · Never gives financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
