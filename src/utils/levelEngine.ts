import type { Level, UserGoal, GoalType, Tier } from '@/types/gamification';

// ── Milestone ratios: logarithmic curve so early wins come fast ────────────────
// 7 levels: 0.3% · 1.5% · 5% · 12% · 25% · 50% · 100%
const RATIOS = [0.003, 0.015, 0.05, 0.12, 0.25, 0.50, 1.0];

function round(n: number): number {
  if (n <    500) return Math.ceil(n / 50)     * 50;
  if (n <   2000) return Math.ceil(n / 100)    * 100;
  if (n <  10000) return Math.ceil(n / 500)    * 500;
  if (n < 100000) return Math.ceil(n / 1000)   * 1000;
  return           Math.ceil(n / 5000)          * 5000;
}

// ── Tier bands ─────────────────────────────────────────────────────────────────
function tier(levelIndex: number): Tier {
  const tiers: Tier[] = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'platinum', 'legend'];
  return tiers[levelIndex] ?? 'legend';
}

// ── Per-goal templates: [name, emoji, tagline] for levels 1-7 ─────────────────
type Template = [string, string, string];

const TEMPLATES: Record<GoalType, Template[]> = {
  home: [
    ['First Seed',      '🌱', 'You decided. That already puts you ahead.'],
    ['Blueprint Stage', '📋', 'Serious people have blueprints.'],
    ['Foundation Fund', '🏗️', 'Real money, real momentum.'],
    ['Bank Ready',      '🏦', 'The bank is starting to notice.'],
    ['Down Payment',    '🔐', 'This is where it gets real.'],
    ['Final Stretch',   '🛣️', "You can see it from here."],
    ['Keys in Hand',    '🏠', 'You built this. Every dollar of it.'],
  ],
  car: [
    ['Reserved It',        '🎯', 'The intention is set. Now back it up.'],
    ['Gears Turning',      '⚙️', 'Momentum is a beautiful thing.'],
    ['Fast Charging',      '⚡', 'This is where it accelerates.'],
    ['Test Drive Ready',   '🛞', 'You could walk in today.'],
    ['Full Send',          '🚗', "It's yours. Go get it."],
    // car goals often have 5 levels - pad to 7 if target is large
    ['Ownership',          '🔑', 'Paid in full. No monthly payments.'],
    ['Dream Garage',       '🏁', 'The car AND the freedom it represents.'],
  ],
  retirement: [
    ['Seed Planted',    '🌱', 'Compounding starts now, not later.'],
    ['Growing',         '🌿', "Time in the market beats timing it."],
    ['Strong Roots',    '🌳', 'You can feel the compound effect now.'],
    ['Feeling Warm',    '☀️', 'Six figures. The math is starting to work for you.'],
    ['Can See the Beach','🏝️', "You're closer than most people ever get."],
    ['Almost Free',     '🌅', 'One more push. This is it.'],
    ['Freedom',         '🌴', 'You did what most only talk about.'],
  ],
  debt: [
    ['First Dent',       '⛏️', 'Every dollar here is a dollar of freedom.'],
    ['Gaining Ground',   '📉', 'The balance is moving. Keep going.'],
    ['Halfway There',    '⚖️', 'You crossed the midpoint. Most quit here.'],
    ['Final Third',      '🏃', 'The finish line is in view.'],
    ['Last Payment',     '✂️', 'One final cut and you\'re done forever.'],
    ['Debt Free',        '🎉', 'No one owns a piece of your future anymore.'],
    ['Building Wealth',  '📈', 'Now every dollar works for you, not against.'],
  ],
  travel: [
    ['Dream Set',        '✏️', 'Wanting it clearly is the first step.'],
    ['Passport Ready',   '📔', 'You\'re serious about this.'],
    ['Flights Saved',    '✈️', 'The ticket is within reach.'],
    ['Hotels Covered',   '🏨', 'Accommodation sorted. Now the experiences.'],
    ['Full Trip Funded', '🌍', 'Everything paid. You just have to go.'],
    ['Return + Explore', '🗺️', 'The original trip plus more.'],
    ['Nomad Level',      '🌏', 'You don\'t have to stop.'],
  ],
  business: [
    ['Idea Backed',      '💡', 'You\'re funding the vision, not just holding it.'],
    ['MVP Budget',       '⚒️', 'Enough to build something real.'],
    ['Launch Ready',     '🚀', 'You could open the doors today.'],
    ['First Hire',       '🤝', 'Big enough to bring someone else in.'],
    ['Scale Capital',    '📊', 'Now you grow, not just survive.'],
    ['Series-Ready',     '💼', 'The kind of number that gets meetings.'],
    ['Built to Last',    '🏢', 'You built something that outlasts you.'],
  ],
  custom: [
    ['First Step',     '👣', 'The gap between zero and something is everything.'],
    ['Gaining Speed',  '⚡', 'The habit is forming. Don\'t break it.'],
    ['Midpoint',       '🎯', 'Halfway. The hardest part is already done.'],
    ['Three Quarters', '🔥', 'You\'re in the top 10% of people who started.'],
    ['Almost There',   '🏁', 'So close you can taste it.'],
    ['Final Push',     '💪', 'One last surge.'],
    ['Goal Reached',   '🏆', 'You said you would. You did.'],
  ],
};

// ── Colour palette cycling through levels ──────────────────────────────────────
const COLOURS = [
  { color: '#22c55e', glow: 'rgba(34,197,94,0.45)' },
  { color: '#3b82f6', glow: 'rgba(59,130,246,0.45)' },
  { color: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' },
  { color: '#ec4899', glow: 'rgba(236,72,153,0.45)' },
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  { color: '#06b6d4', glow: 'rgba(6,182,212,0.45)' },
  { color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
];

// ── Public API ─────────────────────────────────────────────────────────────────
export function generateLevels(goal: UserGoal): Level[] {
  const templates = TEMPLATES[goal.type] ?? TEMPLATES.custom;
  const numLevels = goal.type === 'car' && goal.targetAmount < 60000 ? 5 : 7;

  // Use first numLevels ratios, always end at 1.0
  const ratios = RATIOS.slice(0, numLevels);
  ratios[ratios.length - 1] = 1.0;

  return ratios.map((ratio, i) => {
    const raw = goal.targetAmount * ratio;
    const amount = i === ratios.length - 1 ? goal.targetAmount : round(raw);
    const nextAmount = i < ratios.length - 1
      ? (i === ratios.length - 2 ? goal.targetAmount : round(goal.targetAmount * ratios[i + 1]))
      : Infinity;

    const [name, emoji, tagline] = templates[i] ?? templates[templates.length - 1];
    const { color, glow } = COLOURS[i % COLOURS.length];

    return {
      level:     i + 1,
      name,
      emoji,
      tagline,
      minValue:  amount,
      maxValue:  nextAmount === Infinity ? Infinity : nextAmount - 0.01,
      color,
      glowColor: glow,
      tier:      tier(i),
    };
  });
}

export function getCurrentLevel(value: number, levels: Level[]): Level {
  return [...levels].reverse().find(l => value >= l.minValue) ?? levels[0];
}

export function getNextLevel(value: number, levels: Level[]): Level | null {
  const cur = getCurrentLevel(value, levels);
  return levels.find(l => l.level === cur.level + 1) ?? null;
}

export function getXPProgress(value: number, levels: Level[]): number {
  const cur = getCurrentLevel(value, levels);
  if (cur.maxValue === Infinity) return 100;
  const range = cur.maxValue + 0.01 - cur.minValue;
  return Math.min(100, Math.max(0, ((value - cur.minValue) / range) * 100));
}
