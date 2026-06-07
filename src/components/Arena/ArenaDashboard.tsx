import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  LEVELS, BADGES,
  getCurrentLevel, getNextLevel, getXPProgress,
  formatCurrency, RARITY_COLOR, RARITY_GLOW, TIER_LABEL,
} from '@/utils/gamification';
import type { Level } from '@/types/gamification';

/* ── confetti helper ──────────────────────────────────────────── */
async function boom() {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, zIndex: 9999,
      colors: ['#fbbf24','#f59e0b','#30d158','#8b5cf6','#3b82f6'] });
    setTimeout(() =>
      confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, zIndex: 9999,
        colors: ['#fbbf24','#ec4899','#06b6d4'] }), 320);
  } catch { /* no-op */ }
}

/* ── Level-Up Toast ────────────────────────────────────────────── */
function LevelUpToast({ level, onClose }: { level: Level; onClose: () => void }) {
  useEffect(() => { boom(); const t = setTimeout(onClose, 5500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 left-1/2 z-50 cc-level-up pointer-events-none" style={{ minWidth: 320 }}>
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border pointer-events-auto"
        style={{ background:'rgba(13,15,24,0.97)', borderColor: level.color,
          boxShadow:`0 0 40px ${level.glowColor}, 0 0 80px ${level.glowColor}33, 0 8px 32px rgba(0,0,0,0.7)` }}>
        <span className="text-5xl cc-float">{level.emoji}</span>
        <div className="flex-1">
          <div className="text-[9px] tracking-[0.2em] font-bold uppercase mb-0.5" style={{ color: level.color }}>
            ✦ LEVEL UP ✦
          </div>
          <div className="text-lg font-bold text-white font-display">{level.productName}</div>
          <div className="text-xs" style={{ color: level.color + 'cc' }}>{level.tagline}</div>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xl ml-2">×</button>
      </div>
      {/* Pulsing rings */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none cc-glow-pulse"
        style={{ boxShadow:`0 0 24px ${level.glowColor}` }} />
    </div>
  );
}

/* ── Badge Unlock Toast ────────────────────────────────────────── */
function BadgeToast({ badgeIds, onClose }: { badgeIds: string[]; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const badges = badgeIds.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  if (!badges.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {badges.map(b => b && (
        <div key={b.id} className="cc-badge-in flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background:'rgba(13,15,24,0.96)', borderColor: RARITY_COLOR[b.rarity],
            boxShadow:`0 0 20px ${RARITY_GLOW[b.rarity]}` }}>
          <span className="text-2xl">{b.emoji}</span>
          <div>
            <div className="text-[9px] tracking-widest uppercase font-bold" style={{ color: RARITY_COLOR[b.rarity] }}>
              Badge Unlocked · {b.rarity}
            </div>
            <div className="text-sm font-semibold text-white">{b.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── XP Progress Bar ────────────────────────────────────────────── */
function XPBar({ value, level }: { value: number; level: Level }) {
  const pct = getXPProgress(value);
  const next = getNextLevel(value);
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px]" style={{ color: level.color + 'bb' }}>{TIER_LABEL[level.tier]} Tier</span>
        <span className="text-[11px] font-bold" style={{ color: level.color }}>{pct.toFixed(1)}%</span>
        <span className="text-[10px] text-gray-600">{next ? `→ ${next.productName}` : 'MAX LEVEL'}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden relative" style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${level.color}88, ${level.color})`,
            boxShadow:`0 0 14px ${level.glowColor}` }}>
          <div className="absolute inset-0 cc-shimmer-bar" />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-700">{formatCurrency(level.minValue)}</span>
        <span className="text-[9px] text-gray-700">{next ? formatCurrency(next.minValue) : '∞'}</span>
      </div>
    </div>
  );
}

/* ── Level Hero ─────────────────────────────────────────────────── */
function LevelHero({ value }: { value: number }) {
  const level = getCurrentLevel(value);
  const next  = getNextLevel(value);
  return (
    <div className="card p-6 relative overflow-hidden"
      style={{ boxShadow:`0 0 60px ${level.glowColor}33, 0 0 120px ${level.glowColor}11` }}>
      {/* Ambient glow blob */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-15"
        style={{ background: level.color }} />
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[20px] opacity-20">
        <div className="absolute left-0 right-0 h-px" style={{ background:`linear-gradient(90deg, transparent, ${level.color}, transparent)`, animation:'cc-scan-line 4s linear infinite', top:0 }} />
      </div>

      <div className="relative flex items-start gap-5">
        {/* Big emoji */}
        <div className="w-24 h-24 flex items-center justify-center rounded-2xl text-6xl flex-shrink-0 cc-float"
          style={{ background:`radial-gradient(circle, ${level.color}22, transparent)`,
            border:`1px solid ${level.color}44`,
            boxShadow:`0 0 24px ${level.glowColor}` }}>
          {level.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Tier badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full border"
              style={{ color: level.color, background:`${level.color}15`, borderColor:`${level.color}55` }}>
              {TIER_LABEL[level.tier]} · Level {level.level}
            </span>
            <span className="text-[10px] text-gray-600">{level.category}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white truncate">{level.productName}</h2>
          <p className="text-sm mt-1" style={{ color: level.color + 'cc' }}>{level.tagline}</p>
          <p className="text-[11px] text-gray-600 mt-1">Approx. retail: {level.approxPrice}</p>
        </div>

        {/* Portfolio value */}
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Portfolio</div>
          <div className="cc-count-up font-display text-3xl font-bold" style={{ color: level.color }}>
            {formatCurrency(value)}
          </div>
          {next && (
            <div className="text-[11px] text-gray-600 mt-1">
              {formatCurrency(next.minValue - value)} to<br />{next.emoji} {next.productName}
            </div>
          )}
        </div>
      </div>

      <XPBar value={value} level={level} />
    </div>
  );
}

/* ── Product Ladder ──────────────────────────────────────────────── */
function ProductLadder({ value }: { value: number }) {
  const cur = getCurrentLevel(value);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
  }, [cur.level]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Level Progression</span>
        <span className="text-[11px]" style={{ color: cur.color }}>{cur.level} / {LEVELS.length}</span>
      </div>
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-1 cc-scroll">
        {LEVELS.map(lvl => {
          const done    = value >= lvl.maxValue + 0.01;
          const active  = lvl.level === cur.level;
          const locked  = value < lvl.minValue;
          return (
            <div key={lvl.level} data-active={String(active)}
              className="flex-shrink-0 w-[72px] rounded-xl p-2 text-center transition-all duration-300 relative"
              style={{
                background: active ? `${lvl.color}18` : 'rgba(255,255,255,0.02)',
                border: active ? `1px solid ${lvl.color}66` : '1px solid rgba(255,255,255,0.04)',
                boxShadow: active ? `0 0 16px ${lvl.glowColor}` : 'none',
                opacity: locked ? 0.35 : 1,
              }}>
              <div className="text-2xl mb-1 relative leading-none">
                {lvl.emoji}
                {done && !active && (
                  <span className="absolute -top-1 -right-1 text-[10px] text-green-400">✓</span>
                )}
              </div>
              <div className="text-[8px] font-bold leading-tight" style={{ color: active ? lvl.color : '#4b5563' }}>
                Lv{lvl.level}
              </div>
              <div className="text-[8px] leading-tight mt-0.5 truncate" style={{ color: active ? '#d1d5db' : '#374151' }}>
                {lvl.productName.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Badge Grid ──────────────────────────────────────────────────── */
function BadgeGrid({ earnedIds }: { earnedIds: string[] }) {
  const earned = new Set(earnedIds);
  const count  = earned.size;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Achievements</span>
        <span className="text-[11px] font-bold" style={{ color:'#fbbf24' }}>{count}/{BADGES.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map(badge => {
          const isEarned = earned.has(badge.id);
          return (
            <div key={badge.id} title={`${badge.name} — ${badge.description} (${badge.requirement})`}
              className="rounded-xl p-2.5 text-center relative transition-all duration-300 cursor-default"
              style={{
                background: isEarned ? `${RARITY_COLOR[badge.rarity]}14` : 'rgba(255,255,255,0.02)',
                border: isEarned ? `1px solid ${RARITY_COLOR[badge.rarity]}44` : '1px solid rgba(255,255,255,0.04)',
                boxShadow: isEarned ? `0 0 12px ${RARITY_GLOW[badge.rarity]}` : 'none',
                filter: isEarned ? 'none' : 'grayscale(1)',
                opacity: isEarned ? 1 : 0.38,
              }}>
              <div className="text-xl mb-1">{badge.emoji}</div>
              <div className="text-[8px] font-bold leading-tight truncate"
                style={{ color: isEarned ? RARITY_COLOR[badge.rarity] : '#374151' }}>
                {badge.name}
              </div>
              {!isEarned && (
                <div className="absolute top-1 right-1 text-[9px] text-gray-700 opacity-60">🔒</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Streak Panel ────────────────────────────────────────────────── */
function StreakPanel({ loginStreak, bestStreak, sessionCount }:
  { loginStreak: number; bestStreak: number; sessionCount: number }) {
  const next = [3, 7, 14, 30, 60, 100].find(m => m > loginStreak) ?? 100;
  const pct  = Math.min(100, (loginStreak / next) * 100);
  const heatmap = Array.from({ length: 14 }, (_, i) => i < loginStreak).reverse();

  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-3">
        Discipline &amp; Streaks
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { icon: loginStreak >= 7 ? '🔥' : loginStreak >= 3 ? '⚡' : '✨', val: loginStreak, label: 'day streak',
            glow: loginStreak >= 3 ? '0 0 20px rgba(249,115,22,0.4)' : 'none' },
          { icon: '🏅', val: bestStreak,  label: 'best ever', glow: 'none' },
          { icon: '📊', val: sessionCount, label: 'sessions',  glow: 'none' },
        ].map((s, i) => (
          <div key={i} className="card-sm p-3 text-center" style={{ boxShadow: s.glow }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-xl font-bold text-white">{s.val}</div>
            <div className="text-[9px] text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next milestone bar */}
      <div className="inset px-3 py-2 mb-3">
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-gray-600">Next badge: {next}-day streak</span>
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

      {/* 14-day heatmap */}
      <div>
        <div className="text-[9px] text-gray-700 mb-1.5">Last 14 days</div>
        <div className="flex gap-1">
          {heatmap.map((active, i) => (
            <div key={i} className="flex-1 h-4 rounded-sm"
              style={{ background: active ? 'linear-gradient(135deg,#f97316,#fb923c)' : 'rgba(255,255,255,0.04)',
                boxShadow: active ? '0 0 6px rgba(249,115,22,0.5)' : 'none' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Robinhood Connect ────────────────────────────────────────────── */
function BrokerConnect({ connected, name }: { connected: boolean; name: string | null }) {
  const { connectBroker } = useGameStore();
  const [open, setOpen] = useState(false);
  const [user, setUser]  = useState('');

  if (connected) {
    return (
      <div className="card-sm p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-base">🔗</div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-green-400">Connected · {name}</div>
          <div className="text-[10px] text-gray-600">Auto-syncing portfolio</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow:'0 0 6px #30d158' }} />
      </div>
    );
  }

  return (
    <div className="card-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)' }}>🏦</div>
        <div>
          <div className="text-sm font-semibold text-white">Connect Broker</div>
          <div className="text-[10px] text-gray-600">Auto-sync your real portfolio</div>
        </div>
      </div>

      {/* Robinhood button */}
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn btn-primary w-full">
          + Connect Robinhood
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-gray-600">Enter your Robinhood email to link (read-only)</p>
          <input
            autoFocus
            className="inset w-full px-3 py-2 text-xs text-white bg-transparent outline-none"
            placeholder="you@email.com"
            value={user}
            onChange={e => setUser(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && user.trim() && (connectBroker('Robinhood'), setOpen(false))}
          />
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1"
              onClick={() => { if (user.trim()) { connectBroker('Robinhood'); setOpen(false); } }}>
              Connect
            </button>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <p className="text-[9px] text-gray-700 text-center">Full OAuth coming soon · demo mode until then</p>
        </div>
      )}
    </div>
  );
}

/* ── Portfolio Input ─────────────────────────────────────────────── */
function PortfolioInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw,     setRaw]     = useState('');
  const level = getCurrentLevel(value);

  const submit = () => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditing(false);
  };

  return (
    <div className="card p-5">
      <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Update Portfolio Value</div>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: level.color }}>$</span>
          <input autoFocus
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
            value={raw} placeholder="0.00"
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            onBlur={submit}
          />
          <button className="btn btn-primary" onClick={submit}>Set</button>
        </div>
      ) : (
        <button className="w-full text-left" onClick={() => { setEditing(true); setRaw(value > 0 ? String(value) : ''); }}>
          <div className="font-display text-3xl font-bold" style={{ color: level.color }}>
            {value > 0 ? formatCurrency(value) : <span className="text-gray-600">Tap to enter…</span>}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">Click to update · or connect a broker</div>
        </button>
      )}

      {/* Quick demo levels */}
      <div className="mt-4">
        <div className="text-[9px] text-gray-700 mb-2 uppercase tracking-widest">Try a level</div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label:'$0',    val:0 },
            { label:'$100',  val:100 },
            { label:'$1K',   val:1000 },
            { label:'$5K',   val:5000 },
            { label:'$25K',  val:25000 },
            { label:'$100K', val:100000 },
            { label:'$1M',   val:1000000 },
          ].map(d => (
            <button key={d.val} onClick={() => onChange(d.val)}
              className="btn btn-ghost text-[10px] px-2.5 py-1"
              style={{ borderColor: value === d.val ? getCurrentLevel(d.val).color + '66' : undefined,
                color: value === d.val ? getCurrentLevel(d.val).color : undefined }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Leaderboard Teaser ──────────────────────────────────────────── */
function LeaderboardTeaser() {
  const MOCK = [
    { rank:1, name:'TradeMaster',  emoji:'✈️', level:13, value:'$1.2M',  you:false },
    { rank:2, name:'AlphaHunter', emoji:'🏎️', level:10, value:'$180K',  you:false },
    { rank:3, name:'DeltaForce',  emoji:'🎮', level:8,  value:'$34K',   you:false },
    { rank:4, name:'You',         emoji:'🧮', level:1,  value:'$0',     you:true  },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Leaderboard</span>
        <span className="text-[9px] border rounded px-1.5 py-0.5" style={{ color:'#fbbf24', borderColor:'#fbbf2444' }}>
          COMING SOON
        </span>
      </div>
      <div className="flex flex-col gap-1 opacity-60">
        {MOCK.map(e => (
          <div key={e.rank} className="flex items-center gap-3 px-2 py-2 rounded-lg"
            style={{ background: e.you ? 'rgba(48,209,88,0.07)' : 'transparent' }}>
            <span className="text-[11px] text-gray-600 w-4 text-center">{e.rank}</span>
            <span className="text-base">{e.emoji}</span>
            <span className="flex-1 text-[11px]" style={{ color: e.you ? '#30d158' : '#6b7280' }}>{e.name}</span>
            <span className="text-[10px] text-gray-700">Lv{e.level}</span>
            <span className="text-[10px] font-mono" style={{ color: e.you ? '#30d158' : '#4b5563' }}>{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════════════════ */
export function ArenaDashboard() {
  const {
    profile, showLevelUp, levelUpTo, newBadgeIds,
    setPortfolioValue, recordLogin, dismissLevelUp, dismissNewBadges,
  } = useGameStore();

  useEffect(() => { recordLogin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const lvlUpData = LEVELS.find(l => l.level === levelUpTo) ?? LEVELS[0];

  return (
    <div className="cc-bg min-h-screen">
      {showLevelUp && <LevelUpToast level={lvlUpData} onClose={dismissLevelUp} />}
      {newBadgeIds.length > 0 && !showLevelUp && (
        <BadgeToast badgeIds={newBadgeIds} onClose={dismissNewBadges} />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background:'rgba(13,15,24,0.92)', backdropFilter:'blur(20px)', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl cc-spin-slow" style={{ display:'inline-block' }}>🪙</span>
            <div>
              <span className="font-display text-base font-bold text-white">Cha-Ching</span>
              <span className="ml-2 text-[10px] text-gray-600">Trade. Level Up. Win.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.loginStreak > 0 && (
              <div className="card-sm px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-sm">{profile.loginStreak >= 7 ? '🔥' : '⚡'}</span>
                <span className="text-[11px] font-bold" style={{ color:'#f97316' }}>
                  {profile.loginStreak}d
                </span>
              </div>
            )}
            <div className="card-sm px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-sm">🏅</span>
              <span className="text-[11px] text-gray-500">{profile.earnedBadges.length}/{BADGES.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Level hero — always on top */}
        <LevelHero value={profile.portfolioValue} />

        {/* Product ladder — horizontal scroll */}
        <ProductLadder value={profile.portfolioValue} />

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <PortfolioInput value={profile.portfolioValue} onChange={setPortfolioValue} />
            <BrokerConnect connected={profile.brokerConnected} name={profile.brokerName} />
            <LeaderboardTeaser />
          </div>
          {/* Right */}
          <div className="flex flex-col gap-4">
            <StreakPanel loginStreak={profile.loginStreak} bestStreak={profile.bestLoginStreak} sessionCount={profile.sessionCount} />
            <BadgeGrid earnedIds={profile.earnedBadges.map(b => b.badgeId)} />
          </div>
        </div>
      </main>
    </div>
  );
}
