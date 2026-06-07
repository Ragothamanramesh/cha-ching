import type { Level, Badge } from '@/types/gamification';

export const LEVELS: Level[] = [
  {
    level: 1, productName: 'Pocket Calculator', category: 'Office Supply',
    minValue: 0, maxValue: 99.99, emoji: '🧮', approxPrice: '$15',
    tagline: 'Every legend starts somewhere',
    color: '#6b7280', glowColor: 'rgba(107,114,128,0.5)', tier: 'starter',
  },
  {
    level: 2, productName: 'Fitbit Charge 6', category: 'Fitness Tracker',
    minValue: 100, maxValue: 499.99, emoji: '⌚', approxPrice: '$160',
    tagline: 'Tracking your financial fitness',
    color: '#22c55e', glowColor: 'rgba(34,197,94,0.5)', tier: 'bronze',
  },
  {
    level: 3, productName: 'AirPods Pro', category: 'Audio',
    minValue: 500, maxValue: 999.99, emoji: '🎧', approxPrice: '$249',
    tagline: 'Tuned into the markets',
    color: '#3b82f6', glowColor: 'rgba(59,130,246,0.5)', tier: 'bronze',
  },
  {
    level: 4, productName: 'Apple Watch Ultra', category: 'Smartwatch',
    minValue: 1000, maxValue: 2499.99, emoji: '⌚', approxPrice: '$799',
    tagline: 'Your time is now money',
    color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.5)', tier: 'silver',
  },
  {
    level: 5, productName: 'iPhone 16 Pro', category: 'Smartphone',
    minValue: 2500, maxValue: 4999.99, emoji: '📱', approxPrice: '$1,099',
    tagline: 'Pro tools for pro traders',
    color: '#ec4899', glowColor: 'rgba(236,72,153,0.5)', tier: 'silver',
  },
  {
    level: 6, productName: 'iPad Pro M4', category: 'Tablet',
    minValue: 5000, maxValue: 9999.99, emoji: '💻', approxPrice: '$1,299',
    tagline: 'Trading desk unlocked',
    color: '#f59e0b', glowColor: 'rgba(245,158,11,0.5)', tier: 'gold',
  },
  {
    level: 7, productName: 'MacBook Pro M3', category: 'Laptop',
    minValue: 10000, maxValue: 24999.99, emoji: '🖥️', approxPrice: '$1,999',
    tagline: 'Professional grade achieved',
    color: '#06b6d4', glowColor: 'rgba(6,182,212,0.5)', tier: 'gold',
  },
  {
    level: 8, productName: 'RTX 4090 Gaming PC', category: 'Gaming Setup',
    minValue: 25000, maxValue: 49999.99, emoji: '🎮', approxPrice: '$5,000',
    tagline: 'Maximum performance unlocked',
    color: '#10b981', glowColor: 'rgba(16,185,129,0.5)', tier: 'platinum',
  },
  {
    level: 9, productName: 'Tesla Model Y', category: 'Electric Vehicle',
    minValue: 50000, maxValue: 99999.99, emoji: '🚗', approxPrice: '$45,000',
    tagline: 'Driving your wealth forward',
    color: '#f97316', glowColor: 'rgba(249,115,22,0.5)', tier: 'platinum',
  },
  {
    level: 10, productName: 'Tesla Model S Plaid', category: 'Luxury EV',
    minValue: 100000, maxValue: 249999.99, emoji: '🏎️', approxPrice: '$89,990',
    tagline: 'Six figures. You earned it.',
    color: '#e11d48', glowColor: 'rgba(225,29,72,0.5)', tier: 'diamond',
  },
  {
    level: 11, productName: 'Porsche 911 Turbo S', category: 'Sports Car',
    minValue: 250000, maxValue: 499999.99, emoji: '🏁', approxPrice: '$230,000',
    tagline: 'Quarter million club. Respect.',
    color: '#7c3aed', glowColor: 'rgba(124,58,237,0.5)', tier: 'diamond',
  },
  {
    level: 12, productName: 'Luxury Superyacht', category: 'Marine',
    minValue: 500000, maxValue: 999999.99, emoji: '🛥️', approxPrice: '$500,000+',
    tagline: 'Half a million. Sailing free.',
    color: '#0ea5e9', glowColor: 'rgba(14,165,233,0.5)', tier: 'legend',
  },
  {
    level: 13, productName: 'Private Jet', category: 'Aviation',
    minValue: 1000000, maxValue: Infinity, emoji: '✈️', approxPrice: '$3M+',
    tagline: 'You actually made it. Legend.',
    color: '#fbbf24', glowColor: 'rgba(251,191,36,0.5)', tier: 'legend',
  },
];

export const BADGES: Badge[] = [
  { id: 'first_dollar',   emoji: '💵', name: 'First Dollar',   rarity: 'common',    requirement: 'Portfolio > $0',    description: 'Start your journey',           checkUnlocked: p => p.portfolioValue > 0 },
  { id: 'triple_digits',  emoji: '💯', name: 'Triple Digits',  rarity: 'common',    requirement: '$100',              description: 'Portfolio reached $100',       checkUnlocked: p => p.portfolioValue >= 100 },
  { id: 'four_figures',   emoji: '🦄', name: 'Four Figures',   rarity: 'rare',      requirement: '$1,000',            description: 'Crossed the $1,000 mark',     checkUnlocked: p => p.portfolioValue >= 1000 },
  { id: 'five_figures',   emoji: '🏆', name: 'Five Figures',   rarity: 'epic',      requirement: '$10,000',           description: 'Crossed the $10,000 mark',    checkUnlocked: p => p.portfolioValue >= 10000 },
  { id: 'six_figures',    emoji: '💰', name: 'Six Figures',    rarity: 'legendary', requirement: '$100,000',          description: 'Crossed the $100,000 mark',   checkUnlocked: p => p.portfolioValue >= 100000 },
  { id: 'millionaire',    emoji: '🌟', name: 'Millionaire',    rarity: 'legendary', requirement: '$1,000,000',        description: 'Portfolio crossed $1M',       checkUnlocked: p => p.portfolioValue >= 1000000 },
  { id: 'regular',        emoji: '📅', name: 'Regular',        rarity: 'common',    requirement: '3-day streak',      description: '3-day login streak',          checkUnlocked: p => p.loginStreak >= 3 },
  { id: 'week_warrior',   emoji: '🔥', name: 'Week Warrior',   rarity: 'rare',      requirement: '7-day streak',      description: '7-day login streak',          checkUnlocked: p => p.loginStreak >= 7 },
  { id: 'month_master',   emoji: '🧘', name: 'Month Master',   rarity: 'epic',      requirement: '30-day streak',     description: '30-day login streak',         checkUnlocked: p => p.loginStreak >= 30 },
  { id: 'explorer',       emoji: '🔭', name: 'Explorer',       rarity: 'common',    requirement: '10 sessions',       description: 'Opened the app 10 times',     checkUnlocked: p => p.sessionCount >= 10 },
  { id: 'veteran',        emoji: '🎖️', name: 'Veteran',        rarity: 'rare',      requirement: '50 sessions',       description: 'Opened the app 50 times',     checkUnlocked: p => p.sessionCount >= 50 },
  { id: 'connected',      emoji: '🔗', name: 'Linked Up',      rarity: 'rare',      requirement: 'Connect broker',    description: 'Connected a broker account',  checkUnlocked: p => p.brokerConnected },
];

export function getCurrentLevel(value: number): Level {
  return [...LEVELS].reverse().find(l => value >= l.minValue) ?? LEVELS[0];
}

export function getNextLevel(value: number): Level | null {
  const cur = getCurrentLevel(value);
  return LEVELS.find(l => l.level === cur.level + 1) ?? null;
}

export function getXPProgress(value: number): number {
  const cur = getCurrentLevel(value);
  if (cur.maxValue === Infinity) return 100;
  const range = cur.maxValue + 0.01 - cur.minValue;
  return Math.min(100, Math.max(0, ((value - cur.minValue) / range) * 100));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export const RARITY_COLOR: Record<string, string> = {
  common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#fbbf24',
};
export const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(156,163,175,0.25)', rare: 'rgba(59,130,246,0.35)', epic: 'rgba(168,85,247,0.45)', legendary: 'rgba(251,191,36,0.55)',
};
export const TIER_LABEL: Record<string, string> = {
  starter: 'Starter', bronze: 'Bronze', silver: 'Silver', gold: 'Gold',
  platinum: 'Platinum', diamond: 'Diamond', legend: 'Legend',
};
