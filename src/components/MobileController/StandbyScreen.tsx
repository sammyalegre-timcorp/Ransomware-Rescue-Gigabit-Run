import React, { useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { startCountdown } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Flame, Play, Info, Radio, Users } from 'lucide-react';

interface StandbyScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
}

export const StandbyScreen: React.FC<StandbyScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  settings
}) => {
  const char = CHARACTERS[characterId];
  const [hasStartedCountdown, setHasStartedCountdown] = useState(false);

  const readyRacers = Object.values(liveRace.slots).filter((s) => s.assigned && s.isReady).length;
  const targetTaps = liveRace.targetTaps || settings.requiredTaps || 1000;

  const handleStartGame = async () => {
    soundEngine.playClick();
    setHasStartedCountdown(true);
    await startCountdown(settings.countdownDuration, targetTaps);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 max-w-md mx-auto text-center">
      {/* Top Standby Beacon */}
      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold mb-4 animate-pulse">
          <Radio className="w-4 h-4 animate-spin text-emerald-400" />
          STANDBY MODE // SYNCED TO HOST
        </div>

        <CharacterAvatar characterId={characterId} size="xl" glow={true} />

        <h1 className="text-2xl font-black italic font-['Chakra_Petch'] text-slate-100 mt-3">
          {char.name}
        </h1>
        <p className="text-xs font-mono text-cyan-400">
          Pilot: {playerName || 'Ready Racer'}
        </p>
      </div>

      {/* Game Instructions Box */}
      <div className="my-6 bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 text-left shadow-lg">
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold mb-3 uppercase tracking-wider">
          <Info className="w-4 h-4 text-cyan-400" />
          MISSION BRIEFING & INSTRUCTIONS
        </div>
        <ul className="space-y-3 text-xs md:text-sm text-slate-300 font-sans">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">⚡ 1.</span>
            <span>
              <strong className="text-slate-100">Tap as fast as you can!</strong> Every tap sends a data packet to propel your racer.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold shrink-0">🛑 2.</span>
            <span>
              <strong className="text-slate-100">Stop tapping = stop moving.</strong> Momentum drops to zero immediately when you pause.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">🏁 3.</span>
            <span>
              <strong className="text-slate-100">Race Distance:</strong> Reach{' '}
              <span className="text-cyan-400 font-bold">{targetTaps.toLocaleString()} Taps</span> to cross the finish line!
            </span>
          </li>
        </ul>
      </div>

      {/* Racers Status */}
      <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400 mb-4">
        <Users className="w-4 h-4 text-cyan-400" />
        <span>{readyRacers} Racers Ready in Lobby</span>
      </div>

      {/* "Start Game?" Trigger Button */}
      <div className="mb-4">
        <button
          onClick={handleStartGame}
          disabled={hasStartedCountdown}
          className="w-full py-4 px-6 rounded-2xl font-black font-['Chakra_Petch'] text-lg tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Flame className="w-6 h-6 text-amber-200 animate-pulse" />
          START GAME?
          <Play className="w-5 h-5 fill-slate-950" />
        </button>
        <p className="text-[11px] font-mono text-slate-400 mt-2">
          Clicking "Start Game" initiates the 5-second countdown on your mobile screen!
        </p>
      </div>
    </div>
  );
};
