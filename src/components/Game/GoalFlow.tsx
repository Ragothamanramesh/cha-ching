import { useState, useEffect, useRef } from 'react';
import type { GoalType, UserGoal } from '@/types/gamification';
import { useGameStore } from '@/store/useGameStore';
import { generateLevels } from '@/utils/levelEngine';
import { formatCurrency, GOAL_META } from '@/utils/gamification';
import * as sfx from '@/utils/sound';
import { speak, stopVoice } from '@/utils/voice';

const GOALS: { type: GoalType; emoji: string; label: string; sub: string }[] = [
  { type: 'home',       emoji: '🏡', label: 'Buy a Home',      sub: 'escape the landlord' },
  { type: 'car',        emoji: '🚗', label: 'Dream Car',        sub: 'pull up in it' },
  { type: 'retirement', emoji: '🌴', label: 'Retire Early',     sub: 'quit the rat race' },
  { type: 'debt',       emoji: '✂️', label: 'Kill My Debt',     sub: 'break the chains' },
  { type: 'travel',     emoji: '✈️', label: 'See the World',    sub: 'catch flights' },
  { type: 'business',   emoji: '💼', label: 'Build a Business', sub: 'be the boss' },
  { type: 'custom',     emoji: '🎯', label: 'My Own Quest',     sub: 'you define it' },
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

const KAI_GOAL: Record<GoalType, string> = {
  home:       "a house. bold. you've seen the prices, right?",
  car:        "a car. depreciates the second you blink. but i get it. vroom.",
  retirement: "retire early. the dream of every person currently at work.",
  debt:       "debt-free. nothing more punk rock than owing nobody.",
  travel:     "travel. memories over things. very enlightened of you.",
  business:   "a business. 90% fail. you'll be the 10%. probably.",
  custom:     "your own quest. mysterious. i respect the chaos.",
};

export function GoalFlow() {
  const { beginGame, setPhase, userName } = useGameStore();
  const [step, setStep] = useState<'goal' | 'numbers' | 'reveal'>('goal');
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [amount, setAmount] = useState(0);
  const [years, setYears] = useState(5);
  const [monthly, setMonthly] = useState(250);

  const meta = goalType ? GOAL_META[goalType] : null;

  const goal: UserGoal | null = goalType && meta ? {
    type: goalType, title: meta.label, description: `${meta.label} — ${formatCurrency(amount)} goal in ${years}yrs`,
    targetAmount: amount, timelineYears: years, monthlyContribution: monthly, emoji: meta.emoji,
  } : null;

  return (
    <div className="cc-goal cc-bg">
      {step === 'goal' && (
        <StepGoal
          userName={userName}
          onPick={(t) => { setGoalType(t); setAmount(AMOUNTS[t][1]); }}
          picked={goalType}
          onNext={() => { sfx.whoosh(); setStep('numbers'); }}
          onBack={() => { sfx.click(); setPhase('avatar'); }}
        />
      )}
      {step === 'numbers' && goalType && (
        <StepNumbers
          goalType={goalType} amount={amount} years={years} monthly={monthly}
          setAmount={setAmount} setYears={setYears} setMonthly={setMonthly}
          onNext={() => { sfx.whoosh(); setStep('reveal'); }}
          onBack={() => { sfx.click(); setStep('goal'); }}
        />
      )}
      {step === 'reveal' && goal && (
        <StepReveal goal={goal} userName={userName} onStart={() => { sfx.chaChing(); beginGame(goal); }} />
      )}
    </div>
  );
}

/* ── Step: goal ──────────────────────────────────────────────────────────────── */
function StepGoal({ userName, picked, onPick, onNext, onBack }: {
  userName: string; picked: GoalType | null;
  onPick: (t: GoalType) => void; onNext: () => void; onBack: () => void;
}) {
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return; greeted.current = true;
    speak("so. what are we actually chasing here?", { rate: 1.07 });
    return () => stopVoice();
  }, []);

  const pick = (t: GoalType) => {
    sfx.select(); onPick(t); stopVoice();
    speak(KAI_GOAL[t], { rate: 1.08 });
  };

  return (
    <div className="cc-goal-step cc-onboard-step">
      <button onClick={onBack} className="cc-goal-back">← back</button>
      <h1 className="cc-goal-title">what's the quest, {userName.split(' ')[0]}?</h1>
      <p className="cc-goal-sub">{picked ? KAI_GOAL[picked] : "pick what you're grinding toward"}</p>

      <div className="cc-goal-grid">
        {GOALS.map((g, i) => {
          const active = picked === g.type;
          return (
            <button key={g.type} onClick={() => pick(g.type)} onMouseEnter={() => sfx.click()}
              className={`cc-goal-card ${active ? 'cc-goal-active' : ''}`}
              style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="cc-goal-emoji">{g.emoji}</span>
              <span className="cc-goal-label">{g.label}</span>
              <span className="cc-goal-cardsub">{g.sub}</span>
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary cc-goal-next" onClick={onNext} disabled={!picked}
        style={{ opacity: picked ? 1 : 0.35 }}>
        next →
      </button>
    </div>
  );
}

/* ── Step: numbers ───────────────────────────────────────────────────────────── */
function StepNumbers({ goalType, amount, years, monthly, setAmount, setYears, setMonthly, onNext, onBack }: {
  goalType: GoalType; amount: number; years: number; monthly: number;
  setAmount: (n: number) => void; setYears: (n: number) => void; setMonthly: (n: number) => void;
  onNext: () => void; onBack: () => void;
}) {
  const amounts = AMOUNTS[goalType];
  const Chip = ({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button onClick={() => { sfx.click(); onClick(); }}
      className="cc-chip" style={{
        background: on ? 'var(--lime)' : 'var(--card)',
        color: on ? '#060606' : 'var(--muted)',
        border: `2px solid ${on ? 'var(--lime)' : 'var(--border)'}`,
        boxShadow: on ? '2px 2px 0 var(--lime)' : 'none',
      }}>{children}</button>
  );

  return (
    <div className="cc-goal-step cc-onboard-step">
      <button onClick={onBack} className="cc-goal-back">← back</button>
      <h1 className="cc-goal-title">let's talk numbers</h1>
      <p className="cc-goal-sub">be honest. i'll know if you're lying.</p>

      <div className="cc-num-block">
        <div className="cc-num-label">target amount</div>
        <div className="cc-chip-row">{amounts.map(a => <Chip key={a} on={amount === a} onClick={() => setAmount(a)}>{formatCurrency(a)}</Chip>)}</div>
        <div className="cc-num-big" style={{ color: 'var(--lime)' }}>{formatCurrency(amount)}</div>
      </div>

      <div className="cc-num-block">
        <div className="cc-num-label">timeline</div>
        <div className="cc-chip-row">{TIMELINES.map(y => <Chip key={y} on={years === y} onClick={() => setYears(y)}>{y}yr{y !== 1 ? 's' : ''}</Chip>)}</div>
      </div>

      <div className="cc-num-block">
        <div className="cc-num-label">monthly grind</div>
        <div className="cc-chip-row">{CONTRIBUTIONS.map(c => <Chip key={c} on={monthly === c} onClick={() => setMonthly(c)}>${c}/mo</Chip>)}</div>
      </div>

      <button className="btn btn-primary cc-goal-next" onClick={onNext}>build my world 🏗️</button>
    </div>
  );
}

/* ── Step: reveal ────────────────────────────────────────────────────────────── */
function StepReveal({ goal, userName, onStart }: { goal: UserGoal; userName: string; onStart: () => void }) {
  const levels = generateLevels(goal);
  const [shown, setShown] = useState(0);
  const greeted = useRef(false);

  useEffect(() => {
    if (greeted.current) return; greeted.current = true;
    speak(`alright ${userName}. here's your path. seven eras between you and ${goal.title}. let's climb.`, { rate: 1.05 });
    return () => stopVoice();
  }, [userName, goal.title]);

  useEffect(() => {
    if (shown >= levels.length) return;
    const t = setTimeout(() => { setShown(s => s + 1); sfx.coin(); }, 280);
    return () => clearTimeout(t);
  }, [shown, levels.length]);

  return (
    <div className="cc-reveal-step">
      <div className="cc-onboard-step">
        <div className="cc-reveal-emoji">{goal.emoji}</div>
        <h1 className="cc-goal-title">your path is set</h1>
        <p className="cc-goal-sub">{formatCurrency(goal.targetAmount)} · {goal.timelineYears}yrs · ${goal.monthlyContribution}/mo</p>
      </div>

      <div className="cc-reveal-ladder">
        {levels.map((lvl, i) => (
          <div key={lvl.level} className={i < shown ? 'cc-era-reveal' : ''}
            style={{ opacity: i < shown ? 1 : 0 }}>
            <div className="cc-reveal-row" style={{
              borderColor: i < shown ? lvl.color + '55' : 'var(--border)',
              background: i < shown ? `${lvl.color}10` : 'var(--card)',
              boxShadow: i < shown && i === levels.length - 1 ? `3px 3px 0 ${lvl.color}` : 'none',
            }}>
              <span className="cc-reveal-rowemoji">{lvl.emoji}</span>
              <div className="cc-reveal-rowtext">
                <div className="cc-reveal-rowname">{lvl.name}</div>
                <div className="cc-reveal-rowtag" style={{ color: lvl.color + 'cc' }}>{lvl.tagline}</div>
              </div>
              <div className="cc-reveal-rowval" style={{ color: lvl.color }}>{formatCurrency(lvl.minValue)}</div>
            </div>
          </div>
        ))}
      </div>

      {shown >= levels.length && (
        <button className="btn btn-primary cc-goal-next cc-slide-up cc-pulse-lime" onClick={onStart}>
          enter the world →
        </button>
      )}
    </div>
  );
}
