import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { setRaceStatus } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Zap, Radio } from 'lucide-react';

interface MobileCountdownScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
}

export const MobileCountdownScreen: React.FC<MobileCountdownScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  settings
}) => {
  const char = CHARACTERS[characterId];
  const totalDuration = liveRace.countdownRemaining || settings.countdownDuration || 5;
  const [secondsLeft, setSecondsLeft] = useState<number>(totalDuration);

  useEffect(() => {
    soundEngine.playCountdownTick(secondsLeft);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playRaceStart();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 200]);
          }

          // Transition race to racing state!
          if (liveRace.status === 'countdown') {
            setRaceStatus('racing', {
              startedAt: Date.now(),
              countdownRemaining: 0
            });
          }
          return 0;
        }

        const next = prev - 1;
        soundEngine.playCountdownTick(next);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(40);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-6 text-center select-none overflow-hidden max-w-md mx-auto">
      {/* Top Beacon */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold mt-4 animate-pulse">
        <Radio className="w-4 h-4 animate-spin text-cyan-400" />
        START ENGINE PROTOCOL
      </div>

      {/* Main Countdown Centerpiece */}
      <div className="flex flex-col items-center my-auto">
        <div className="relative mb-6">
          {/* Animated concentric pulsing waves */}
          <div className="absolute -inset-10 rounded-full border border-cyan-500/20 animate-ping pointer-events-none" />
          <div className="absolute -inset-5 rounded-full border border-fuchsia-500/30 animate-pulse pointer-events-none" />

          {/* Glowing Circular Number Container */}
          <div
            className="w-44 h-44 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-300"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}25, #020617)`,
              borderColor: secondsLeft > 0 ? char.primaryColor : '#10B981',
              boxShadow: `0 0 60px ${char.glowColor}`
            }}
          >
            {secondsLeft > 0 ? (
              <span className="text-8xl font-black font-['Chakra_Petch'] italic bg-gradient-to-b from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent transform animate-bounce">
                {secondsLeft}
              </span>
            ) : (
              <span className="text-4xl font-black font-['Chakra_Petch'] italic text-emerald-400 tracking-wider animate-pulse">
                GO!
              </span>
            )}
          </div>
        </div>

        <CharacterAvatar characterId={characterId} size="md" glow={true} />

        <h2 className="text-xl font-black italic font-['Chakra_Petch'] mt-3 text-slate-100">
          {char.name}
        </h2>
        <p className="text-xs font-mono text-cyan-400">
          Pilot: {playerName || 'Ready Racer'}
        </p>
      </div>

      {/* Bottom Instructions Alert */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs font-mono mb-1">
          <Zap className="w-4 h-4 text-amber-400" />
          PREPARE YOUR FINGERS!
        </div>
        <p className="text-xs text-slate-400 font-mono">
          As soon as the countdown hits 0, the masher button will unlock! Tap continuously to sprint!
        </p>
      </div>
    </div>
  );
};
