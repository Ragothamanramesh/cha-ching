import type { Avatar } from '@/types/gamification';

/* Pick-your-fighter roster. Each avatar is an archetype with a money-personality.
   Kai references the chosen vibe when roasting/coaching the player. */
export const AVATARS: Avatar[] = [
  {
    id: 'goblin',
    emoji: '👺',
    name: 'The Goblin',
    vibe: 'hoards every dollar. spends nothing. slightly feral about it.',
    color: '#c8ff00',
    glow: 'rgba(200,255,0,0.5)',
  },
  {
    id: 'shark',
    emoji: '🦈',
    name: 'The Shark',
    vibe: 'aggressive. sees a dip, smells blood. high risk high reward.',
    color: '#00cfff',
    glow: 'rgba(0,207,255,0.5)',
  },
  {
    id: 'monk',
    emoji: '🧘',
    name: 'The Monk',
    vibe: 'zen. dollar-cost averages and never panics. boringly rich eventually.',
    color: '#ffd700',
    glow: 'rgba(255,215,0,0.5)',
  },
  {
    id: 'gremlin',
    emoji: '😈',
    name: 'The Gremlin',
    vibe: 'chaos investor. buys the meme. somehow up. do NOT ask how.',
    color: '#ff2d78',
    glow: 'rgba(255,45,120,0.5)',
  },
  {
    id: 'phoenix',
    emoji: '🔥',
    name: 'The Phoenix',
    vibe: 'been broke. came back. has something to prove this time.',
    color: '#ff7a00',
    glow: 'rgba(255,122,0,0.5)',
  },
  {
    id: 'owl',
    emoji: '🦉',
    name: 'The Strategist',
    vibe: 'reads the charts at 3am. has a spreadsheet for the spreadsheet.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.5)',
  },
  {
    id: 'cat',
    emoji: '😼',
    name: 'The Opportunist',
    vibe: 'lands on their feet every time. suspiciously lucky. unbothered.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.5)',
  },
  {
    id: 'robot',
    emoji: '🤖',
    name: 'The Machine',
    vibe: 'pure discipline. no emotions. automates everything. terrifying.',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.5)',
  },
];

export function getAvatar(id: string | null): Avatar {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}
