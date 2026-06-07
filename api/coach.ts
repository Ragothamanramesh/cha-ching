import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

interface CoachRequest {
  name: string;
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
  paceStatus: 'ahead' | 'on_track' | 'behind';
  daysAheadOrBehind: number;
  daysToNextLevel: number;
  trigger: string;
  userMessage?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

function buildSystem(c: CoachRequest): string {
  const pace =
    c.paceStatus === 'ahead'
      ? `${c.daysAheadOrBehind} days AHEAD of schedule`
      : c.paceStatus === 'behind'
      ? `${c.daysAheadOrBehind} days BEHIND schedule`
      : 'right on track';

  return `You are Kai — a personal trading coach for ${c.name}.

THEIR GOAL:
${c.goalDescription}
Target: $${c.targetAmount.toLocaleString()}
Timeline: ${c.timelineYears} years

TODAY'S DATA (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}):
- Portfolio: $${c.portfolioValue.toLocaleString()} — Level ${c.currentLevel}/${c.totalLevels} ("${c.currentLevelName}")
- Progress to "${c.nextLevelName ?? 'Final Goal'}": ${c.progressPercent.toFixed(0)}% ($${c.amountToNextLevel.toLocaleString()} away)
- Days to next level at current pace: ${c.daysToNextLevel > 0 ? c.daysToNextLevel + ' days' : 'within reach this week'}
- Pace: ${pace}
- Login streak: ${c.loginStreak} days (personal best: ${c.bestStreak})
- Portfolio change since last update: ${c.portfolioChangePct >= 0 ? '+' : ''}${c.portfolioChangePct.toFixed(1)}%
- Last portfolio update: ${c.daysSinceLastUpdate === 0 ? 'today' : c.daysSinceLastUpdate + ' days ago'}
- Trigger context: ${c.trigger}

YOUR VOICE:
- Direct, warm, specific. Never fluffy.
- Max 2–3 sentences. Never more.
- Reference at least one real number from their data.
- No emojis in message text — keep it grounded and human.
- Never give financial advice (no buy/sell recommendations).
- Be honest. If they're behind, say so — don't spin it.
- This message must feel like it could ONLY exist for ${c.name}, on this exact day.

TRIGGER GUIDE:
- daily: energising, forward-looking, reference their closest milestone
- level_up: pure celebration, name the level and what it means for their goal
- near_level: urgency — name the exact dollar amount left
- behind_pace: honest + one specific, actionable nudge (e.g. "adding $X/month closes the gap in Y weeks")
- portfolio_drop: grounding + perspective, not dismissive of the pain
- streak_milestone: recognise it, immediately challenge the next rung
- re_engagement: warm and curious, zero guilt-tripping
- chat: conversational, use their numbers to answer their question directly`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ message: null, error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: CoachRequest = await req.json();
    const system = buildSystem(body);

    // Build messages array
    const history = body.history ?? [];
    const messages: { role: 'user' | 'assistant'; content: string }[] =
      body.trigger === 'chat' && history.length > 0
        ? history
        : [{ role: 'user', content: 'Generate my coaching message for today.' }];

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 220,
      system,
      messages,
    });

    const message = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return new Response(JSON.stringify({ message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ message: null, error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
