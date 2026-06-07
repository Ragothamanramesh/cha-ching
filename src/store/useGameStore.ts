import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameProfile, UserGoal, Level, KaiMessage, KaiChatMessage, EarnedBadge, GamePhase } from '@/types/gamification';
import { BADGES } from '@/utils/gamification';
import { generateLevels, getCurrentLevel } from '@/utils/levelEngine';

interface GameState {
  // ── Game flow ───────────────────────────────────────────────────────
  phase: GamePhase;            // current screen in the game flow
  onboardingComplete: boolean; // true once they reach the world the first time
  userName: string;
  avatarId: string | null;
  userGoal: UserGoal | null;
  generatedLevels: Level[];

  // ── Game profile ─────────────────────────────────────────────────────
  profile: GameProfile;
  showLevelUp: boolean;
  levelUpTo: number;
  newBadgeIds: string[];

  // ── Kai ───────────────────────────────────────────────────────────────
  kaiDaily: KaiMessage | null;
  kaiChat: KaiChatMessage[];
  kaiLoading: boolean;

  // ── Prefs ─────────────────────────────────────────────────────────────
  theme: 'dark' | 'light';
  soundOn: boolean;
  voiceOn: boolean;

  // ── Actions ───────────────────────────────────────────────────────────
  setPhase: (p: GamePhase) => void;
  setUserName: (n: string) => void;
  setAvatar: (id: string) => void;
  beginGame: (goal: UserGoal) => void;   // generate levels, enter world
  setPortfolioValue: (value: number) => void;
  recordLogin: () => void;
  dismissLevelUp: () => void;
  dismissNewBadges: () => void;
  connectBroker: (name: string) => void;
  setKaiDaily: (msg: KaiMessage) => void;
  setKaiLoading: (v: boolean) => void;
  addKaiChat: (msg: KaiChatMessage) => void;
  clearKaiChat: () => void;
  toggleTheme: () => void;
  setSoundOn: (v: boolean) => void;
  setVoiceOn: (v: boolean) => void;
  resetAll: () => void;
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
  previousPortfolioValue: 0,
  lastValueUpdateDate: null,
};

function unlockBadges(profile: GameProfile): { updated: GameProfile; newIds: string[] } {
  const earned = new Set(profile.earnedBadges.map(b => b.badgeId));
  const newIds = BADGES
    .filter(b => !earned.has(b.id) && b.checkUnlocked(profile))
    .map(b => b.id);
  const newEntries: EarnedBadge[] = newIds.map(id => ({ badgeId: id, earnedAt: new Date().toISOString() }));
  return { updated: { ...profile, earnedBadges: [...profile.earnedBadges, ...newEntries] }, newIds };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'title',
      onboardingComplete: false,
      userName: '',
      avatarId: null,
      userGoal: null,
      generatedLevels: [],
      profile: DEFAULT_PROFILE,
      showLevelUp: false,
      levelUpTo: 1,
      newBadgeIds: [],
      kaiDaily: null,
      kaiChat: [],
      kaiLoading: false,
      theme: 'dark',
      soundOn: true,
      voiceOn: true,

      setPhase:    (p) => set({ phase: p }),
      setUserName: (n) => set({ userName: n }),
      setAvatar:   (id) => set({ avatarId: id }),

      beginGame: (goal) => {
        const levels = generateLevels(goal);
        set({ onboardingComplete: true, userGoal: goal, generatedLevels: levels, phase: 'world' });
      },

      setPortfolioValue: (value) => {
        const { profile, generatedLevels } = get();
        const oldLevel = getCurrentLevel(profile.portfolioValue, generatedLevels).level;
        const newLevel = getCurrentLevel(value, generatedLevels).level;
        const today    = new Date().toISOString().split('T')[0];
        const draft: GameProfile = {
          ...profile,
          portfolioValue: value,
          lastLevelSeen: newLevel,
          previousPortfolioValue: profile.portfolioValue,
          lastValueUpdateDate: today,
        };
        const { updated, newIds } = unlockBadges(draft);
        set({ profile: updated, showLevelUp: newLevel > oldLevel, levelUpTo: newLevel, newBadgeIds: newIds });
      },

      recordLogin: () => {
        const { profile } = get();
        const today = new Date().toISOString().split('T')[0];
        const last  = profile.lastLoginDate;
        let streak  = 1;
        if (last) {
          const diff = Math.floor((new Date(today).getTime() - new Date(last).getTime()) / 86_400_000);
          if (diff === 0) streak = profile.loginStreak;
          else if (diff === 1) streak = profile.loginStreak + 1;
        }
        const draft: GameProfile = {
          ...profile,
          loginStreak:     streak,
          bestLoginStreak: Math.max(profile.bestLoginStreak, streak),
          lastLoginDate:   today,
          sessionCount:    last === today ? profile.sessionCount : profile.sessionCount + 1,
        };
        const { updated, newIds } = unlockBadges(draft);
        set({ profile: updated, newBadgeIds: newIds.length ? newIds : get().newBadgeIds });
      },

      dismissLevelUp:   () => set({ showLevelUp: false }),
      dismissNewBadges: () => set({ newBadgeIds: [] }),

      connectBroker: (name) => {
        const draft = { ...get().profile, brokerConnected: true, brokerName: name };
        const { updated, newIds } = unlockBadges(draft);
        set({ profile: updated, newBadgeIds: newIds });
      },

      setKaiDaily:  (msg) => set({ kaiDaily: msg }),
      setKaiLoading:(v)   => set({ kaiLoading: v }),
      addKaiChat:   (msg) => set(s => ({ kaiChat: [...s.kaiChat.slice(-40), msg] })),
      clearKaiChat: ()    => set({ kaiChat: [] }),

      toggleTheme: () => set(s => {
        const next = s.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
      }),
      setSoundOn: (v) => set({ soundOn: v }),
      setVoiceOn: (v) => set({ voiceOn: v }),

      resetAll: () => set({
        phase: 'title', onboardingComplete: false, userName: '', avatarId: null,
        userGoal: null, generatedLevels: [],
        profile: DEFAULT_PROFILE, showLevelUp: false, levelUpTo: 1, newBadgeIds: [],
        kaiDaily: null, kaiChat: [], kaiLoading: false, theme: 'dark', soundOn: true, voiceOn: true,
      }),
    }),
    { name: 'cha-ching-v3', version: 3 },
  ),
);
