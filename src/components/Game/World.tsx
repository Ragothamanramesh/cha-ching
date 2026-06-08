import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCurrentLevel, getNextLevel, getXPProgress } from '@/utils/levelEngine';
import { formatCurrency, BADGES, RARITY_COLOR, RARITY_GLOW } from '@/utils/gamification';
import { calculateTimeline, formatDate } from '@/utils/timeline';
import { getAvatar } from '@/utils/avatars';
import type { Level } from '@/types/gamification';
import * as sfx from '@/utils/sound';
import { setVoiceEnabled } from '@/utils/voice';
import { KaiChatDrawer, KaiBubble } from './KaiCoach';
import { CoinBurst, useCountUp } from './effects';

/* ── confetti ──────────────────────────────────────────────────────────────── */
async function boom(color: string) {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 }, zIndex: 9999, colors: [color, '#fff', color + '99'] });
    setTimeout(() => confetti({ particleCount: 80, spread: 130, origin: { y: 0.4 }, zIndex: 9999, colors: [color, '#ffd700'] }), 350);
  } catch { /**/ }
}

type Panel = null | 'bag' | 'stats' | 'menu' | 'kai';

export function World() {
  const {
    profile, avatarId, userGoal, generatedLevels,
    showLevelUp, levelUpTo, newBadgeIds,
    recordLogin, dismissLevelUp, dismissNewBadges,
  } = useGameStore();

  const [panel, setPanel] = useState<Panel>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [burstIntensity, setBurstIntensity] = useState(1);
  const [climbed, setClimbed] = useState(false);
  const avatar = getAvatar(avatarId);
  const prevValue = useRef(profile.portfolioValue);

  useEffect(() => { recordLogin(); /* eslint-disable-next-line */ }, []);

  // Bag-growth juice: coin burst + cash-count sound scaled to the gain
  useEffect(() => {
    const prev = prevValue.current;
    const now = profile.portfolioValue;
    if (now > prev) {
      const gainRatio = prev > 0 ? (now - prev) / prev : 1;
      const intensity = Math.max(0.3, Math.min(1, gainRatio * 2 + 0.3));
      setBurstIntensity(intensity);
      setBurstKey(k => k + 1);
      sfx.cashCount(intensity);
    } else if (now < prev && prev > 0) {
      sfx.drop();
    }
    prevValue.current = now;
  }, [profile.portfolioValue]);

  // Animated count-up value
  const displayValue = useCountUp(profile.portfolioValue);

  // Level-up celebration + avatar climb animation
  useEffect(() => {
    if (showLevelUp) {
      const lvl = generatedLevels.find(l => l.level === levelUpTo);
      sfx.levelUp();
      if (lvl) boom(lvl.color);
      setClimbed(true);
      const t = setTimeout(() => setClimbed(false), 1200);
      return () => clearTimeout(t);
    }
  }, [showLevelUp, levelUpTo, generatedLevels]);

  // Badge sound
  useEffect(() => { if (newBadgeIds.length) sfx.badge(); }, [newBadgeIds]);

  if (!generatedLevels.length || !userGoal) return null;

  const cur  = getCurrentLevel(profile.portfolioValue, generatedLevels);
  const next = getNextLevel(profile.portfolioValue, generatedLevels);
  const pct  = getXPProgress(profile.portfolioValue, generatedLevels);
  const lvlUp = generatedLevels.find(l => l.level === levelUpTo) ?? generatedLevels[0];

  return (
    <div className="cc-world cc-bg" style={{ ['--era-color' as string]: cur.color, ['--era-glow' as string]: cur.glowColor }}>
      {/* Ambient era glow */}
      <div className="cc-world-aura" style={{ background: `radial-gradient(ellipse at 50% 30%, ${cur.glowColor}, transparent 60%)` }} />

      {/* ── TOP HUD: portfolio + era + vibe bar ── */}
      <div className="cc-hud-top">
        <div className="cc-hud-era" style={{ color: cur.color }}>{cur.emoji} {cur.name}</div>
        <div className="cc-hud-value" style={{ color: cur.color, textShadow: `0 0 20px ${cur.glowColor}` }}>
          {profile.portfolioValue > 0 ? formatCurrency(displayValue) : 'tap 💰 to start'}
        </div>
        <CoinBurst fireKey={burstKey} intensity={burstIntensity} />
        <div className="cc-hud-bar">
          <div className="cc-hud-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cur.color}99, ${cur.color})`, boxShadow: `0 0 12px ${cur.glowColor}` }}>
            <div className="cc-shimmer-bar" />
          </div>
        </div>
        <div className="cc-hud-next">
          {next ? `${formatCurrency(next.minValue - profile.portfolioValue)} → ${next.name}` : '👑 final era reached'}
        </div>
      </div>

      {/* ── THE CLIMB ── */}
      <EraClimb levels={generatedLevels} value={profile.portfolioValue} avatarEmoji={avatar.emoji} avatarColor={avatar.color} climbed={climbed} />

      {/* ── CORNER HUD BUTTONS ── */}
      <CornerBtn pos="tl" emoji="🔥" label={`${profile.loginStreak}d`} active={panel === 'stats'}
        onClick={() => { sfx.click(); setPanel(p => p === 'stats' ? null : 'stats'); }} accent="var(--pink)" />
      <CornerBtn pos="tr" emoji="⚙️" label="menu" active={panel === 'menu'}
        onClick={() => { sfx.click(); setPanel(p => p === 'menu' ? null : 'menu'); }} accent="var(--blue)" />
      <CornerBtn pos="bl" emoji="💬" label="Kai" active={panel === 'kai'} pulse
        onClick={() => { sfx.click(); setPanel('kai'); }} accent="#a78bfa" />
      <CornerBtn pos="br" emoji="💰" label="bag" active={panel === 'bag'}
        onClick={() => { sfx.coin(); setPanel(p => p === 'bag' ? null : 'bag'); }} accent="var(--lime)" />

      {/* Floating Kai bubble (daily line) */}
      <KaiBubble onOpenChat={() => setPanel('kai')} />

      {/* ── PANELS ── */}
      {panel === 'bag'   && <BagPanel onClose={() => setPanel(null)} />}
      {panel === 'stats' && <StatsPanel onClose={() => setPanel(null)} />}
      {panel === 'menu'  && <MenuPanel onClose={() => setPanel(null)} />}
      <KaiChatDrawer open={panel === 'kai'} onClose={() => setPanel(null)} />

      {/* ── TOASTS ── */}
      {showLevelUp && <EraToast level={lvlUp} avatar={avatar.emoji} onClose={dismissLevelUp} />}
      {newBadgeIds.length > 0 && !showLevelUp && <BadgeToast ids={newBadgeIds} onClose={dismissNewBadges} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   THE CLIMB — vertical era path with avatar
   ════════════════════════════════════════════════════════════════════════════ */
function EraClimb({ levels, value, avatarEmoji, avatarColor, climbed }: { levels: Level[]; value: number; avatarEmoji: string; avatarColor: string; climbed?: boolean }) {
  const cur = getCurrentLevel(value, levels);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector('[data-cur="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [cur.level]);

  // Render top (final) → bottom (start) so climbing feels like going UP
  const ordered = [...levels].reverse();

  return (
    <div className="cc-climb" ref={ref}>
      <div className="cc-climb-inner">
        {ordered.map((lvl) => {
          const isCur  = lvl.level === cur.level;
          const done   = value >= lvl.minValue && lvl.level < cur.level;
          const locked = value < lvl.minValue;
          return (
            <div key={lvl.level} data-cur={String(isCur)} className="cc-climb-node-wrap">
              {/* connector */}
              <div className="cc-climb-line" style={{ background: done || isCur ? lvl.color + '66' : 'var(--border)' }} />

              <div className={`cc-climb-node ${isCur ? 'cc-climb-cur' : ''}`}
                style={{
                  borderColor: isCur ? lvl.color : done ? lvl.color + '66' : 'var(--border)',
                  background: isCur ? `${lvl.color}18` : done ? `${lvl.color}0c` : 'var(--card)',
                  boxShadow: isCur ? `0 0 30px ${lvl.glowColor}, 4px 4px 0 ${lvl.color}` : 'none',
                  opacity: locked ? 0.4 : 1,
                }}>
                <span className="cc-climb-emoji" style={{ filter: isCur ? `drop-shadow(0 0 10px ${lvl.glowColor})` : 'none' }}>
                  {locked ? '🔒' : lvl.emoji}
                </span>
                <div className="cc-climb-text">
                  <div className="cc-climb-name" style={{ color: isCur ? lvl.color : 'var(--text)' }}>
                    {lvl.name} {done && <span className="cc-climb-check">✓</span>}
                  </div>
                  <div className="cc-climb-tag">{locked ? `unlock at ${formatCurrency(lvl.minValue)}` : lvl.tagline}</div>
                </div>
                <div className="cc-climb-era">era {lvl.level}</div>

                {/* Avatar stands on the current node — leaps up on era-up */}
                {isCur && (
                  <div className={`cc-climb-avatar ${climbed ? 'cc-climb-leap' : 'cc-float'}`} style={{ filter: `drop-shadow(0 0 14px ${avatarColor})` }}>
                    {avatarEmoji}
                    <div className="cc-climb-you">you</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="cc-climb-base">🏁 the journey starts here</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CORNER BUTTON
   ════════════════════════════════════════════════════════════════════════════ */
function CornerBtn({ pos, emoji, label, onClick, active, accent, pulse }: {
  pos: 'tl' | 'tr' | 'bl' | 'br'; emoji: string; label: string; onClick: () => void; active?: boolean; accent: string; pulse?: boolean;
}) {
  return (
    <button className={`cc-corner cc-corner-${pos} ${active ? 'cc-corner-on' : ''} ${pulse ? 'cc-corner-pulse' : ''}`}
      onClick={onClick}
      style={{ borderColor: active ? accent : 'var(--border)', boxShadow: active ? `0 0 24px ${accent}, 3px 3px 0 ${accent}` : undefined }}>
      <span className="cc-corner-emoji">{emoji}</span>
      <span className="cc-corner-label" style={{ color: active ? accent : 'var(--muted)' }}>{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PANELS (slide in from edges)
   ════════════════════════════════════════════════════════════════════════════ */
function PanelShell({ children, onClose, side, title, accent }: {
  children: React.ReactNode; onClose: () => void; side: 'left' | 'right'; title: string; accent: string;
}) {
  return (
    <div className="cc-panel-backdrop" onClick={onClose}>
      <div className={`cc-panel cc-panel-${side}`} onClick={e => e.stopPropagation()} style={{ borderColor: accent + '44' }}>
        <div className="cc-panel-head">
          <span className="cc-panel-title" style={{ color: accent }}>{title}</span>
          <button className="cc-panel-x" onClick={onClose}>×</button>
        </div>
        <div className="cc-panel-body cc-scroll">{children}</div>
      </div>
    </div>
  );
}

function BagPanel({ onClose }: { onClose: () => void }) {
  const { profile, userGoal, generatedLevels, setPortfolioValue } = useGameStore();
  const [raw, setRaw] = useState(profile.portfolioValue > 0 ? String(profile.portfolioValue) : '');
  const cur = getCurrentLevel(profile.portfolioValue, generatedLevels);

  const submit = () => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!isNaN(n) && n >= 0) { setPortfolioValue(n); onClose(); } // World effect handles growth/drop sound + burst
  };
  const quick = userGoal
    ? [0, userGoal.targetAmount * 0.01, userGoal.targetAmount * 0.05, userGoal.targetAmount * 0.25, userGoal.targetAmount * 0.5, userGoal.targetAmount]
        .map(v => Math.round(v / 100) * 100).filter((v, i, a) => a.indexOf(v) === i)
    : [0, 100, 1000, 10000];

  return (
    <PanelShell onClose={onClose} side="right" title="💰 your bag" accent="var(--lime)">
      <p className="cc-panel-p">what's your portfolio at right now? be honest — Kai can smell a lie.</p>
      <div className="cc-bag-input">
        <span style={{ color: 'var(--lime)', fontSize: 28, fontWeight: 800 }}>$</span>
        <input autoFocus value={raw} placeholder="0" inputMode="decimal"
          onChange={e => setRaw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>
      <button className="btn btn-primary cc-bag-set" onClick={submit}>update bag 🪙</button>
      <div className="cc-bag-quicklabel">quick set</div>
      <div className="cc-chip-row">
        {quick.map(d => (
          <button key={d} className="cc-chip" onClick={() => { setPortfolioValue(d); onClose(); }}
            style={{ background: profile.portfolioValue === d ? cur.color + '20' : 'var(--card)',
              color: profile.portfolioValue === d ? cur.color : 'var(--muted)',
              border: `2px solid ${profile.portfolioValue === d ? cur.color : 'var(--border)'}` }}>
            {formatCurrency(d)}
          </button>
        ))}
      </div>
      <p className="cc-panel-foot">broker auto-sync coming soon. for now, manual flexing only.</p>
    </PanelShell>
  );
}

function StatsPanel({ onClose }: { onClose: () => void }) {
  const { profile } = useGameStore();
  const nextBadge = [3, 7, 14, 30, 60, 100].find(m => m > profile.loginStreak) ?? 100;
  const pct = Math.min(100, (profile.loginStreak / nextBadge) * 100);
  const heat = Array.from({ length: 21 }, (_, i) => i < profile.loginStreak).reverse();

  return (
    <PanelShell onClose={onClose} side="left" title="🔥 discipline" accent="var(--pink)">
      <div className="cc-stat-row">
        <Stat icon={profile.loginStreak >= 7 ? '🔥' : '⚡'} val={profile.loginStreak} label="day streak" hot />
        <Stat icon="🏅" val={profile.bestLoginStreak} label="best" />
        <Stat icon="📱" val={profile.sessionCount} label="sessions" />
      </div>
      <div className="cc-stat-progress">
        <div className="cc-stat-progress-label">
          <span>next badge: {nextBadge}-day streak</span>
          <span style={{ color: 'var(--pink)' }}>{nextBadge - profile.loginStreak}d left</span>
        </div>
        <div className="cc-stat-bar">
          <div className="cc-stat-bar-fill" style={{ width: `${pct}%` }}><div className="cc-shimmer-bar" /></div>
        </div>
      </div>
      <div className="cc-stat-heatlabel">last 21 days</div>
      <div className="cc-stat-heat">
        {heat.map((on, i) => <div key={i} className="cc-stat-cell" style={{ background: on ? 'var(--pink)' : 'rgba(255,255,255,0.05)', boxShadow: on ? '0 0 6px var(--pink-glow)' : 'none' }} />)}
      </div>
      <p className="cc-panel-foot">show up daily. the streak is the whole game. miss a day and Kai will know.</p>
    </PanelShell>
  );
}

function Stat({ icon, val, label, hot }: { icon: string; val: number; label: string; hot?: boolean }) {
  return (
    <div className="cc-stat-card" style={{ borderColor: hot && val > 0 ? 'var(--pink)' : 'var(--border)', boxShadow: hot && val > 0 ? '2px 2px 0 var(--pink)' : 'none' }}>
      <div className="cc-stat-icon">{icon}</div>
      <div className="cc-stat-val" style={{ color: hot ? 'var(--pink)' : 'var(--text)' }}>{val}</div>
      <div className="cc-stat-label">{label}</div>
    </div>
  );
}

function MenuPanel({ onClose }: { onClose: () => void }) {
  const { profile, userGoal, generatedLevels, theme, toggleTheme, soundOn, setSoundOn, voiceOn, setVoiceOn, resetAll } = useGameStore();
  const earned = new Set(profile.earnedBadges.map(b => b.badgeId));
  const tl = userGoal ? calculateTimeline(profile.portfolioValue, generatedLevels,
    { targetAmount: userGoal.targetAmount, timelineYears: userGoal.timelineYears }, 0.03, userGoal.monthlyContribution) : null;
  const paceColor = tl?.paceStatus === 'ahead' ? 'var(--lime)' : tl?.paceStatus === 'behind' ? 'var(--pink)' : '#ffd700';

  const toggleSound = () => { const v = !soundOn; setSoundOn(v); sfx.setMuted(!v); if (v) sfx.coin(); };
  const toggleVoice = () => { const v = !voiceOn; setVoiceOn(v); setVoiceEnabled(v); };

  return (
    <PanelShell onClose={onClose} side="right" title="⚙️ menu" accent="var(--blue)">
      {/* Badges */}
      <div className="cc-menu-section">achievements · {earned.size}/{BADGES.length}</div>
      <div className="cc-badge-grid">
        {BADGES.map(b => {
          const yes = earned.has(b.id);
          return (
            <div key={b.id} title={`${b.name} — ${b.requirement}`} className="cc-badge-cell"
              style={{ background: yes ? `${RARITY_COLOR[b.rarity]}12` : 'var(--card-sm)',
                border: `2px solid ${yes ? RARITY_COLOR[b.rarity] + '66' : 'var(--border)'}`,
                boxShadow: yes ? `2px 2px 0 ${RARITY_COLOR[b.rarity]}` : 'none',
                filter: yes ? 'none' : 'grayscale(1) brightness(0.45)', opacity: yes ? 1 : 0.5 }}>
              <div className="cc-badge-emoji">{b.emoji}</div>
              <div className="cc-badge-name" style={{ color: yes ? RARITY_COLOR[b.rarity] : 'var(--dim)' }}>{b.name}</div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {tl && userGoal && (
        <>
          <div className="cc-menu-section">timeline · <span style={{ color: paceColor }}>{tl.paceStatus.replace('_', ' ')}</span></div>
          <div className="cc-timeline">
            {tl.levelDates.map(ld => {
              const got = ld.estimatedDate === null;
              const lvl = generatedLevels.find(l => l.level === ld.level);
              return (
                <div key={ld.level} className="cc-tl-row">
                  <span className="cc-tl-dot" style={{ background: got ? 'var(--lime)' : 'var(--inset)' }}>{got ? '✓' : ld.level}</span>
                  <span className="cc-tl-name" style={{ color: got ? 'var(--lime)' : 'var(--muted)' }}>{lvl?.name}</span>
                  <span className="cc-tl-date">{got ? 'done' : formatDate(ld.estimatedDate)}</span>
                </div>
              );
            })}
            <div className="cc-tl-row cc-tl-goal">
              <span className="cc-tl-dot" style={{ background: 'var(--gold-dim)' }}>🏆</span>
              <span className="cc-tl-name" style={{ color: 'var(--text)', fontWeight: 700 }}>{userGoal.title}</span>
              <span className="cc-tl-date" style={{ color: 'var(--gold)' }}>{formatDate(tl.goalDate)}</span>
            </div>
          </div>
        </>
      )}

      {/* Settings */}
      <div className="cc-menu-section">settings</div>
      <div className="cc-toggle-row">
        <Toggle label="🔊 sound effects" on={soundOn} onClick={toggleSound} />
        <Toggle label="🗣️ Kai's voice" on={voiceOn} onClick={toggleVoice} />
        <Toggle label={theme === 'dark' ? '🌙 dark mode' : '☀️ light mode'} on={theme === 'dark'} onClick={() => { sfx.click(); toggleTheme(); }} />
      </div>

      <button className="cc-menu-reset" onClick={() => { if (confirm('Reset everything and start a new game?')) { resetAll(); } }}>
        ↺ reset game
      </button>
    </PanelShell>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className="cc-toggle" onClick={onClick}>
      <span>{label}</span>
      <span className="cc-toggle-switch" style={{ background: on ? 'var(--lime)' : 'var(--inset)' }}>
        <span className="cc-toggle-knob" style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)', background: on ? '#060606' : 'var(--muted)' }} />
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOASTS
   ════════════════════════════════════════════════════════════════════════════ */
function EraToast({ level, avatar, onClose }: { level: Level; avatar: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="cc-eratoast-backdrop" onClick={onClose}>
      <div className="cc-eratoast cc-pop-in" style={{ borderColor: level.color, boxShadow: `0 0 60px ${level.glowColor}, 6px 6px 0 ${level.color}` }}>
        <div className="cc-eratoast-label" style={{ color: level.color }}>✦ NEW ERA UNLOCKED ✦</div>
        <div className="cc-eratoast-emoji cc-float">{level.emoji}</div>
        <div className="cc-eratoast-name">{level.name}</div>
        <div className="cc-eratoast-tag" style={{ color: level.color + 'dd' }}>{level.tagline}</div>
        <div className="cc-eratoast-avatar">{avatar} leveled up</div>
        <button className="btn btn-primary cc-eratoast-btn" onClick={onClose}>let's go →</button>
      </div>
    </div>
  );
}

function BadgeToast({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const badges = ids.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  return (
    <div className="cc-badgetoast-wrap">
      {badges.map(b => b && (
        <div key={b.id} className="cc-badgetoast cc-badge-in" style={{ borderColor: RARITY_COLOR[b.rarity], boxShadow: `2px 2px 0 ${RARITY_COLOR[b.rarity]}, 0 0 20px ${RARITY_GLOW[b.rarity]}` }}>
          <span className="cc-badgetoast-emoji">{b.emoji}</span>
          <div>
            <div className="cc-badgetoast-label" style={{ color: RARITY_COLOR[b.rarity] }}>badge unlocked</div>
            <div className="cc-badgetoast-name">{b.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
