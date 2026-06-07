import { useEffect, useRef, useState } from 'react';
import * as sfx from '@/utils/sound';

interface Props {
  text: string;
  speed?: number;          // ms per character
  startDelay?: number;     // ms before typing begins
  className?: string;
  style?: React.CSSProperties;
  tick?: boolean;          // play typewriter sound
  onDone?: () => void;
  cursor?: boolean;        // show blinking cursor while typing
}

/** Types text out character-by-character with optional audible ticks. */
export function Typewriter({ text, speed = 32, startDelay = 0, className, style, tick = true, onDone, cursor = true }: Props) {
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(false);
  const idx = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown('');
    idx.current = 0;
    let interval: ReturnType<typeof setInterval>;

    const startT = setTimeout(() => {
      setTyping(true);
      interval = setInterval(() => {
        idx.current += 1;
        setShown(text.slice(0, idx.current));
        if (tick && idx.current % 2 === 0) sfx.typeTick();
        if (idx.current >= text.length) {
          clearInterval(interval);
          setTyping(false);
          doneRef.current?.();
        }
      }, speed);
    }, startDelay);

    return () => { clearTimeout(startT); clearInterval(interval); };
  }, [text, speed, startDelay, tick]);

  return (
    <span className={className} style={style}>
      {shown}
      {cursor && typing && <span className="cc-caret">▍</span>}
    </span>
  );
}
