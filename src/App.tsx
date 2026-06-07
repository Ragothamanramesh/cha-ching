import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Onboarding } from '@/components/Onboarding/Onboarding';
import { ArenaDashboard } from '@/components/Arena/ArenaDashboard';

export default function App() {
  const onboardingComplete = useGameStore(s => s.onboardingComplete);
  const theme = useGameStore(s => s.theme);

  // Sync persisted theme to <html> on first load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return onboardingComplete ? <ArenaDashboard /> : <Onboarding />;
}
