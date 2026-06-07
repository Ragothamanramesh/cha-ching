import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { TitleScreen } from '@/components/Game/TitleScreen';
import { StoryIntro } from '@/components/Game/StoryIntro';
import { AvatarPicker } from '@/components/Game/AvatarPicker';
import { GoalFlow } from '@/components/Game/GoalFlow';
import { World } from '@/components/Game/World';
import { isMuted, setMuted } from '@/utils/sound';
import { isVoiceEnabled, setVoiceEnabled, primeVoices } from '@/utils/voice';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const theme = useGameStore(s => s.theme);
  const soundOn = useGameStore(s => s.soundOn);
  const voiceOn = useGameStore(s => s.voiceOn);

  // Sync persisted prefs on boot
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setMuted(!soundOn);
    isMuted();
    setVoiceEnabled(voiceOn);
    isVoiceEnabled();
    primeVoices();
  }, [soundOn, voiceOn]);

  switch (phase) {
    case 'title':  return <TitleScreen />;
    case 'intro':  return <StoryIntro />;
    case 'avatar': return <AvatarPicker />;
    case 'goal':
    case 'numbers':
    case 'reveal': return <GoalFlow />;
    case 'world':  return <World />;
    default:       return <TitleScreen />;
  }
}
