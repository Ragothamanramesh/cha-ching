export type Tier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GoalType = 'home' | 'car' | 'retirement' | 'debt' | 'travel' | 'business' | 'custom';
export type PaceStatus = 'ahead' | 'on_track' | 'behind';
export type KaiTrigger =
  | 'daily' | 'level_up' | 'near_level' | 'behind_pace'
  | 'portfolio_drop' | 'streak_milestone' | 're_engagement' | 'chat'
  | 'intro';

// ── Game flow phases ────────────────────────────────────────────────────────────
export type GamePhase =
  | 'title'      // cold open splash
  | 'intro'      // Kai's dark-comedy story intro
  | 'avatar'     // pick your character
  | 'goal'       // what's your money goal
  | 'numbers'    // target / timeline / monthly
  | 'reveal'     // era ladder reveal
  | 'world';     // the live game world

// ── Avatar ──────────────────────────────────────────────────────────────────────
export interface Avatar {
  id: string;
  emoji: string;
  name: string;          // archetype name
  vibe: string;          // one-liner personality
  color: string;
  glow: string;
}

// ── Goal ───────────────────────────────────────────────────────────────────────
export interface UserGoal {
  type: GoalType;
  title: string;           // "Dream Home in Austin"
  description: string;     // Rich text for the AI prompt
  targetAmount: number;
  timelineYears: number;
  monthlyContribution: number;
  emoji: string;
}

// ── Generated Level ────────────────────────────────────────────────────────────
export interface Level {
  level: number;
  name: string;
  emoji: string;
  tagline: string;
  minValue: number;        // same as targetAmount for that level
  maxValue: number;
  color: string;
  glowColor: string;
  tier: Tier;
}

// ── Badge ──────────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: BadgeRarity;
  requirement: string;
  checkUnlocked: (profile: GameProfile) => boolean;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

// ── Core game profile ──────────────────────────────────────────────────────────
export interface GameProfile {
  portfolioValue: number;
  lastLevelSeen: number;
  loginStreak: number;
  bestLoginStreak: number;
  lastLoginDate: string | null;
  earnedBadges: EarnedBadge[];
  sessionCount: number;
  brokerConnected: boolean;
  brokerName: string | null;
  previousPortfolioValue: number;   // for % change calc
  lastValueUpdateDate: string | null;
}

// ── Kai message cache ──────────────────────────────────────────────────────────
export interface KaiMessage {
  text: string;
  date: string;          // ISO date string — cache key
  trigger: KaiTrigger;
}

export interface KaiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ── Coach context sent to API ──────────────────────────────────────────────────
export interface CoachContext {
  name: string;
  avatarName?: string;
  avatarVibe?: string;
  goalTitle: string;
  goalDescription: string;
  targetAmount: number;
  timelineYears: number;
  portfolioValue: number;
  currentLevel: number;
  totalLevels: number;
  currentLevelName: string;
  nextLevelName: string | null;
  progressPercent: number;
  amountToNextLevel: number;
  loginStreak: number;
  bestStreak: number;
  portfolioChangePct: number;
  daysSinceLastUpdate: number;
  paceStatus: PaceStatus;
  daysAheadOrBehind: number;
  daysToNextLevel: number;
  trigger: KaiTrigger;
  userMessage?: string;
  history?: KaiChatMessage[];
}
