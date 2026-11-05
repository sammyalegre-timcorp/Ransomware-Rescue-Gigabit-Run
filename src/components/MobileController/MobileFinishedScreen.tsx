import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CharacterId, LiveRaceDoc } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { Trophy, Medal, Flag, Sparkles, Wifi } from 'lucide-react';

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
  const finishTime = slot?.finishTime ? (slot.finishTime / 1000).toFixed(2) : '28.40';

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
        label: '1ST PLACE // CORE SERVER SECURED!',
        icon: <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />,
        bg: 'from-amber-500/20 via-yellow-500/30 to-amber-600/40 border-amber-400 text-amber-300'
      };
    }
    if (rank === 2) {
      return {
        label: '2ND PLACE // BACKUP DEPLOYED',
        icon: <Medal className="w-7 h-7 text-slate-300" />,
        bg: 'from-slate-400/20 via-slate-300/30 to-slate-500/40 border-slate-300 text-slate-200'
      };
    }
    if (rank === 3) {
      return {
        label: '3RD PLACE // SYSTEM RECOVERED',
        icon: <Medal className="w-7 h-7 text-amber-600" />,
        bg: 'from-amber-700/20 via-amber-600/30 to-amber-800/40 border-amber-600 text-amber-400'
      };
    }
    return {
      label: '4TH PLACE FINISHER',
      icon: <Flag className="w-7 h-7 text-slate-400" />,
      bg: 'from-slate-800/40 to-slate-900 border-slate-700 text-slate-300'
    };
  };

  const badge = getRankBadge();

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto text-center select-none overflow-hidden">
      {/* Top Banner with "Presented by TIM" */}
      <header className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold uppercase">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          PATCH DEPLOYED
        </div>
      </header>

      {/* Character Identity */}
      <div className="shrink-0 flex flex-col items-center my-1">
        <div className="scale-90 my-1">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} />
        </div>
        <h1 className="text-xl font-black italic font-['Chakra_Petch'] text-slate-100">
          {char.name}
        </h1>
        <p className="text-xs font-mono text-cyan-400">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Placement Card */}
      <div
        className={`my-auto rounded-2xl border-2 p-4 bg-gradient-to-b ${badge.bg} shadow-xl flex flex-col items-center`}
      >
        <div className="mb-1">{badge.icon}</div>
        <div className="text-base font-black font-['Chakra_Petch'] tracking-wider mb-1">
          {badge.label}
        </div>
        <div className="text-3xl font-mono font-black text-white">
          #{rank}
        </div>
        <div className="mt-2 text-xs font-mono text-slate-300">
          Transfer Time: <strong className="text-emerald-400">{finishTime}s</strong>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          Emergency Patch Data: {slot?.tapCount?.toLocaleString() || '1,000'} MB
        </div>
      </div>

      {/* Footer Instructions */}
      <footer className="shrink-0 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2.5 text-slate-300 text-[11px] font-mono">
        <p className="text-cyan-300 font-bold mb-0.5">
          📺 Look up at the shared main host display!
        </p>
        <p className="text-slate-400 text-[10px]">
          The official victory podium ceremony is now streaming on the big screen.
        </p>
      </footer>
    </div>
  );
};
