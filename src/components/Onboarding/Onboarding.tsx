import { useState, useEffect } from 'react';
import type { GoalType, UserGoal } from '@/types/gamification';
import { useGameStore } from '@/store/useGameStore';
import { generateLevels } from '@/utils/levelEngine';
import { formatCurrency } from '@/utils/gamification';
import { GOAL_META } from '@/utils/gamification';

// ─────────────────────────────────────────────────────────────
// Step 1 — Name + Goal picker
// ─────────────────────────────────────────────────────────────
function StepGoal({ onNext }: { onNext: (name: string, type: GoalType) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalType | null>(null);

  const goals: { type: GoalType; label: string; emoji: string }[] = [
    { type: 'home',       label: 'Buy a Home',       emoji: '🏠' },
    { type: 'car',        label: 'Dream Car',         emoji: '🚗' },
    { type: 'retirement', label: 'Early Retirement',  emoji: '🌴' },
    { type: 'debt',       label: 'Become Debt Free',  emoji: '✂️' },
    { type: 'travel',     label: 'Travel the World',  emoji: '✈️' },
    { type: 'business',   label: 'Start a Business',  emoji: '💼' },
    { type: 'custom',     label: 'My Own Goal',       emoji: '🎯' },
  ];

  return (
    <div className="cc-onboard-step">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4 cc-spin-slow" style={{ display:'inline-block' }}>🪙</div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome to Cha-Ching</h1>
        <p className="text-gray-500 text-sm">Turn your trading into a game you can win</p>
      </div>

      <div className="mb-6">
        <label className="text-[11px] uppercase tracking-widest text-gray-600 mb-2 block">First, what's your name?</label>
        <input
          autoFocus
          className="w-full inset px-4 py-3 text-lg font-semibold text-white bg-transparent outline-none rounded-xl"
          placeholder="Your name…"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="text-[11px] uppercase tracking-widest text-gray-600 mb-3 block">
          What are you trading toward?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {goals.map(g => (
            <button
              key={g.type}
              onClick={() => setGoal(g.type)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
              style={{
                background: goal === g.type ? `${GOAL_META[g.type].color}18` : 'rgba(255,255,255,0.04)',
                border: goal === g.type ? `1px solid ${GOAL_META[g.type].color}66` : '1px solid rgba(255,255,255,0.06)',
                boxShadow: goal === g.type ? `0 0 16px ${GOAL_META[g.type].color}22` : 'none',
              }}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-[13px] font-semibold" style={{ color: goal === g.type ? GOAL_META[g.type].color : '#9ca3af' }}>
                {g.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!name.trim() || !goal}
        onClick={() => onNext(name.trim(), goal!)}
        className="btn btn-primary w-full py-3 text-sm disabled:opacity-30"
      >
        Continue →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Goal-specific questions
// ─────────────────────────────────────────────────────────────
interface GoalAnswers {
  targetAmount: number;
  timelineYears: number;
  monthlyContribution: number;
  details: string;
}

function QuestionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="text-[11px] uppercase tracking-widest text-gray-600 mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function AmountChips({ options, value, onChange }: {
  options: { label: string; value: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: value === o.value ? '#30d15820' : 'rgba(255,255,255,0.04)',
            border: value === o.value ? '1px solid #30d15866' : '1px solid rgba(255,255,255,0.06)',
            color: value === o.value ? '#30d158' : '#6b7280',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StepDetails({ name, goalType, onNext, onBack }: {
  name: string;
  goalType: GoalType;
  onNext: (answers: GoalAnswers) => void;
  onBack: () => void;
}) {
  const meta = GOAL_META[goalType];

  const [target, setTarget]   = useState(0);
  const [years,  setYears]    = useState(0);
  const [monthly, setMonthly] = useState(200);
  const [details, setDetails] = useState('');

  // Presets per goal type
  const targetOptions: Record<GoalType, { label: string; value: number }[]> = {
    home:       [{ label:'Under $300K', value:250000 }, { label:'$300K–$500K', value:400000 }, { label:'$500K–$800K', value:650000 }, { label:'$800K+', value:1000000 }],
    car:        [{ label:'Tesla Model 3 (~$40K)', value:40000 }, { label:'BMW/Audi (~$55K)', value:55000 }, { label:'Porsche/M3 (~$80K)', value:80000 }, { label:'Exotic ($150K+)', value:150000 }],
    retirement: [{ label:'$250K', value:250000 }, { label:'$500K', value:500000 }, { label:'$1M', value:1000000 }, { label:'$2M+', value:2000000 }],
    debt:       [{ label:'Under $10K', value:8000 }, { label:'$10K–$30K', value:20000 }, { label:'$30K–$80K', value:50000 }, { label:'$80K+', value:100000 }],
    travel:     [{ label:'$5K trip', value:5000 }, { label:'$10K trip', value:10000 }, { label:'$25K adventure', value:25000 }, { label:'$50K+ nomad fund', value:50000 }],
    business:   [{ label:'$10K MVP', value:10000 }, { label:'$50K launch', value:50000 }, { label:'$150K serious', value:150000 }, { label:'$500K+ scale', value:500000 }],
    custom:     [{ label:'$5K', value:5000 }, { label:'$25K', value:25000 }, { label:'$100K', value:100000 }, { label:'$500K', value:500000 }],
  };
  const yearOptions = [
    { label: '1 year',   value: 1  },
    { label: '2 years',  value: 2  },
    { label: '5 years',  value: 5  },
    { label: '10 years', value: 10 },
  ];
  const monthlyOptions = [
    { label: '$100/mo', value: 100  },
    { label: '$300/mo', value: 300  },
    { label: '$500/mo', value: 500  },
    { label: '$1K/mo',  value: 1000 },
  ];

  const detailPlaceholders: Record<GoalType, string> = {
    home:       '3-bedroom home in Austin, TX',
    car:        'Red Tesla Model 3, fully loaded',
    retirement: 'Retire at 45, live in Costa Rica',
    debt:       'Student loans from grad school',
    travel:     '6-month backpacking through Southeast Asia',
    business:   'Coffee shop / SaaS / e-commerce…',
    custom:     'Describe your dream…',
  };

  const ready = target > 0 && years > 0;

  return (
    <div className="cc-onboard-step">
      <button onClick={onBack} className="text-gray-600 text-sm mb-6 flex items-center gap-1 hover:text-gray-400">
        ← Back
      </button>

      <div className="flex items-center gap-3 mb-7">
        <span className="text-4xl">{meta.emoji}</span>
        <div>
          <h2 className="font-display text-xl font-bold text-white">Tell me about your goal</h2>
          <p className="text-[12px] text-gray-500">{name}, I'll build your personal roadmap</p>
        </div>
      </div>

      <QuestionRow label="How much do you need?">
        <AmountChips options={targetOptions[goalType]} value={target} onChange={setTarget} />
      </QuestionRow>

      <QuestionRow label="Your timeline">
        <AmountChips options={yearOptions} value={years} onChange={setYears} />
      </QuestionRow>

      <QuestionRow label="Monthly contribution to portfolio">
        <AmountChips options={monthlyOptions} value={monthly} onChange={setMonthly} />
      </QuestionRow>

      <QuestionRow label={`Describe your ${meta.label.toLowerCase()} (optional)`}>
        <input
          className="w-full inset px-4 py-3 text-sm text-white bg-transparent outline-none rounded-xl"
          placeholder={detailPlaceholders[goalType]}
          value={details}
          onChange={e => setDetails(e.target.value)}
        />
      </QuestionRow>

      <button
        disabled={!ready}
        onClick={() => onNext({ targetAmount: target, timelineYears: years, monthlyContribution: monthly, details })}
        className="btn btn-primary w-full py-3 text-sm disabled:opacity-30"
      >
        Build my journey →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Building animation
// ─────────────────────────────────────────────────────────────
function StepBuilding({ goalType, onDone }: { goalType: GoalType; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  const steps = ['Analysing your goal…', 'Designing your levels…', 'Calculating your timeline…'];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 700);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cc-onboard-step flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-6" style={{ animation: 'cc-float 1.5s ease-in-out infinite' }}>
        {GOAL_META[goalType].emoji}
      </div>
      <h2 className="font-display text-xl font-bold text-white mb-2">Building your journey</h2>
      <p className="text-sm text-gray-500 h-5 transition-all duration-500">{steps[stepIdx]}</p>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full"
            style={{ background: i <= stepIdx ? GOAL_META[goalType].color : 'rgba(255,255,255,0.1)',
              boxShadow: i <= stepIdx ? `0 0 8px ${GOAL_META[goalType].color}` : 'none',
              transition: 'all 0.4s ease' }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Level Reveal (the WOW moment)
// ─────────────────────────────────────────────────────────────
function StepReveal({ name, goal, levels, onStart }: {
  name: string;
  goal: UserGoal;
  levels: ReturnType<typeof generateLevels>;
  onStart: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const meta = GOAL_META[goal.type];

  useEffect(() => {
    // Reveal levels one by one
    levels.forEach((_, i) => {
      setTimeout(() => setRevealed(i + 1), 300 + i * 350);
    });
    setTimeout(() => setShowTimeline(true), 300 + levels.length * 350 + 300);
    setTimeout(() => setShowCTA(true),      300 + levels.length * 350 + 900);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cc-onboard-step">
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-widest text-gray-600 mb-2">Your personal roadmap</p>
        <h2 className="font-display text-2xl font-bold text-white">
          {name}'s journey to <span style={{ color: meta.color }}>{goal.title || meta.label}</span>
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {formatCurrency(goal.targetAmount)} target · {goal.timelineYears} year{goal.timelineYears > 1 ? 's' : ''}
        </p>
      </div>

      {/* Level ladder */}
      <div className="overflow-x-auto pb-4 cc-scroll mb-6">
        <div className="flex items-center min-w-max px-2">
          {levels.map((lvl, i) => (
            <div key={lvl.level} className="flex items-center">
              {/* Level node */}
              <div
                className="flex flex-col items-center"
                style={{
                  opacity: revealed > i ? 1 : 0,
                  transform: revealed > i ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)',
                  transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2"
                  style={{
                    background: revealed > i ? `${lvl.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${revealed > i ? lvl.color + '55' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: revealed > i ? `0 0 20px ${lvl.glowColor}` : 'none',
                    transition: 'all 0.45s ease',
                  }}
                >
                  {lvl.emoji}
                </div>
                <div className="text-[9px] font-bold text-center leading-tight" style={{ color: revealed > i ? lvl.color : '#374151', width: 64 }}>
                  {lvl.name}
                </div>
                <div className="text-[8px] text-gray-700 mt-0.5">{formatCurrency(lvl.minValue)}</div>
              </div>

              {/* Connector */}
              {i < levels.length - 1 && (
                <div
                  className="h-px w-8 mx-1 flex-shrink-0 transition-all duration-500"
                  style={{
                    background: revealed > i + 1
                      ? `linear-gradient(90deg, ${lvl.color}88, ${levels[i+1].color}88)`
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: revealed > i + 1 ? `0 0 6px ${lvl.glowColor}` : 'none',
                    opacity: revealed > i ? 1 : 0,
                    transitionDelay: `${(i + 0.5) * 350}ms`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline teaser */}
      {showTimeline && (
        <div className="card-sm px-4 py-3 mb-6 cc-badge-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Goal in sight</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {goal.timelineYears} year timeline · adding {formatCurrency(goal.monthlyContribution)}/mo
              </p>
            </div>
            <div className="text-3xl">{meta.emoji}</div>
          </div>
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <button onClick={onStart} className="btn btn-primary w-full py-3 text-sm cc-badge-in">
          Start Level 1 →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root onboarding orchestrator
// ─────────────────────────────────────────────────────────────
export function Onboarding() {
  const [step, setStep] = useState<'goal' | 'details' | 'building' | 'reveal'>('goal');
  const [name, setName]         = useState('');
  const [goalType, setGoalType] = useState<GoalType>('home');
  const [answers, setAnswers]   = useState<{ targetAmount: number; timelineYears: number; monthlyContribution: number; details: string } | null>(null);

  const { completeOnboarding } = useGameStore();
  const meta = GOAL_META[goalType];

  const goal: UserGoal | null = answers
    ? {
        type: goalType,
        title: answers.details || meta.label,
        description: answers.details
          ? `${meta.label}: ${answers.details}. Target: ${formatCurrency(answers.targetAmount)}. Timeline: ${answers.timelineYears} years.`
          : `${meta.label}. Target: ${formatCurrency(answers.targetAmount)}. Timeline: ${answers.timelineYears} years.`,
        targetAmount: answers.targetAmount,
        timelineYears: answers.timelineYears,
        monthlyContribution: answers.monthlyContribution,
        emoji: meta.emoji,
      }
    : null;

  const levels = goal ? generateLevels(goal) : [];

  return (
    <div className="cc-bg min-h-screen flex items-center justify-center px-4">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: meta.color }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5"
          style={{ background: '#8b5cf6' }} />
      </div>

      <div className="relative w-full max-w-md">
        {step === 'goal' && (
          <StepGoal onNext={(n, t) => { setName(n); setGoalType(t); setStep('details'); }} />
        )}
        {step === 'details' && (
          <StepDetails
            name={name}
            goalType={goalType}
            onNext={a => { setAnswers(a); setStep('building'); }}
            onBack={() => setStep('goal')}
          />
        )}
        {step === 'building' && (
          <StepBuilding goalType={goalType} onDone={() => setStep('reveal')} />
        )}
        {step === 'reveal' && goal && (
          <StepReveal
            name={name}
            goal={goal}
            levels={levels}
            onStart={() => completeOnboarding(name, goal)}
          />
        )}
      </div>
    </div>
  );
}
