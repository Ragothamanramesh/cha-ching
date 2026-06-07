// Vercel Edge Function — Kai AI Coach
// Uses Google Gemini 1.5 Flash (free tier: 15 RPM, 1M tokens/day)
// Set GEMINI_API_KEY in Vercel → Settings → Environment Variables

export const config = { runtime: 'edge' };

interface KaiChatMessage { role: 'user' | 'assistant'; content: string; }

interface CoachRequest {
  name: string;
  goalTitle: string;
  goalDescription?: string;
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
  history?: KaiChatMessage[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n/1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function buildSystem(c: CoachRequest): string {
  const pace =
    c.paceStatus === 'ahead'  ? `${c.daysAheadOrBehind} days AHEAD of schedule` :
    c.paceStatus === 'behind' ? `${c.daysAheadOrBehind} days BEHIND schedule` :
    'right on track';

  return `You are Kai, a sharp and warm personal finance coach inside the Cha-Ching app.

USER PROFILE
Name: ${c.name}
Goal: ${c.goalTitle}${c.goalDescription ? ` — "${c.goalDescription}"` : ''}
Target: ${fmt(c.targetAmount)} in ${c.timelineYears} year${c.timelineYears !== 1 ? 's' : ''}

CURRENT STATUS
Portfolio: ${fmt(c.portfolioValue)} (${c.portfolioChangePct > 0 ? '+' : ''}${c.portfolioChangePct.toFixed(1)}% since last update)
Level: ${c.currentLevel}/${c.totalLevels} — "${c.currentLevelName}"
Progress to next level: ${c.progressPercent.toFixed(1)}% (${fmt(c.amountToNextLevel)} away from "${c.nextLevelName ?? 'final goal'}")
Days to next level at current pace: ${c.daysToNextLevel === 999 ? 'unknown' : `~${c.daysToNextLevel} days`}
Pace: ${pace}
Login streak: ${c.loginStreak} days (best: ${c.bestStreak})
Days since portfolio update: ${c.daysSinceLastUpdate}

TRIGGER: ${c.trigger}
${c.trigger === 'near_level'       ? 'User is >90% to the next level — hype them up!' : ''}
${c.trigger === 'streak_milestone' ? `User just hit a ${c.loginStreak}-day streak — celebrate it!` : ''}
${c.trigger === 'portfolio_drop'   ? 'Portfolio dropped — be honest but encouraging.' : ''}
${c.trigger === 'behind_pace'      ? 'User is behind pace — motivate, suggest one concrete action.' : ''}
${c.trigger === 're_engagement'    ? `User hasn't updated in ${c.daysSinceLastUpdate} days — welcome back warmly.` : ''}
${c.trigger === 'daily'            ? 'Daily check-in — be fresh, energetic, specific to their data.' : ''}
${c.trigger === 'chat'             ? 'Conversational reply — answer directly, be concise.' : ''}

RULES
- 1-3 sentences for daily/trigger messages. For chat: conversational, no length limit.
- Use ${c.name}'s first name once, naturally.
- Reference their actual numbers — no generic advice.
- Tone: direct, confident, real friend energy. Never corporate or preachy.
- No asterisks, no markdown. Plain sentences only.
- Never give specific buy/sell investment advice.`;
}

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' };

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  // Read API key from env (Edge runtime exposes env via globalThis)
  const apiKey: string | undefined =
    (typeof (globalThis as Record<string,unknown>)['GEMINI_API_KEY'] === 'string'
      ? (globalThis as Record<string,unknown>)['GEMINI_API_KEY']
      : undefined) as string | undefined;

  if (!apiKey) {
    return Response.json(
      { message: "Kai is offline — add your free GEMINI_API_KEY in Vercel → Settings → Environment Variables to activate coaching." },
      { status: 200, headers: cors }
    );
  }

  let body: CoachRequest;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }

  // Build conversation contents
  const contents: GeminiContent[] = [];
  if (body.trigger === 'chat' && body.history && body.history.length > 0) {
    for (const msg of body.history) {
      contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
    }
  } else {
    contents.push({ role: 'user', parts: [{ text: body.userMessage ?? `Give me a ${body.trigger} message based on my status.` }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: buildSystem(body) }] },
    contents,
    generationConfig: { maxOutputTokens: 220, temperature: 0.85 },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    if (!res.ok) {
      console.error('Gemini error:', await res.text());
      return Response.json({ error: `Gemini ${res.status}` }, { status: 502, headers: cors });
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!message) return Response.json({ error: 'Empty Gemini response' }, { status: 502, headers: cors });

    return Response.json({ message }, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Kai error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500, headers: cors });
  }
}
