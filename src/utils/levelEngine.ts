import type { Level, UserGoal, GoalType, Tier } from '@/types/gamification';

// ── Milestone ratios: logarithmic — early wins hit fast ───────────────────────
const RATIOS = [0.003, 0.015, 0.05, 0.12, 0.25, 0.50, 1.0];

function round(n: number): number {
  if (n <    500) return Math.ceil(n / 50)   * 50;
  if (n <   2000) return Math.ceil(n / 100)  * 100;
  if (n <  10000) return Math.ceil(n / 500)  * 500;
  if (n < 100000) return Math.ceil(n / 1000) * 1000;
  return           Math.ceil(n / 5000)        * 5000;
}

function tier(i: number): Tier {
  const t: Tier[] = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'platinum', 'legend'];
  return t[i] ?? 'legend';
}

type Template = [string, string, string]; // [name, emoji, tagline]

// ── Gen Z era names ────────────────────────────────────────────────────────────
const TEMPLATES: Record<GoalType, Template[]> = {
  home: [
    ['Rent Era',          '💸', "throwing money at landlords rn. not for long."],
    ['Saving Era',        '🏦', "actually putting money away. different breed."],
    ['Down Payment Era',  '🔑', "getting closer to the real thing fr."],
    ['Pre-Approval Era',  '📋', "banks starting to respect ur bag."],
    ['Offer Season',      '🤝', "making moves. this is real life."],
    ['Closing Era',       '📝', "almost there bestie. so close."],
    ['Homeowner Era',     '🏡', "no more landlords. ever. you did that."],
  ],
  car: [
    ['Bus Pass Era',      '🚌', "uber and pray. this ends soon."],
    ['Beater Era',        '🚗', "it runs. that's enough for now."],
    ['First Whip Era',    '🔑', "ur own car. no one can take that from u."],
    ['Upgrade Era',       '⬆️', "leveling up the ride. heads turning."],
    ['Nice Car Era',      '😤', "turning heads on the street fr."],
    ['Dream Car Loading', '💭', "almost pulling up in it. for real this time."],
    ['Pull Up Era',       '🏁', "u bought ur dream car. periodt."],
  ],
  retirement: [
    ['Survival Era',      '😅', "paycheck to paycheck but ur building now."],
    ['Stack Era',         '💰', "actually saving. not everyone does this."],
    ['Invest Era',        '📈', "money making money. the cheat code."],
    ['Coast Era',         '🏄', "portfolio doing the work while u sleep."],
    ['FI Era',            '🎯', "financially independent. no cap."],
    ['Early Retire Loading','🌴', "almost out of the rat race fr."],
    ['Free Era',          '👑', "retired early. legend behavior."],
  ],
  debt: [
    ['Deep Debt Era',     '😭', "it's giving financial anxiety. we fixin it."],
    ['Chipping Away Era', '⛏️', "making a dent. consistency is everything."],
    ['Momentum Era',      '🔥', "the debt is scared of u now."],
    ['Halfway Era',       '📊', "crossed the midpoint. most ppl quit here."],
    ['Almost Free Era',   '✂️', "cutting the last chains. u can feel it."],
    ['Final Push Era',    '💪', "so close u can taste it. don't stop."],
    ['Debt Free Era',     '🎉', "zero debt. main character. u did that."],
  ],
  travel: [
    ['Google Maps Era',   '🗺️', "window shopping destinations lol. not for long."],
    ['Passport Era',      '🛂', "first stamps incoming. it's starting."],
    ['Weekend Trip Era',  '✈️', "catching flights not feelings. facts."],
    ['Euro Trip Era',     '🌍', "living in the cities. u eat well."],
    ['Long Haul Era',     '🌏', "southeast asia unlocked. go crazy."],
    ['Nomad Loading Era', '💻', "work from anywhere is loading..."],
    ['Full Nomad Era',    '🌐', "the world is ur office. literally."],
  ],
  business: [
    ['Idea Era',          '💡', "it's just a thought rn. fund the vision."],
    ['Side Hustle Era',   '🌙', "building after the 9-5. that's discipline."],
    ['Launch Era',        '🚀', "shipped. it's real now. no more excuses."],
    ['Revenue Era',       '💵', "getting that bag. ur a real founder."],
    ['Scale Era',         '📈', "growing fr fr. compound everything."],
    ['Profitable Era',    '🤑', "the numbers are hitting. business is real."],
    ['Empire Era',        '👑', "u built something that lasts. periodt."],
  ],
  custom: [
    ['Start Era',         '🌱', "every legend starts exactly here."],
    ['Build Era',         '🏗️', "putting in the work. different mindset."],
    ['Grind Era',         '💪', "no days off. the gap is closing."],
    ['Momentum Era',      '🔥', "can't stop won't stop. ur different."],
    ['Almost Era',        '👀', "so close rn. don't let up."],
    ['Final Push Era',    '⚡', "this is the one. make it count."],
    ['Achieved Era',      '🏆', "u said u would. u did. fr."],
  ],
};

// ── Era colours — neon progression ────────────────────────────────────────────
const COLOURS = [
  { color: '#888899', glow: 'rgba(136,136,153,0.30)' }, // 1 — muted gray
  { color: '#ff7a00', glow: 'rgba(255,122,0,0.40)'   }, // 2 — orange hustle
  { color: '#ffd700', glow: 'rgba(255,215,0,0.40)'   }, // 3 — gold
  { color: '#c8ff00', glow: 'rgba(200,255,0,0.45)'   }, // 4 — lime main char
  { color: '#00cfff', glow: 'rgba(0,207,255,0.40)'   }, // 5 — electric blue
  { color: '#ff2d78', glow: 'rgba(255,45,120,0.45)'  }, // 6 — hot pink legend
  { color: '#ffd700', glow: 'rgba(255,215,0,0.60)'   }, // 7 — gold achieved
];

// ── Public API ─────────────────────────────────────────────────────────────────
export function generateLevels(goal: UserGoal): Level[] {
  const templates = TEMPLATES[goal.type] ?? TEMPLATES.custom;
  const numLevels = 7;
  const ratios = RATIOS.slice(0, numLevels);
  ratios[ratios.length - 1] = 1.0;

  return ratios.map((ratio, i) => {
    const raw = goal.targetAmount * ratio;
    const amount = i === ratios.length - 1 ? goal.targetAmount : round(raw);
    const nextAmount = i < ratios.length - 1
      ? (i === ratios.length - 2 ? goal.targetAmount : round(goal.targetAmount * ratios[i + 1]))
      : Infinity;

    const [name, emoji, tagline] = templates[i] ?? templates[templates.length - 1];
    const { color, glow } = COLOURS[i];

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
