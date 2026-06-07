import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameProfile } from '@/types/gamification';
import { BADGES, getCurrentLevel } from '@/utils/gamification';

interface GameState {
  profile: GameProfile;
  showLevelUp: boolean;
  levelUpTo: number;
  newBadgeIds: string[];
  setPortfolioValue: (value: number) => void;
  recordLogin: () => void;
  dismissLevelUp: () => void;
  dismissNewBadges: () => void;
  connectBroker: (name: string) => void;
  resetGame: () => void;
}

const DEFAULT_PROFILE: GameProfile = {
  portfolioValue: 0,
  lastLevelSeen: 1,
  loginStreak: 0,
  bestLoginStreak: 0,
  lastLoginDate: null,
  earnedBadges: [],
  sessionCount: 0,
  brokerConnected: false,
  brokerName: null,
};

function unlockNewBadges(profile: GameProfile): { updated: GameProfile; newIds: string[] } {
  const earned = new Set(profile.earnedBadges.map(b => b.badgeId));
  const newIds = BADGES
    .filter(b => !earned.has(b.id) && b.checkUnlocked(profile))
    .map(b => b.id);
  return {
    updated: {
      ...profile,
      earnedBadges: [
        ...profile.earnedBadges,
        ...newIds.map(id => ({ badgeId: id, earnedAt: new Date().toISOString() })),
      ],
    },
    newIds,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      showLevelUp: false,
      levelUpTo: 1,
      newBadgeIds: [],

      setPortfolioValue: (value) => {
        const { profile } = get();
        const oldLevel = getCurrentLevel(profile.portfolioValue).level;
        const newLevel = getCurrentLevel(value).level;
        const draft: GameProfile = { ...profile, portfolioValue: value, lastLevelSeen: newLevel };
        const { updated, newIds } = unlockNewBadges(draft);
        set({ profile: updated, showLevelUp: newLevel > oldLevel, levelUpTo: newLevel, newBadgeIds: newIds });
      },

      recordLogin: () => {
        const { profile } = get();
        const today = new Date().toISOString().split('T')[0];
        const last = profile.lastLoginDate;
        let streak = 1;
        if (last) {
          const diff = Math.floor((new Date(today).getTime() - new Date(last).getTime()) / 86_400_000);
          if (diff === 0) streak = profile.loginStreak;
          else if (diff === 1) streak = profile.loginStreak + 1;
        }
        const draft: GameProfile = {
          ...profile,
          loginStreak: streak,
          bestLoginStreak: Math.max(profile.bestLoginStreak, streak),
          lastLoginDate: today,
          sessionCount: last === today ? profile.sessionCount : profile.sessionCount + 1,
        };
        const { updated, newIds } = unlockNewBadges(draft);
        set({ profile: updated, newBadgeIds: newIds.length ? newIds : get().newBadgeIds });
      },

      dismissLevelUp: () => set({ showLevelUp: false }),
      dismissNewBadges: () => set({ newBadgeIds: [] }),

      connectBroker: (name) => {
        const draft = { ...get().profile, brokerConnected: true, brokerName: name };
        const { updated, newIds } = unlockNewBadges(draft);
        set({ profile: updated, newBadgeIds: newIds });
      },

      resetGame: () => set({ profile: DEFAULT_PROFILE, showLevelUp: false, levelUpTo: 1, newBadgeIds: [] }),
    }),
    { name: 'cha-ching-v1', version: 1 },
  ),
);
