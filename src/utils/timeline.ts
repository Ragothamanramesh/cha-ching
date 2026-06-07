import type { Level, PaceStatus } from '@/types/gamification';
import { getCurrentLevel } from './levelEngine';

export interface LevelDate {
  level: number;
  name: string;
  targetAmount: number;
  estimatedDate: Date | null;   // null = already passed / current
  monthsFromNow: number;
}

export interface TimelineResult {
  monthlyGrowthRate: number;  // as decimal e.g. 0.03
  monthsToGoal: number;
  goalDate: Date | null;
  levelDates: LevelDate[];
  paceStatus: PaceStatus;
  daysAheadOrBehind: number;
}

/**
 * Projects how long it takes to reach each level milestone.
 *
 * Formula:  FV = PV * (1 + r)^n  +  PMT * [(1+r)^n - 1] / r
 * Inverted:  solve for n  ≈  log((FV + PMT/r) / (PV + PMT/r)) / log(1 + r)
 */
function monthsToReach(
  currentValue: number,
  targetValue: number,
  monthlyRate: number,
  monthlyContribution: number,
): number {
  if (currentValue >= targetValue) return 0;
  if (monthlyRate <= 0 && monthlyContribution <= 0) return Infinity;

  // Edge: no growth, only contributions
  if (monthlyRate <= 0) {
    return Math.ceil((targetValue - currentValue) / monthlyContribution);
  }

  const r = monthlyRate;
  const pmt = monthlyContribution;
  const pv = currentValue;
  const fv = targetValue;

  // Newton approximation — fast enough for 7 levels
  const adjPV = pv + pmt / r;
  const adjFV = fv + pmt / r;
  if (adjFV <= 0 || adjPV <= 0) return Infinity;

  const n = Math.log(adjFV / adjPV) / Math.log(1 + r);
  return Math.max(0, Math.ceil(n));
}

export function calculateTimeline(
  portfolioValue: number,
  levels: Level[],
  goal: { targetAmount: number; timelineYears: number },
  monthlyGrowthRate: number,      // e.g. 0.03  (3% per month)
  monthlyContribution: number,    // e.g. 500
): TimelineResult {
  const now = new Date();

  // Months to each level
  const levelDates: LevelDate[] = levels.map(l => {
    if (portfolioValue >= l.minValue) {
      return { level: l.level, name: l.name, targetAmount: l.minValue, estimatedDate: null, monthsFromNow: 0 };
    }
    const months = monthsToReach(portfolioValue, l.minValue, monthlyGrowthRate, monthlyContribution);
    const date = months === Infinity ? null : new Date(now.getFullYear(), now.getMonth() + months, 1);
    return { level: l.level, name: l.name, targetAmount: l.minValue, estimatedDate: date, monthsFromNow: months };
  });

  const goalMonths = monthsToReach(portfolioValue, goal.targetAmount, monthlyGrowthRate, monthlyContribution);
  const goalDate   = goalMonths === Infinity ? null : new Date(now.getFullYear(), now.getMonth() + goalMonths, 1);

  // Pace: compare projected months vs timeline
  const targetMonths = goal.timelineYears * 12;
  const diff = targetMonths - goalMonths;        // positive = ahead
  const daysAheadOrBehind = Math.round(Math.abs(diff) * 30.44);
  const paceStatus: PaceStatus = diff > 10 ? 'ahead' : diff < -10 ? 'behind' : 'on_track';

  return { monthlyGrowthRate, monthsToGoal: goalMonths, goalDate, levelDates, paceStatus, daysAheadOrBehind };
}

/** Days until the next level at current pace */
export function daysToNextLevel(
  portfolioValue: number,
  levels: Level[],
  monthlyGrowthRate: number,
  monthlyContribution: number,
): number {
  const cur = getCurrentLevel(portfolioValue, levels);
  const next = levels.find(l => l.level === cur.level + 1);
  if (!next) return 0;
  const months = monthsToReach(portfolioValue, next.minValue, monthlyGrowthRate, monthlyContribution);
  return months === Infinity ? 999 : Math.round(months * 30.44);
}

export function formatDate(d: Date | null): string {
  if (!d) return 'achieved';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
