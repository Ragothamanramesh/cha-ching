import { useMemo } from 'react';

/* Falling coins/money emoji — pure CSS animation, GPU-friendly.
   Used as ambient background juice on the title + world screens. */
export function CoinRain({ count = 14, emojis = ['🪙', '💰', '💵', '🤑', '✨'] }: { count?: number; emojis?: string[] }) {
  const coins = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: (i * 97) % 100,                       // deterministic spread (no Math.random in render churn)
      delay: (i * 0.7) % 8,
      dur: 6 + ((i * 1.3) % 6),
      size: 14 + ((i * 7) % 22),
      emoji: emojis[i % emojis.length],
      drift: ((i % 5) - 2) * 14,
    })), [count, emojis]);

  return (
    <div className="cc-coinrain" aria-hidden>
      {coins.map(c => (
        <span key={c.id} className="cc-coin"
          style={{
            left: `${c.left}%`,
            fontSize: c.size,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            // @ts-expect-error custom prop
            '--drift': `${c.drift}px`,
          }}>
          {c.emoji}
        </span>
      ))}
    </div>
  );
}
