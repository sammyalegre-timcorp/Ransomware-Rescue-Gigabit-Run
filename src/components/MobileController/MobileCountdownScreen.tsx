import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { setRaceStatus } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Zap, Radio, Wifi } from 'lucide-react';

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
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 text-center select-none overflow-hidden max-w-md mx-auto">
      {/* Top Beacon with "Presented by TIM" */}
      <header className="shrink-0 flex items-center justify-between w-full border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] font-bold">
          <Radio className="w-3 h-3 animate-spin text-cyan-400" />
          DISPATCH PROTOCOL
        </div>
      </header>

      {/* Main Countdown Centerpiece */}
      <div className="flex flex-col items-center my-auto shrink-0">
        <div className="relative mb-3">
          <div className="absolute -inset-8 rounded-full border border-cyan-500/20 animate-ping pointer-events-none" />
          <div className="absolute -inset-4 rounded-full border border-fuchsia-500/30 animate-pulse pointer-events-none" />

          {/* Glowing Circular Number Container */}
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-300"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}25, #020617)`,
              borderColor: secondsLeft > 0 ? char.primaryColor : '#10B981',
              boxShadow: `0 0 50px ${char.glowColor}`
            }}
          >
            {secondsLeft > 0 ? (
              <span className="text-7xl font-black font-['Chakra_Petch'] italic bg-gradient-to-b from-white via-cyan-200 to-cyan-500 bg-clip-text text-transparent transform animate-bounce">
                {secondsLeft}
              </span>
            ) : (
              <span className="text-3xl font-black font-['Chakra_Petch'] italic text-emerald-400 tracking-wider animate-pulse">
                GO!
              </span>
            )}
          </div>
        </div>

        <CharacterAvatar characterId={characterId} size="md" glow={true} stepPhase={secondsLeft} isMoving={true} />

        <h2 className="text-lg font-black italic font-['Chakra_Petch'] mt-2 text-slate-100">
          {char.name}
        </h2>
        <p className="text-[11px] font-mono text-cyan-400">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Bottom Instructions Alert */}
      <footer className="shrink-0 w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 mb-1">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs font-mono mb-0.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          PREPARE YOUR FINGERS!
        </div>
        <p className="text-[10px] text-slate-400 font-mono">
          As soon as countdown hits 0, tap rapidly to pump bandwidth and push the patch!
        </p>
      </footer>
    </div>
  );
};
