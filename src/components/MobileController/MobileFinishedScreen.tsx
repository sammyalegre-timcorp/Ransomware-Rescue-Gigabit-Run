import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CharacterId, LiveRaceDoc } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { Trophy, Medal, Flag, Sparkles } from 'lucide-react';

interface MobileFinishedScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
}

export const MobileFinishedScreen: React.FC<MobileFinishedScreenProps> = ({
  characterId,
  playerName,
  liveRace
}) => {
  const char = CHARACTERS[characterId];
  const slot = liveRace.slots[characterId];

  const rank = slot?.finishRank || 1;
  const finishTime = slot?.finishTime ? (slot.finishTime / 1000).toFixed(2) : '32.40';

  useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  const getRankBadge = () => {
    if (rank === 1) {
      return {
        label: '1ST PLACE CHAMPION',
        icon: <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />,
        bg: 'from-amber-500/20 via-yellow-500/30 to-amber-600/40 border-amber-400 text-amber-300'
      };
    }
    if (rank === 2) {
      return {
        label: '2ND PLACE RUNNER-UP',
        icon: <Medal className="w-8 h-8 text-slate-300" />,
        bg: 'from-slate-400/20 via-slate-300/30 to-slate-500/40 border-slate-300 text-slate-200'
      };
    }
    if (rank === 3) {
      return {
        label: '3RD PLACE PODIUM',
        icon: <Medal className="w-8 h-8 text-amber-600" />,
        bg: 'from-amber-700/20 via-amber-600/30 to-amber-800/40 border-amber-600 text-amber-400'
      };
    }
    return {
      label: '4TH PLACE FINISHER',
      icon: <Flag className="w-8 h-8 text-slate-400" />,
      bg: 'from-slate-800/40 to-slate-900 border-slate-700 text-slate-300'
    };
  };

  const badge = getRankBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 max-w-md mx-auto text-center">
      {/* Top Banner */}
      <div className="flex flex-col items-center mt-6">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold mb-4 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          RACE COMPLETED // TELEMETRY LOGGED
        </div>

        <CharacterAvatar characterId={characterId} size="xl" glow={true} />

        <h1 className="text-2xl font-black italic font-['Chakra_Petch'] text-slate-100 mt-3">
          {char.name}
        </h1>
        <p className="text-xs font-mono text-cyan-400">
          Pilot: {playerName || 'Ready Racer'}
        </p>
      </div>

      {/* Placement Card */}
      <div
        className={`my-6 rounded-3xl border-2 p-6 bg-gradient-to-b ${badge.bg} shadow-2xl flex flex-col items-center`}
      >
        <div className="mb-2">{badge.icon}</div>
        <div className="text-xl font-black font-['Chakra_Petch'] tracking-wider mb-2">
          {badge.label}
        </div>
        <div className="text-3xl font-mono font-black text-white">
          #{rank}
        </div>
        <div className="mt-3 text-sm font-mono text-slate-300">
          Finish Time: <strong className="text-emerald-400">{finishTime}s</strong>
        </div>
        <div className="text-xs font-mono text-slate-400 mt-1">
          Total Taps: {slot?.tapCount?.toLocaleString() || '1,000'}
        </div>
      </div>

      {/* Look Up at Main Display Alert */}
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 text-slate-300 text-xs font-mono">
        <p className="text-cyan-300 font-bold mb-1">
          📺 Look up at the shared main host display!
        </p>
        <p className="text-slate-400">
          The official victory podium ceremony and podium rankings are now streaming on the big screen.
        </p>
      </div>

      <div className="text-center text-[11px] font-mono text-slate-500 mt-4">
        Keep this screen open for the next race!
      </div>
    </div>
  );
};
