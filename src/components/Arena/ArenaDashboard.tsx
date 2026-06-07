import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { KaiCard, KaiChatDrawer } from './KaiCoach';
import { BADGES, formatCurrency, RARITY_COLOR, RARITY_GLOW, TIER_LABEL } from '@/utils/gamification';
import { getCurrentLevel, getNextLevel, getXPProgress } from '@/utils/levelEngine';
import { calculateTimeline, formatDate } from '@/utils/timeline';
import type { Level } from '@/types/gamification';

/* ── confetti ─────────────────────────────────────────────────────────── */
async function boom() {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, zIndex: 9999,
      colors: ['#fbbf24','#f59e0b','#30d158','#8b5cf6','#3b82f6'] });
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, zIndex: 9999 }), 320);
  } catch { /* no-op */ }
}

/* ── LevelUp Toast ────────────────────────────────────────────────────── */
function LevelUpToast({ level, onClose }: { level: Level; onClose: () => void }) {
  useEffect(() => { boom(); const t = setTimeout(onClose, 5500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 left-1/2 z-50 cc-level-up" style={{ minWidth: 320, transform: 'translateX(-50%)' }}>
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border"
        style={{ background:'rgba(13,15,24,0.97)', borderColor: level.color,
          boxShadow:`0 0 40px ${level.glowColor}, 0 8px 32px rgba(0,0,0,0.7)` }}>
        <span className="text-5xl cc-float">{level.emoji}</span>
        <div className="flex-1">
          <div className="text-[9px] tracking-[0.2em] font-bold uppercase mb-0.5" style={{ color: level.color }}>
            ✦ LEVEL UP ✦
          </div>
          <div className="text-lg font-bold text-white font-display">{level.name}</div>
          <div className="text-xs" style={{ color: level.color + 'cc' }}>{level.tagline}</div>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xl ml-2">×</button>
      </div>
    </div>
  );
}

/* ── Badge Toast ──────────────────────────────────────────────────────── */
function BadgeToast({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const badges = ids.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {badges.map(b => b && (
        <div key={b.id} className="cc-badge-in flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background:'rgba(13,15,24,0.96)', borderColor: RARITY_COLOR[b.rarity],
            boxShadow:`0 0 20px ${RARITY_GLOW[b.rarity]}` }}>
          <span className="text-2xl">{b.emoji}</span>
          <div>
            <div className="text-[9px] tracking-widest uppercase font-bold" style={{ color: RARITY_COLOR[b.rarity] }}>
              Badge · {b.rarity}
            </div>
            <div className="text-sm font-semibold text-white">{b.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── XP Bar ───────────────────────────────────────────────────────────── */
function XPBar({ value, levels }: { value: number; levels: Level[] }) {
  const cur  = getCurrentLevel(value, levels);
  const next = getNextLevel(value, levels);
  const pct  = getXPProgress(value, levels);
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px]" style={{ color: cur.color + 'bb' }}>{TIER_LABEL[cur.tier]} Tier</span>
        <span className="text-[11px] font-bold" style={{ color: cur.color }}>{pct.toFixed(1)}%</span>
        <span className="text-[10px] text-gray-600">{next ? `→ ${next.name}` : 'FINAL LEVEL'}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden relative"
        style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${cur.color}88, ${cur.color})`,
            boxShadow:`0 0 14px ${cur.glowColor}` }}>
          <div className="absolute inset-0 cc-shimmer-bar" />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-700">{formatCurrency(cur.minValue)}</span>
        <span className="text-[9px] text-gray-700">{next ? formatCurrency(next.minValue) : '🏆'}</span>
      </div>
    </div>
  );
}

/* ── Level Hero ───────────────────────────────────────────────────────── */
function LevelHero({ value, levels }: { value: number; levels: Level[] }) {
  const cur  = getCurrentLevel(value, levels);
  const next = getNextLevel(value, levels);
  return (
    <div className="card p-6 relative overflow-hidden"
      style={{ boxShadow:`0 0 60px ${cur.glowColor}33` }}>
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-15"
        style={{ background: cur.color }} />
      <div className="relative flex items-start gap-5">
        <div className="w-20 h-20 flex items-center justify-center rounded-2xl text-5xl flex-shrink-0 cc-float"
          style={{ background:`${cur.color}18`, border:`1px solid ${cur.color}44`,
            boxShadow:`0 0 24px ${cur.glowColor}` }}>
          {cur.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full border"
              style={{ color: cur.color, background:`${cur.color}15`, borderColor:`${cur.color}55` }}>
              {TIER_LABEL[cur.tier]} · Level {cur.level}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">{cur.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: cur.color + 'cc' }}>{cur.tagline}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Portfolio</div>
          <div className="cc-count-up font-display text-3xl font-bold" style={{ color: cur.color }}>
            {formatCurrency(value)}
          </div>
          {next && (
            <div className="text-[11px] text-gray-600 mt-1">
              {formatCurrency(next.minValue - value)}<br />to "{next.name}"
            </div>
          )}
        </div>
      </div>
      <XPBar value={value} levels={levels} />
    </div>
  );
}

/* ── Product Ladder ───────────────────────────────────────────────────── */
function ProductLadder({ value, levels }: { value: number; levels: Level[] }) {
  const cur = getCurrentLevel(value, levels);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
  }, [cur.level]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Your Roadmap</span>
        <span className="text-[11px]" style={{ color: cur.color }}>{cur.level} / {levels.length}</span>
      </div>
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-1 cc-scroll">
        {levels.map(lvl => {
          const done   = value > lvl.maxValue;
          const active = lvl.level === cur.level;
          const locked = value < lvl.minValue;
          return (
            <div key={lvl.level} data-active={String(active)}
              className="flex-shrink-0 w-[72px] rounded-xl p-2 text-center relative"
              style={{ background: active ? `${lvl.color}18` : 'rgba(255,255,255,0.02)',
                border: active ? `1px solid ${lvl.color}66` : '1px solid rgba(255,255,255,0.04)',
                boxShadow: active ? `0 0 16px ${lvl.glowColor}` : 'none',
                opacity: locked ? 0.35 : 1, transition: 'all 0.3s' }}>
              <div className="text-2xl mb-1 relative leading-none">{lvl.emoji}
                {done && !active && <span className="absolute -top-1 -right-1 text-[10px] text-green-400">✓</span>}
              </div>
              <div className="text-[8px] font-bold leading-tight" style={{ color: active ? lvl.color : '#4b5563' }}>Lv{lvl.level}</div>
              <div className="text-[8px] leading-tight mt-0.5 truncate" style={{ color: active ? '#d1d5db' : '#374151' }}>
                {lvl.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Timeline Card ────────────────────────────────────────────────────── */
function TimelineCard({ value, levels }: { value: number; levels: Level[] }) {
  const { userGoal } = useGameStore();
  if (!userGoal) return null;

  const tl = calculateTimeline(value, levels,
    { targetAmount: userGoal.targetAmount, timelineYears: userGoal.timelineYears },
    0.03, userGoal.monthlyContribution);

  const paceColor = tl.paceStatus === 'ahead' ? '#30d158' : tl.paceStatus === 'behind' ? '#ff453a' : '#fbbf24';
  const paceLabel = tl.paceStatus === 'ahead'
    ? `${tl.daysAheadOrBehind}d ahead of schedule`
    : tl.paceStatus === 'behind'
    ? `${tl.daysAheadOrBehind}d behind — adjust contributions to catch up`
    : 'Right on track';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Timeline</span>
        <span className="text-[10px] font-semibold" style={{ color: paceColor }}>{paceLabel}</span>
      </div>

      <div className="flex flex-col gap-2">
        {tl.levelDates.map(ld => {
          const achieved = ld.estimatedDate === null;
          const isNext = !achieved && value < ld.targetAmount &&
            !tl.levelDates.find(x => !x.estimatedDate && x.level > ld.level);
          return (
            <div key={ld.level} className="flex items-center gap-3 py-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]"
                style={{ background: achieved ? '#30d15833' : isNext ? '#fbbf2422' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${achieved ? '#30d15866' : isNext ? '#fbbf2466' : 'rgba(255,255,255,0.08)'}` }}>
                {achieved ? '✓' : ld.level}
              </div>
              <span className="text-[12px] flex-1" style={{ color: achieved ? '#30d158' : isNext ? '#fbbf24' : '#6b7280' }}>
                {levels.find(l => l.level === ld.level)?.name ?? `Level ${ld.level}`}
              </span>
              <span className="text-[10px]" style={{ color: achieved ? '#30d158' : '#4b5563' }}>
                {achieved ? 'Achieved ✓' : formatDate(ld.estimatedDate)}
              </span>
            </div>
          );
        })}

        <div className="flex items-center gap-3 py-1.5 mt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)' }}>
            🏆
          </div>
          <span className="text-[12px] flex-1 font-semibold text-white">{userGoal.title}</span>
          <span className="text-[10px]" style={{ color: '#fbbf24' }}>{formatDate(tl.goalDate)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Badge Grid ───────────────────────────────────────────────────────── */
function BadgeGrid({ earnedIds }: { earnedIds: string[] }) {
  const earned = new Set(earnedIds);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Achievements</span>
        <span className="text-[11px] font-bold" style={{ color:'#fbbf24' }}>{earned.size}/{BADGES.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map(badge => {
          const yes = earned.has(badge.id);
          return (
            <div key={badge.id} title={`${badge.name} — ${badge.requirement}`}
              className="rounded-xl p-2.5 text-center relative cursor-default"
              style={{ background: yes ? `${RARITY_COLOR[badge.rarity]}14` : 'rgba(255,255,255,0.02)',
                border: yes ? `1px solid ${RARITY_COLOR[badge.rarity]}44` : '1px solid rgba(255,255,255,0.04)',
                boxShadow: yes ? `0 0 12px ${RARITY_GLOW[badge.rarity]}` : 'none',
                filter: yes ? 'none' : 'grayscale(1)', opacity: yes ? 1 : 0.38 }}>
              <div className="text-xl mb-1">{badge.emoji}</div>
              <div className="text-[8px] font-bold leading-tight truncate"
                style={{ color: yes ? RARITY_COLOR[badge.rarity] : '#374151' }}>
                {badge.name}
              </div>
              {!yes && <div className="absolute top-1 right-1 text-[9px] text-gray-700">🔒</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Streak Panel ─────────────────────────────────────────────────────── */
function StreakPanel({ loginStreak, bestStreak, sessionCount }:
  { loginStreak: number; bestStreak: number; sessionCount: number }) {
  const next = [3,7,14,30,60,100].find(m => m > loginStreak) ?? 100;
  const pct  = Math.min(100, (loginStreak / next) * 100);
  const heat = Array.from({ length: 14 }, (_, i) => i < loginStreak).reverse();

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-3">Discipline</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { icon: loginStreak >= 7 ? '🔥' : '⚡', val: loginStreak, label: 'streak', glow: loginStreak >= 3 ? '0 0 20px rgba(249,115,22,0.4)' : 'none' },
          { icon: '🏅', val: bestStreak, label: 'best', glow: 'none' },
          { icon: '📊', val: sessionCount, label: 'sessions', glow: 'none' },
        ].map((s, i) => (
          <div key={i} className="card-sm p-3 text-center" style={{ boxShadow: s.glow }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-xl font-bold text-white">{s.val}</div>
            <div className="text-[9px] text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="inset px-3 py-2 mb-3">
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-gray-600">Next badge: {next}d streak</span>
          <span style={{ color:'#f97316' }}>{next - loginStreak}d to go</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(0,0,0,0.4)' }}>
          <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ width:`${pct}%`, background:'linear-gradient(90deg, #f97316aa, #f97316)',
              boxShadow:'0 0 8px rgba(249,115,22,0.6)' }}>
            <div className="absolute inset-0 cc-shimmer-bar" />
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {heat.map((active, i) => (
          <div key={i} className="flex-1 h-4 rounded-sm"
            style={{ background: active ? 'linear-gradient(135deg,#f97316,#fb923c)' : 'rgba(255,255,255,0.04)',
              boxShadow: active ? '0 0 6px rgba(249,115,22,0.5)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Portfolio Input ──────────────────────────────────────────────────── */
function PortfolioInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { userGoal, generatedLevels } = useGameStore();
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const cur = getCurrentLevel(value, generatedLevels);

  const submit = () => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditing(false);
  };

  const quickVals = userGoal
    ? [0, userGoal.targetAmount * 0.01, userGoal.targetAmount * 0.05, userGoal.targetAmount * 0.25, userGoal.targetAmount * 0.5, userGoal.targetAmount]
      .map(v => Math.round(v / 100) * 100)
      .filter((v, i, a) => a.indexOf(v) === i)
    : [0, 100, 1000, 5000, 25000, 100000];

  return (
    <div className="card p-5">
      <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Update Portfolio</div>
      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: cur.color }}>$</span>
          <input autoFocus className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
            value={raw} placeholder="0.00"
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            onBlur={submit} />
          <button className="btn btn-primary" onClick={submit}>Set</button>
        </div>
      ) : (
        <button className="w-full text-left" onClick={() => { setEditing(true); setRaw(value > 0 ? String(value) : ''); }}>
          <div className="font-display text-3xl font-bold" style={{ color: cur.color }}>
            {value > 0 ? formatCurrency(value) : <span className="text-gray-600">Tap to enter…</span>}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">Click to update · or connect a broker</div>
        </button>
      )}
      <div className="mt-4">
        <div className="text-[9px] text-gray-700 mb-2 uppercase tracking-widest">Quick set</div>
        <div className="flex flex-wrap gap-1.5">
          {quickVals.map(d => (
            <button key={d} onClick={() => onChange(d)}
              className="btn btn-ghost text-[10px] px-2.5 py-1"
              style={{ borderColor: value === d ? cur.color + '66' : undefined, color: value === d ? cur.color : undefined }}>
              {formatCurrency(d)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN ARENA
   ══════════════════════════════════════════════════════════════════════ */
export function ArenaDashboard() {
  const {
    profile, userName, userGoal, generatedLevels,
    showLevelUp, levelUpTo, newBadgeIds,
    setPortfolioValue, recordLogin, dismissLevelUp, dismissNewBadges, resetAll,
  } = useGameStore();

  const [kaiOpen, setKaiOpen] = useState(false);

  useEffect(() => { recordLogin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const lvlUpData = generatedLevels.find(l => l.level === levelUpTo) ?? generatedLevels[0];

  if (!generatedLevels.length) return null; // shouldn't happen — onboarding gate handles this

  return (
    <div className="cc-bg min-h-screen">
      {showLevelUp && lvlUpData && <LevelUpToast level={lvlUpData} onClose={dismissLevelUp} />}
      {newBadgeIds.length > 0 && !showLevelUp && <BadgeToast ids={newBadgeIds} onClose={dismissNewBadges} />}
      <KaiChatDrawer open={kaiOpen} onClose={() => setKaiOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background:'rgba(13,15,24,0.92)', backdropFilter:'blur(20px)', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl cc-spin-slow" style={{ display:'inline-block' }}>🪙</span>
            <div>
              <span className="font-display text-base font-bold text-white">Cha-Ching</span>
              {userGoal && (
                <span className="ml-2 text-[10px] text-gray-600">
                  {userGoal.emoji} {userName}'s {userGoal.title}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.loginStreak > 0 && (
              <div className="card-sm px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-sm">{profile.loginStreak >= 7 ? '🔥' : '⚡'}</span>
                <span className="text-[11px] font-bold" style={{ color:'#f97316' }}>{profile.loginStreak}d</span>
              </div>
            )}
            <button onClick={resetAll} className="btn btn-ghost text-[10px] px-2 py-1" title="Reset (dev)">↺</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Kai — always first */}
        <KaiCard onOpenChat={() => setKaiOpen(true)} />

        {/* Level hero */}
        <LevelHero value={profile.portfolioValue} levels={generatedLevels} />

        {/* Roadmap */}
        <ProductLadder value={profile.portfolioValue} levels={generatedLevels} />

        {/* Two-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <PortfolioInput value={profile.portfolioValue} onChange={setPortfolioValue} />
            <TimelineCard value={profile.portfolioValue} levels={generatedLevels} />
          </div>
          <div className="flex flex-col gap-4">
            <StreakPanel loginStreak={profile.loginStreak} bestStreak={profile.bestLoginStreak} sessionCount={profile.sessionCount} />
            <BadgeGrid earnedIds={profile.earnedBadges.map(b => b.badgeId)} />
          </div>
        </div>
      </main>
    </div>
  );
}
