import { useGameStore } from '@/store/useGameStore';
import { Onboarding } from '@/components/Onboarding/Onboarding';
import { ArenaDashboard } from '@/components/Arena/ArenaDashboard';

export default function App() {
  const onboardingComplete = useGameStore(s => s.onboardingComplete);
  return onboardingComplete ? <ArenaDashboard /> : <Onboarding />;
}
