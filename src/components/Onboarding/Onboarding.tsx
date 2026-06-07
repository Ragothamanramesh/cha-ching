import { useState, useEffect } from 'react';
import type { GoalType, UserGoal } from '@/types/gamification';
import { useGameStore } from '@/store/useGameStore';
import { generateLevels } from '@/utils/levelEngine';
import { formatCurrency, GOAL_META } from '@/utils/gamification';

const GOALS: { type: GoalType; emoji: string; label: string; sub: string }[] = [
  { type: 'home',       emoji: '🏡', label: 'Buy a Home',       sub: 'down payment grind' },
  { type: 'car',        emoji: '🚗', label: 'Dream Car',         sub: 'pull up in it' },
  { type: 'retirement', emoji: '🌴', label: 'Retire Early',      sub: 'escape the rat race' },
  { type: 'debt',       emoji: '✂️', label: 'Kill My Debt',      sub: 'financial freedom' },
  { type: 'travel',     emoji: '✈️', label: 'Travel the World',  sub: 'catch flights' },
  { type: 'business',   emoji: '💼', label: 'Start a Business',  sub: 'build the empire' },
  { type: 'custom',     emoji: '🎯', label: 'My Own Goal',       sub: 'u define it' },
];

const AMOUNTS: Record<GoalType, number[]> = {
  home:       [50000, 100000, 200000, 400000],
  car:        [10000, 25000, 50000, 100000],
  retirement: [100000, 250000, 500000, 1000000],
  debt:       [5000, 15000, 30000, 60000],
  travel:     [3000, 8000, 15000, 30000],
  business:   [10000, 25000, 50000, 100000],
  custom:     [5000, 25000, 100000, 500000],
};

const TIMELINES = [1, 2, 5, 10];
const CONTRIBUTIONS = [100, 250, 500, 1000];

/* ── Step 1: Name + Goal ─────────────────────────────────────────────────────── */
function StepGoal({ onNext }: { onNext: (name: string, type: GoalType) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalType | null>(null);
  const { toggleTheme, theme } = useGameStore();

  return (
    <div className="cc-onboard-step flex flex-col gap-6">
      <div>
        <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--lime)' }}>
          cha-ching 🪙
        </div>
        <h1 className="text-4xl font-black text-white leading-tight">
          what's ur<br />money goal?
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
          we'll build ur custom era ladder 👇
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--muted)' }}>
          ur name
        </label>
        <input
          className="w-full px-4 py-3 rounded-2xl text-white font-semibold text-base outline-none"
          style={{ background: 'var(--card)', border: '2px solid var(--border)', fontFamily: 'Space Grotesk, sans-serif' }}
          placeholder="enter ur name..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onFocus={e => (e.target.style.borderColor = 'var(--lime)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Goal grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map(g => {
          const active = goal === g.type;
          return (
            <button key={g.type} onClick={() => setGoal(g.type)}
              className="rounded-2xl p-3.5 text-left transition-all duration-150"
              style={{
                background: active ? 'rgba(200,255,0,0.08)' : 'var(--card)',
                border: active ? '2px solid var(--lime)' : '2px solid var(--border)',
                boxShadow: active ? '3px 3px 0 var(--lime)' : 'none',
                transform: active ? 'translate(-1px,-1px)' : 'none',
              }}>
              <div className="text-2xl mb-1">{g.emoji}</div>
              <div className="font-bold text-[13px] text-white">{g.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: active ? 'var(--lime)' : 'var(--muted)' }}>
                {g.sub}
              </div>
            </button>
          );
        })}
      </div>

      <button
        className="btn btn-primary w-full py-4 text-base font-black"
        disabled={!name.trim() || !goal}
        style={{ opacity: (!name.trim() || !goal) ? 0.4 : 1 }}
        onClick={() => name.trim() && goal && onNext(name.trim(), goal)}
      >
        lock in 🔒
      </button>

      <button onClick={toggleTheme} className="absolute top-4 right-4 btn btn-ghost text-base px-2.5 py-1.5">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

/* ── Step 2: Numbers ─────────────────────────────────────────────────────────── */
function StepNumbers({
  name, goalType, onNext, onBack,
}: { name: string; goalType: GoalType; onNext: (a: { targetAmount: number; timelineYears: number; monthlyContribution: number }) => void; onBack: () => void }) {
  const meta = GOAL_META[goalType];
  const amounts = AMOUNTS[goalType];
  const [amount, setAmount] = useState(amounts[1]);
  const [years, setYears] = useState(5);
  const [monthly, setMonthly] = useState(250);

  return (
    <div className="cc-onboard-step flex flex-col gap-5">
      <div>
        <button onClick={onBack} className="text-[11px] font-semibold mb-4 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
          ← back
        </button>
        <div className="text-2xl mb-2">{meta.emoji}</div>
        <h2 className="text-3xl font-black text-white leading-tight">
          let's get<br />specific, {name.split(' ')[0]}.
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>few taps and ur done 🪄</p>
      </div>

      {/* Target amount */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          target amount
        </div>
        <div className="flex flex-wrap gap-2">
          {amounts.map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className="btn text-[12px] px-4 py-2"
              style={{
                background: amount === a ? 'var(--lime)' : 'var(--card)',
                color: amount === a ? '#060606' : 'var(--muted)',
                border: `2px solid ${amount === a ? 'var(--lime)' : 'var(--border)'}`,
                boxShadow: amount === a ? '2px 2px 0 var(--lime)' : 'none',
                borderRadius: 12,
              }}>
              {formatCurrency(a)}
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-black" style={{ color: 'var(--lime)' }}>{formatCurrency(amount)}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>target</span>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          timeline
        </div>
        <div className="flex gap-2">
          {TIMELINES.map(y => (
            <button key={y} onClick={() => setYears(y)}
              className="flex-1 btn text-[12px] py-2.5"
              style={{
                background: years === y ? 'var(--lime)' : 'var(--card)',
                color: years === y ? '#060606' : 'var(--muted)',
                border: `2px solid ${years === y ? 'var(--lime)' : 'var(--border)'}`,
                boxShadow: years === y ? '2px 2px 0 var(--lime)' : 'none',
                borderRadius: 12,
              }}>
              {y}yr{y !== 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          monthly contribution
        </div>
        <div className="flex gap-2 flex-wrap">
          {CONTRIBUTIONS.map(c => (
            <button key={c} onClick={() => setMonthly(c)}
              className="btn text-[12px] px-4 py-2"
              style={{
                background: monthly === c ? 'var(--lime)' : 'var(--card)',
                color: monthly === c ? '#060606' : 'var(--muted)',
                border: `2px solid ${monthly === c ? 'var(--lime)' : 'var(--border)'}`,
                boxShadow: monthly === c ? '2px 2px 0 var(--lime)' : 'none',
                borderRadius: 12,
              }}>
              ${c}/mo
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary w-full py-4 text-base font-black"
        onClick={() => onNext({ targetAmount: amount, timelineYears: years, monthlyContribution: monthly })}>
        build my eras 🏗️
      </button>
    </div>
  );
}

/* ── Step 3: Era Reveal ──────────────────────────────────────────────────────── */
function StepReveal({
  name, goal, levels, onStart,
}: { name: string; goal: UserGoal; levels: ReturnType<typeof generateLevels>; onStart: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= levels.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 250);
    return () => clearTimeout(t);
  }, [shown, levels.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="cc-onboard-step">
        <div className="text-2xl mb-1">{goal.emoji}</div>
        <h2 className="text-3xl font-black text-white leading-tight">
          ur custom eras<br />are ready, {name.split(' ')[0]} 🔥
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
          {formatCurrency(goal.targetAmount)} in {goal.timelineYears}yr{goal.timelineYears !== 1 ? 's' : ''} · ${goal.monthlyContribution}/mo
        </p>
      </div>

      {/* Era ladder */}
      <div className="flex flex-col gap-2">
        {levels.map((lvl, i) => (
          <div key={lvl.level}
            className={i < shown ? 'cc-era-reveal' : ''}
            style={{ opacity: i < shown ? 1 : 0, animationDelay: `${i * 0.05}s` }}>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{
                background: i < shown ? `${lvl.color}10` : 'var(--card)',
                border: `2px solid ${i < shown ? lvl.color + '44' : 'var(--border)'}`,
                boxShadow: i < shown && i === levels.length - 1 ? `3px 3px 0 ${lvl.color}` : 'none',
                transition: 'all 0.3s',
              }}>
              <span className="text-xl w-7 text-center">{lvl.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-white truncate">{lvl.name}</div>
                <div className="text-[10px] truncate" style={{ color: lvl.color + 'bb' }}>{lvl.tagline}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-bold" style={{ color: lvl.color }}>
                  {formatCurrency(lvl.minValue)}
                </div>
                <div className="text-[9px]" style={{ color: 'var(--muted)' }}>era {lvl.level}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {shown >= levels.length && (
        <button className="btn btn-primary w-full py-4 text-base font-black cc-slide-up mt-2" onClick={onStart}>
          start era 1 →
        </button>
      )}
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────────────── */
export function Onboarding() {
  const [step, setStep] = useState<'goal' | 'numbers' | 'reveal'>('goal');
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('home');
  const [answers, setAnswers] = useState<{ targetAmount: number; timelineYears: number; monthlyContribution: number } | null>(null);
  const { completeOnboarding } = useGameStore();
  const meta = GOAL_META[goalType];

  const goal: UserGoal | null = answers ? {
    type: goalType, title: meta.label, description: `${meta.label} — ${formatCurrency(answers.targetAmount)} goal`,
    targetAmount: answers.targetAmount, timelineYears: answers.timelineYears,
    monthlyContribution: answers.monthlyContribution, emoji: meta.emoji,
  } : null;

  const levels = goal ? generateLevels(goal) : [];

  return (
    <div className="cc-bg min-h-screen flex items-center justify-center px-5 py-10">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl"
          style={{ background: 'rgba(200,255,0,0.04)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(255,45,120,0.04)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {step === 'goal' && (
          <StepGoal onNext={(n, t) => { setName(n); setGoalType(t); setStep('numbers'); }} />
        )}
        {step === 'numbers' && (
          <StepNumbers name={name} goalType={goalType}
            onNext={a => { setAnswers(a); setStep('reveal'); }}
            onBack={() => setStep('goal')}
          />
        )}
        {step === 'reveal' && goal && (
          <StepReveal name={name} goal={goal} levels={levels}
            onStart={() => completeOnboarding(name, goal)}
          />
        )}
      </div>
    </div>
  );
}
