import type { Badge } from '@/types/gamification';

export const BADGES: Badge[] = [
  { id: 'first_dollar',  emoji: '💵', name: 'First Dollar',  rarity: 'common',    requirement: 'Portfolio > $0',   description: 'Start your journey',            checkUnlocked: p => p.portfolioValue > 0 },
  { id: 'triple_digits', emoji: '💯', name: 'Triple Digits', rarity: 'common',    requirement: '$100',             description: 'Portfolio reached $100',        checkUnlocked: p => p.portfolioValue >= 100 },
  { id: 'four_figures',  emoji: '🦄', name: 'Four Figures',  rarity: 'rare',      requirement: '$1,000',           description: 'Crossed the $1K mark',          checkUnlocked: p => p.portfolioValue >= 1000 },
  { id: 'five_figures',  emoji: '🏆', name: 'Five Figures',  rarity: 'epic',      requirement: '$10,000',          description: 'Crossed the $10K mark',         checkUnlocked: p => p.portfolioValue >= 10000 },
  { id: 'six_figures',   emoji: '💰', name: 'Six Figures',   rarity: 'legendary', requirement: '$100,000',         description: 'Crossed the $100K mark',        checkUnlocked: p => p.portfolioValue >= 100000 },
  { id: 'millionaire',   emoji: '🌟', name: 'Millionaire',   rarity: 'legendary', requirement: '$1,000,000',       description: 'Portfolio crossed $1M',         checkUnlocked: p => p.portfolioValue >= 1000000 },
  { id: 'regular',       emoji: '📅', name: 'Regular',       rarity: 'common',    requirement: '3-day streak',     description: '3-day login streak',            checkUnlocked: p => p.loginStreak >= 3 },
  { id: 'week_warrior',  emoji: '🔥', name: 'Week Warrior',  rarity: 'rare',      requirement: '7-day streak',     description: '7 consecutive days',            checkUnlocked: p => p.loginStreak >= 7 },
  { id: 'month_master',  emoji: '🧘', name: 'Month Master',  rarity: 'epic',      requirement: '30-day streak',    description: '30 consecutive days',           checkUnlocked: p => p.loginStreak >= 30 },
  { id: 'explorer',      emoji: '🔭', name: 'Explorer',      rarity: 'common',    requirement: '10 sessions',      description: 'Opened the app 10 times',       checkUnlocked: p => p.sessionCount >= 10 },
  { id: 'veteran',       emoji: '🎖️', name: 'Veteran',       rarity: 'rare',      requirement: '50 sessions',      description: 'Opened the app 50 times',       checkUnlocked: p => p.sessionCount >= 50 },
  { id: 'connected',     emoji: '🔗', name: 'Linked Up',     rarity: 'rare',      requirement: 'Connect broker',   description: 'Connected a broker account',    checkUnlocked: p => p.brokerConnected },
];

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export const RARITY_COLOR: Record<string, string> = {
  common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#fbbf24',
};
export const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(156,163,175,0.25)', rare: 'rgba(59,130,246,0.35)',
  epic: 'rgba(168,85,247,0.45)',    legendary: 'rgba(251,191,36,0.55)',
};
export const TIER_LABEL: Record<string, string> = {
  starter: 'Starter', bronze: 'Bronze', silver: 'Silver', gold: 'Gold',
  platinum: 'Platinum', diamond: 'Diamond', legend: 'Legend',
};

// Goal type display
export const GOAL_META: Record<string, { label: string; emoji: string; color: string }> = {
  home:       { label: 'Dream Home',        emoji: '🏠', color: '#22c55e' },
  car:        { label: 'Dream Car',         emoji: '🚗', color: '#3b82f6' },
  retirement: { label: 'Early Retirement',  emoji: '🌴', color: '#f59e0b' },
  debt:       { label: 'Debt Free',         emoji: '✂️', color: '#ec4899' },
  travel:     { label: 'Travel the World',  emoji: '✈️', color: '#06b6d4' },
  business:   { label: 'Start a Business',  emoji: '💼', color: '#8b5cf6' },
  custom:     { label: 'My Goal',           emoji: '🎯', color: '#fbbf24' },
};
