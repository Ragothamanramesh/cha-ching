import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { KaiCard, KaiChatDrawer } from './KaiCoach';
import { BADGES, formatCurrency, RARITY_COLOR, RARITY_GLOW } from '@/utils/gamification';
import { getCurrentLevel, getNextLevel, getXPProgress } from '@/utils/levelEngine';
import { calculateTimeline, formatDate } from '@/utils/timeline';
import type { Level } from '@/types/gamification';

/* ── Confetti ─────────────────────────────────────────────────────────────────── */
async function boom(color: string) {
  try {
    const { default: confetti } = await import('canvas-confetti');
    const c = color;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, zIndex: 9999, colors: [c, '#fff', c + '99'] });
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, zIndex: 9999, colors: [c, '#fff'] }), 350);
  } catch { /**/ }
}

/* ── Era Up Toast ────────────────────────────────────────────────────────────── */
function EraUpToast({ level, onClose }: { level: Level; onClose: () => void }) {
  useEffect(() => { boom(level.color); const t = setTimeout(onClose, 5500); return () => clearTimeout(t); }, [level.color, onClose]);
  return (
    <div className="fixed top-4 left-1/2 z-50 cc-level-up-toast" style={{ minWidth: 300, transform: 'translateX(-50%)' }}>
      <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{ background: 'var(--card)', border: `2px solid ${level.color}`,
          boxShadow: `3px 3px 0 ${level.color}, 0 0 40px ${level.glowColor}` }}>
        <span className="text-4xl cc-float">{level.emoji}</span>
        <div className="flex-1">
          <div className="text-[9px] font-black tracking-[0.2em] uppercase mb-0.5" style={{ color: level.color }}>
            era unlocked ✦
          </div>
          <div className="text-lg font-black text-white">{level.name}</div>
          <div className="text-[11px]" style={{ color: level.color + 'cc' }}>{level.tagline}</div>
        </div>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--muted)' }}>×</button>
      </div>
    </div>
  );
}

/* ── Badge Toast ─────────────────────────────────────────────────────────────── */
function BadgeToast({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const badges = ids.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
      {badges.map(b => b && (
        <div key={b.id} className="cc-badge-in flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--card)', border: `2px solid ${RARITY_COLOR[b.rarity]}`,
            boxShadow: `2px 2px 0 ${RARITY_COLOR[b.rarity]}, 0 0 20px ${RARITY_GLOW[b.rarity]}` }}>
          <span className="text-2xl">{b.emoji}</span>
          <div>
            <div className="text-[9px] font-black tracking-widest uppercase" style={{ color: RARITY_COLOR[b.rarity] }}>
              badge unlocked
            </div>
            <div className="text-sm font-bold text-white">{b.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Era Hero ────────────────────────────────────────────────────────────────── */
function EraHero({ value, levels }: { value: number; levels: Level[] }) {
  const cur  = getCurrentLevel(value, levels);
  const next = getNextLevel(value, levels);
  const pct  = getXPProgress(value, levels);

  return (
    <div className="card p-6 relative overflow-hidden"
      style={{ border: `2px solid ${cur.color}33`, boxShadow: `0 0 40px ${cur.glowColor}22` }}>
      {/* BG glow blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-10"
        style={{ background: cur.color }} />

      <div className="relative">
        {/* Era badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="era-badge" style={{ background: cur.color, color: cur.color === '#c8ff00' ? '#060606' : '#fff' }}>
            era {cur.level}/{levels.length}
          </span>
          {next && (
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              → {next.name} in {formatCurrency(next.minValue - value)}
            </span>
          )}
        </div>

        {/* Big emoji + era name */}
        <div className="flex items-start gap-4">
          <div className="text-6xl cc-float leading-none flex-shrink-0" style={{ filter: `drop-shadow(0 0 16px ${cur.glowColor})` }}>
            {cur.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-white leading-tight truncate">{cur.name}</h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: cur.color + 'cc' }}>{cur.tagline}</p>
          </div>
          {/* Portfolio value */}
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>ur bag</div>
            <div className="text-3xl font-black cc-number-up" style={{ color: cur.color }}>
              {value > 0 ? formatCurrency(value) : '—'}
            </div>
          </div>
        </div>

        {/* Vibe bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              vibe meter
            </span>
            <span className="text-[12px] font-black" style={{ color: cur.color }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden relative"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cur.color}88, ${cur.color})`,
                boxShadow: `0 0 12px ${cur.glowColor}` }}>
              <div className="absolute inset-0 cc-shimmer-bar" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: 'var(--dim)' }}>{formatCurrency(cur.minValue)}</span>
            <span className="text-[9px]" style={{ color: 'var(--dim)' }}>
              {next ? formatCurrency(next.minValue) : '👑 final era'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Update Bag ──────────────────────────────────────────────────────────────── */
function UpdateBag({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
    ? [0, userGoal.targetAmount * 0.01, userGoal.targetAmount * 0.05,
        userGoal.targetAmount * 0.25, userGoal.targetAmount * 0.5, userGoal.targetAmount]
        .map(v => Math.round(v / 100) * 100).filter((v, i, a) => a.indexOf(v) === i)
    : [0, 100, 500, 1000, 5000, 25000];

  return (
    <div className="card p-5">
      <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
        what's ur bag at rn
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black" style={{ color: 'var(--lime)' }}>$</span>
          <input autoFocus
            className="flex-1 bg-transparent text-2xl font-black text-white outline-none"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            value={raw} placeholder="0"
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            onBlur={submit}
          />
          <button className="btn btn-primary text-sm px-5 py-2.5" onClick={submit}>set it</button>
        </div>
      ) : (
        <button className="w-full text-left group" onClick={() => { setEditing(true); setRaw(value > 0 ? String(value) : ''); }}>
          <div className="text-3xl font-black transition-colors" style={{ color: value > 0 ? cur.color : 'var(--dim)' }}>
            {value > 0 ? formatCurrency(value) : 'tap to update ur bag'}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
            update anytime · connect broker coming soon
          </div>
        </button>
      )}

      {/* Quick set chips */}
      <div className="mt-4">
        <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--dim)' }}>quick set</div>
        <div className="flex flex-wrap gap-1.5">
          {quickVals.map(d => (
            <button key={d} onClick={() => onChange(d)}
              className="btn btn-ghost text-[10px] px-3 py-1.5"
              style={{
                borderColor: value === d ? cur.color + '88' : undefined,
                color: value === d ? cur.color : undefined,
                background: value === d ? `${cur.color}10` : undefined,
                borderRadius: 10,
              }}>
              {formatCurrency(d)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Era Roadmap ─────────────────────────────────────────────────────────────── */
function EraRoadmap({ value, levels }: { value: number; levels: Level[] }) {
  const cur = getCurrentLevel(value, levels);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [cur.level]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>ur roadmap</span>
        <span className="text-[10px] font-bold" style={{ color: cur.color }}>era {cur.level} of {levels.length}</span>
      </div>
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-1 cc-scroll">
        {levels.map(lvl => {
          const done = value >= lvl.minValue && lvl.level < cur.level;
          const active = lvl.level === cur.level;
          const locked = value < lvl.minValue;
          return (
            <div key={lvl.level} data-active={String(active)}
              className="flex-shrink-0 w-[80px] rounded-2xl p-3 text-center"
              style={{
                background: active ? `${lvl.color}15` : 'var(--card-sm)',
                border: active ? `2px solid ${lvl.color}88` : `2px solid var(--border)`,
                boxShadow: active ? `2px 2px 0 ${lvl.color}` : 'none',
                opacity: locked && !active ? 0.3 : 1,
                transform: active ? 'translate(-1px,-1px)' : 'none',
                transition: 'all 0.3s',
              }}>
              <div className="text-2xl leading-none mb-1.5 relative">
                {lvl.emoji}
                {done && <span className="absolute -top-1 -right-1 text-[9px]">✓</span>}
              </div>
              <div className="text-[9px] font-bold leading-tight" style={{ color: active ? lvl.color : 'var(--muted)' }}>
                era {lvl.level}
              </div>
              <div className="text-[8px] mt-0.5 leading-tight" style={{ color: active ? 'var(--text)' : 'var(--dim)' }}>
                {lvl.name.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── The Grind (Streak) ──────────────────────────────────────────────────────── */
function TheGrind({ loginStreak, bestStreak, sessionCount }: { loginStreak: number; bestStreak: number; sessionCount: number }) {
  const next = [3, 7, 14, 30, 60, 100].find(m => m > loginStreak) ?? 100;
  const pct = Math.min(100, (loginStreak / next) * 100);
  const heat = Array.from({ length: 14 }, (_, i) => i < loginStreak).reverse();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>the grind 🔥</span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{next - loginStreak}d to next badge</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: loginStreak >= 7 ? '🔥' : '⚡', val: loginStreak, label: 'day streak', highlight: true },
          { icon: '🏅', val: bestStreak, label: 'personal best', highlight: false },
          { icon: '📱', val: sessionCount, label: 'sessions', highlight: false },
        ].map((s, i) => (
          <div key={i} className="card-sm p-3 text-center"
            style={{ border: s.highlight && s.val > 0 ? '2px solid var(--pink)' : undefined,
              boxShadow: s.highlight && s.val > 0 ? '2px 2px 0 var(--pink)' : undefined }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-black" style={{ color: s.highlight ? 'var(--pink)' : 'var(--text)' }}>{s.val}</div>
            <div className="text-[8px] leading-tight" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress to next badge */}
      <div className="inset px-3 py-2 mb-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="h-full rounded-full relative overflow-hidden transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--pink), #ff6da0)',
              boxShadow: '0 0 10px var(--pink-glow)' }}>
            <div className="absolute inset-0 cc-shimmer-bar" />
          </div>
        </div>
      </div>

      {/* Heat map */}
      <div className="flex gap-1">
        {heat.map((active, i) => (
          <div key={i} className="flex-1 h-3 rounded"
            style={{ background: active ? 'var(--pink)' : 'rgba(255,255,255,0.04)',
              boxShadow: active ? '0 0 6px var(--pink-glow)' : 'none' }} />
        ))}
      </div>
      <div className="text-[9px] mt-1.5 text-center" style={{ color: 'var(--dim)' }}>last 14 days</div>
    </div>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────────────── */
function EraTimeline({ value, levels }: { value: number; levels: Level[] }) {
  const { userGoal } = useGameStore();
  if (!userGoal) return null;

  const tl = calculateTimeline(value, levels,
    { targetAmount: userGoal.targetAmount, timelineYears: userGoal.timelineYears },
    0.03, userGoal.monthlyContribution);

  const paceColor = tl.paceStatus === 'ahead' ? 'var(--lime)' : tl.paceStatus === 'behind' ? 'var(--pink)' : '#ffd700';
  const paceText = tl.paceStatus === 'ahead' ? `${tl.daysAheadOrBehind}d ahead 🔥` :
    tl.paceStatus === 'behind' ? `${tl.daysAheadOrBehind}d behind 😅` : 'on track ✓';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>era timeline</span>
        <span className="text-[10px] font-bold" style={{ color: paceColor }}>{paceText}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {tl.levelDates.map(ld => {
          const achieved = ld.estimatedDate === null;
          const lvl = levels.find(l => l.level === ld.level);
          return (
            <div key={ld.level} className="flex items-center gap-3 py-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0"
                style={{ background: achieved ? 'rgba(200,255,0,0.15)' : 'var(--inset)',
                  border: `1.5px solid ${achieved ? 'var(--lime)' : 'var(--border)'}` }}>
                {achieved ? '✓' : ld.level}
              </div>
              <span className="text-[12px] flex-1" style={{ color: achieved ? 'var(--lime)' : 'var(--muted)' }}>
                {lvl?.name ?? `Era ${ld.level}`}
              </span>
              <span className="text-[10px]" style={{ color: achieved ? 'var(--lime)' : 'var(--dim)' }}>
                {achieved ? 'done ✓' : formatDate(ld.estimatedDate)}
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-3 py-1 mt-1 pt-2"
          style={{ borderTop: '1.5px solid var(--border)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
            style={{ background: 'rgba(255,215,0,0.15)', border: '1.5px solid var(--gold)' }}>🏆</div>
          <span className="text-[12px] flex-1 font-bold text-white">{userGoal.title}</span>
          <span className="text-[10px]" style={{ color: 'var(--gold)' }}>{formatDate(tl.goalDate)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Badge Wall ──────────────────────────────────────────────────────────────── */
function BadgeWall({ earnedIds }: { earnedIds: string[] }) {
  const earned = new Set(earnedIds);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>achievements</span>
        <span className="text-[10px] font-bold" style={{ color: 'var(--gold)' }}>{earned.size}/{BADGES.length} unlocked</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map(badge => {
          const yes = earned.has(badge.id);
          return (
            <div key={badge.id} title={`${badge.name} — ${badge.requirement}`}
              className="rounded-2xl p-2.5 text-center cursor-default"
              style={{
                background: yes ? `${RARITY_COLOR[badge.rarity]}12` : 'var(--card-sm)',
                border: yes ? `2px solid ${RARITY_COLOR[badge.rarity]}55` : '2px solid var(--border)',
                boxShadow: yes ? `2px 2px 0 ${RARITY_COLOR[badge.rarity]}` : 'none',
                filter: yes ? 'none' : 'grayscale(1) brightness(0.4)',
                opacity: yes ? 1 : 0.5,
              }}>
              <div className="text-xl mb-1">{badge.emoji}</div>
              <div className="text-[8px] font-bold leading-tight"
                style={{ color: yes ? RARITY_COLOR[badge.rarity] : 'var(--dim)' }}>
                {badge.name}
              </div>
              {!yes && <div className="text-[8px] mt-0.5" style={{ color: 'var(--dim)' }}>🔒</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN ARENA
   ══════════════════════════════════════════════════════════════════════════════ */
export function ArenaDashboard() {
  const {
    profile, userName, userGoal, generatedLevels,
    showLevelUp, levelUpTo, newBadgeIds, theme,
    setPortfolioValue, recordLogin, dismissLevelUp, dismissNewBadges, toggleTheme, resetAll,
  } = useGameStore();

  const [kaiOpen, setKaiOpen] = useState(false);
  useEffect(() => { recordLogin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (!generatedLevels.length) return null;

  const lvlUp = generatedLevels.find(l => l.level === levelUpTo) ?? generatedLevels[0];
  const cur   = getCurrentLevel(profile.portfolioValue, generatedLevels);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="cc-bg min-h-screen">
      {showLevelUp && <EraUpToast level={lvlUp} onClose={dismissLevelUp} />}
      {newBadgeIds.length > 0 && !showLevelUp && <BadgeToast ids={newBadgeIds} onClose={dismissNewBadges} />}
      <KaiChatDrawer open={kaiOpen} onClose={() => setKaiOpen(false)} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(9,9,9,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl cc-spin-slow" style={{ display: 'inline-block' }}>🪙</span>
            <div>
              <div className="text-base font-black text-white leading-tight">cha-ching</div>
              {userGoal && (
                <div className="text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
                  {userGoal.emoji} {userName}'s {userGoal.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{today}</div>
            {profile.loginStreak > 0 && (
              <div className="card-sm px-2.5 py-1 flex items-center gap-1"
                style={{ border: '2px solid var(--pink)', boxShadow: '2px 2px 0 var(--pink)' }}>
                <span className="text-sm">{profile.loginStreak >= 7 ? '🔥' : '⚡'}</span>
                <span className="text-[11px] font-black" style={{ color: 'var(--pink)' }}>{profile.loginStreak}</span>
              </div>
            )}
            <button onClick={toggleTheme} className="btn btn-ghost text-[14px] px-2.5 py-1.5" title="toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={resetAll} className="btn btn-ghost text-[10px] px-2 py-1" title="reset">↺</button>
          </div>
        </div>
      </header>

      {/* ── Greeting ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">
              gm, {userName.split(' ')[0]} {profile.loginStreak >= 7 ? '🔥' : '👋'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {cur.name} · {cur.tagline}
            </p>
          </div>
          <button onClick={() => setKaiOpen(true)}
            className="btn text-[11px] px-4 py-2 font-bold"
            style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '2px solid var(--blue)', borderRadius: 100 }}>
            chat w/ kai 💬
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Kai daily card */}
        <KaiCard onOpenChat={() => setKaiOpen(true)} />

        {/* Era hero */}
        <EraHero value={profile.portfolioValue} levels={generatedLevels} />

        {/* Update bag */}
        <UpdateBag value={profile.portfolioValue} onChange={setPortfolioValue} />

        {/* Era roadmap */}
        <EraRoadmap value={profile.portfolioValue} levels={generatedLevels} />

        {/* 2-col: grind + timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TheGrind loginStreak={profile.loginStreak} bestStreak={profile.bestLoginStreak} sessionCount={profile.sessionCount} />
          <EraTimeline value={profile.portfolioValue} levels={generatedLevels} />
        </div>

        {/* Badge wall */}
        <BadgeWall earnedIds={profile.earnedBadges.map(b => b.badgeId)} />

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px]" style={{ color: 'var(--dim)' }}>
            cha-ching · ur money game · not financial advice obv 💸
          </p>
        </div>
      </main>
    </div>
  );
}
