export type Tier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Level {
  level: number;
  productName: string;
  category: string;
  minValue: number;
  maxValue: number;
  emoji: string;
  tagline: string;
  color: string;
  glowColor: string;
  tier: Tier;
  approxPrice: string;
}

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
}
