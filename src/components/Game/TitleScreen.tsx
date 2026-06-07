import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CoinRain } from './CoinRain';
import * as sfx from '@/utils/sound';
import { primeVoices } from '@/utils/voice';

export function TitleScreen() {
  const { setPhase, onboardingComplete } = useGameStore();
  const [entered, setEntered] = useState(false);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 100); return () => clearTimeout(t); }, []);

  const start = () => {
    sfx.primeAudio();
    primeVoices();
    sfx.chaChing();
    // Returning players skip the story and drop straight into their world
    setTimeout(() => setPhase(onboardingComplete ? 'world' : 'intro'), 350);
  };

  return (
    <div className="cc-title cc-bg" onClick={start}>
      <CoinRain count={18} />

      {/* Vignette */}
      <div className="cc-title-vignette" />

      <div className={`cc-title-inner ${entered ? 'cc-title-in' : ''}`}>
        {/* Coin logo */}
        <div className="cc-title-coin cc-float">🪙</div>

        {/* Wordmark */}
        <h1 className="cc-title-word">
          <span className="cc-title-cha">CHA</span>
          <span className="cc-title-dash">-</span>
          <span className="cc-title-ching">CHING</span>
        </h1>

        <p className="cc-title-tag">the sound your money makes</p>

        {/* Press to start */}
        <div className="cc-title-start cc-pulse-soft">
          {onboardingComplete ? '▶ tap to continue' : '▶ tap to begin'}
        </div>

        <p className="cc-title-sub">
          {onboardingComplete ? 'welcome back. the grind continues.' : 'a money game · turn ur portfolio into a quest'}
        </p>
      </div>

      <div className="cc-title-footer">🔊 sound on · best with audio</div>
    </div>
  );
}
