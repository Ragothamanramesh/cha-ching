// Vercel Edge Function — Kai AI Coach
// Uses Google Gemini 1.5 Flash (free tier: 15 RPM, 1M tokens/day)
// Set GEMINI_API_KEY in Vercel → Settings → Environment Variables

export const config = { runtime: 'edge' };

interface KaiChatMessage { role: 'user' | 'assistant'; content: string; }

interface CoachRequest {
  name: string;
  avatarName?: string;
  avatarVibe?: string;
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
    c.paceStatus === 'ahead'  ? `${c.daysAheadOrBehind} days ahead of pace` :
    c.paceStatus === 'behind' ? `${c.daysAheadOrBehind} days behind pace` :
    'right on track';

  const firstName = c.name.split(' ')[0];

  return `You are Kai — a personal finance hype person inside Cha-Ching, a money game for Gen Z.

Think: smart friend who actually knows money stuff but talks like a real person, not a LinkedIn post. You're honest, direct, occasionally funny, and never corporate.

USER
Name: ${firstName}
${c.avatarName ? `Avatar archetype: ${c.avatarName} — "${c.avatarVibe}" (reference this personality when you roast or hype them)` : ''}
Goal: ${c.goalTitle} — target ${fmt(c.targetAmount)} in ${c.timelineYears}yr${c.timelineYears !== 1 ? 's' : ''}

THEIR CURRENT SITUATION
Portfolio: ${fmt(c.portfolioValue)} (${c.portfolioChangePct > 0 ? '+' : ''}${c.portfolioChangePct.toFixed(1)}% change)
Era: ${c.currentLevel}/${c.totalLevels} — "${c.currentLevelName}"
Next era: "${c.nextLevelName ?? 'final goal'}" — ${fmt(c.amountToNextLevel)} away
Progress to next era: ${c.progressPercent.toFixed(0)}%
Days to next era at current pace: ${c.daysToNextLevel === 999 ? 'unclear' : `~${c.daysToNextLevel}d`}
Pace: ${pace}
Streak: ${c.loginStreak} days (best: ${c.bestStreak})
Days since last update: ${c.daysSinceLastUpdate}

TRIGGER: ${c.trigger}
${c.trigger === 'near_level'       ? `${firstName} is >90% to the next era. hype them up, make it feel imminent.` : ''}
${c.trigger === 'streak_milestone' ? `${firstName} just hit a ${c.loginStreak}-day streak. celebrate it like a real win.` : ''}
${c.trigger === 'portfolio_drop'   ? `portfolio dropped. be honest about it but keep them moving forward.` : ''}
${c.trigger === 'behind_pace'      ? `behind pace. name one concrete thing they can do today.` : ''}
${c.trigger === 're_engagement'    ? `hasn't updated in ${c.daysSinceLastUpdate} days. welcome back, no guilt trip.` : ''}
${c.trigger === 'daily'            ? `daily check-in. say something specific to their actual data, not generic.` : ''}
${c.trigger === 'chat'             ? `they're talking to you. answer directly like a real conversation.` : ''}

VOICE RULES — non-negotiable
- Lowercase is fine. Short sentences. Real energy.
- Use their name once, naturally — not at the start of every message.
- Reference actual numbers and era names from their data. No generic platitudes.
- Never: "That's wonderful!", "I'm so proud!", "Remember every journey...", "Great progress!"
- Emojis: 1-2 max, only if they actually add something (💸🔥👑✨ work. 🌟💯🙌 don't.)
- "fr", "rn", "ur", "lowkey", "no cap" — use naturally, not forced.
- For daily/trigger: 1-3 sentences MAX. Stop there.
- For chat: conversational length. Answer the actual question.
- Never give specific buy/sell advice. Focus on habits and behavior.
- If they ask something financial you can't answer reliably, just say so honestly.`;
}

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

export default async function handler(req: Request): Promise<Response> {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' };

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  // Vercel Edge Runtime exposes env vars via process.env
  const apiKey: string | undefined = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { message: "kai is offline rn — redeploy after adding GEMINI_API_KEY in Vercel env vars 👀" },
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
