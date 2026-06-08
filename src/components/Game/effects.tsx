import { useEffect, useRef, useState } from 'react';

/* ══════════════════════════════════════════════════════════════════════════════
   useCountUp — animate a number toward a target with easing
   ══════════════════════════════════════════════════════════════════════════════ */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const startTs = performance.now();
    const delta = target - from;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(from + delta * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else { fromRef.current = target; setVal(target); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return val;
}

/* ══════════════════════════════════════════════════════════════════════════════
   CoinBurst — sprays coins outward+up from center when `fireKey` increments.
   `intensity` scales how many coins fly (bigger gains = bigger flex).
   ══════════════════════════════════════════════════════════════════════════════ */
interface Burst { id: number; coins: { dx: number; dy: number; rot: number; dur: number; emoji: string; size: number }[]; }

const COINS = ['🪙', '💰', '💵', '🤑', '✨', '💸'];

export function CoinBurst({ fireKey, intensity = 1 }: { fireKey: number; intensity?: number }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const last = useRef(fireKey);

  useEffect(() => {
    if (fireKey === last.current) return;
    last.current = fireKey;
    if (fireKey === 0) return;

    const n = Math.min(36, Math.round(14 + intensity * 10));
    const coins = Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n + (i % 3) * 0.3;
      const power = 90 + (i % 5) * 50;
      return {
        dx: Math.cos(angle) * power,
        dy: Math.sin(angle) * power - 160,      // bias upward
        rot: (i % 2 ? 1 : -1) * (180 + (i % 4) * 120),
        dur: 0.9 + (i % 5) * 0.18,
        emoji: COINS[i % COINS.length],
        size: 18 + (i % 4) * 8,
      };
    });
    const id = fireKey;
    setBursts(b => [...b, { id, coins }]);
    const t = setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 2000);
    return () => clearTimeout(t);
  }, [fireKey, intensity]);

  return (
    <div className="cc-burst-layer" aria-hidden>
      {bursts.map(b => (
        <div key={b.id} className="cc-burst-origin">
          {b.coins.map((c, i) => (
            <span key={i} className="cc-burst-coin"
              style={{
                fontSize: c.size,
                animationDuration: `${c.dur}s`,
                // @ts-expect-error custom props
                '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--rot': `${c.rot}deg`,
              }}>
              {c.emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
