import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { setRaceStatus } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Zap, Radio, Wifi, Volume2, VolumeX } from 'lucide-react';

interface MobileCountdownScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const MobileCountdownScreen: React.FC<MobileCountdownScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  settings,
  isMuted,
  onToggleSound
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
            const assignedCount = Object.values(liveRace.slots).filter((s) => s.assigned).length;
            const isSoloMode = assignedCount === 1;
            setRaceStatus('racing', {
              startedAt: Date.now(),
              countdownRemaining: 0,
              isSoloMode,
              soloTimeLimit: liveRace.soloTimeLimit || settings.soloTimeLimit || 15
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
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-3 sm:p-4 text-center select-none overflow-hidden max-w-md mx-auto">
      {/* Top Beacon with "Presented by TIM" and integrated audio button */}
      <header className="shrink-0 flex items-center justify-between w-full border-b border-slate-800 pb-2.5 bg-slate-900/80 px-3 py-2 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-cyan-400 font-bold">
          <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold shadow-sm">
            <Radio className="w-3 h-3 animate-spin text-cyan-400" />
            DISPATCH PROTOCOL
          </div>
        </div>
      </header>

      {/* Main Countdown Centerpiece - Substantially Enlarged & High Impact */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-2">
        {/* Giant Glowing Countdown Clock */}
        <div className="relative mb-3 sm:mb-4">
          <div className="absolute -inset-6 rounded-full border-2 border-cyan-500/25 animate-ping pointer-events-none" />
          <div className="absolute -inset-3 rounded-full border-2 border-fuchsia-500/40 animate-pulse pointer-events-none" />

          {/* Glowing Circular Number Container */}
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full flex items-center justify-center border-4 sm:border-6 shadow-2xl transition-all duration-300"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}35, #020617)`,
              borderColor: secondsLeft > 0 ? char.primaryColor : '#10B981',
              boxShadow: `0 0 45px ${char.glowColor}`
            }}
          >
            {secondsLeft > 0 ? (
              <span className="text-6xl sm:text-7xl md:text-8xl font-black font-['Chakra_Petch'] italic bg-gradient-to-b from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent transform animate-bounce drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
                {secondsLeft}
              </span>
            ) : (
              <span className="text-3xl sm:text-4xl md:text-5xl font-black font-['Chakra_Petch'] italic text-emerald-400 tracking-wider animate-pulse drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
                GO!
              </span>
            )}
          </div>
        </div>

        {/* Character Avatar - Prominent with Step Animation */}
        <div className="transform scale-110 sm:scale-125 my-2">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} stepPhase={secondsLeft} isMoving={true} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black italic font-['Chakra_Petch'] mt-2 text-white drop-shadow">
          {char.name}
        </h2>
        <p className="text-xs sm:text-sm font-mono font-bold text-cyan-300 mt-0.5">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Bottom Instructions Alert - Bold, Visible, and Well-Spaced */}
      <footer className="shrink-0 w-full bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-3 sm:p-3.5 mb-1 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm sm:text-base font-['Chakra_Petch'] italic tracking-wide mb-1">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          PREPARE YOUR FINGERS!
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
          As soon as countdown hits 0, tap rapidly to pump bandwidth and push the patch!
        </p>
      </footer>
    </div>
  );
};
