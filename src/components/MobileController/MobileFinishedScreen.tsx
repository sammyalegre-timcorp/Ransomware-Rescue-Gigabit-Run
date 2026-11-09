import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CharacterId, LiveRaceDoc } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { Trophy, Medal, Flag, Sparkles, Wifi, Volume2, VolumeX } from 'lucide-react';

interface MobileFinishedScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const MobileFinishedScreen: React.FC<MobileFinishedScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  isMuted,
  onToggleSound
}) => {
  const char = CHARACTERS[characterId];
  const slot = liveRace.slots[characterId];

  const assignedCount = Object.values(liveRace.slots).filter((s) => s.assigned).length;
  const isSoloMode = liveRace.isSoloMode ?? (assignedCount === 1);

  const rank = slot?.finishRank || 1;
  const finishTimeSec = slot?.finishTime ? Number((slot.finishTime / 1000).toFixed(2)) : 0;
  const finishTime = finishTimeSec > 0 ? finishTimeSec.toFixed(2) : '15.00';
  const soloTimeLimit = liveRace.soloTimeLimit || 15;
  const targetMB = liveRace.targetTaps || 1000;
  const isSoloSuccess =
    slot?.outcome === 'SUCCESS' ||
    (finishTimeSec > 0 && finishTimeSec <= soloTimeLimit && (slot?.tapCount || 0) >= targetMB);

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
        icon: <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-bounce" />,
        bg: 'from-amber-500/20 via-yellow-500/30 to-amber-600/40 border-amber-400 text-amber-300'
      };
    }
    if (rank === 2) {
      return {
        label: '2ND PLACE // BACKUP DEPLOYED',
        icon: <Medal className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300" />,
        bg: 'from-slate-400/20 via-slate-300/30 to-slate-500/40 border-slate-300 text-slate-200'
      };
    }
    if (rank === 3) {
      return {
        label: '3RD PLACE // SYSTEM RECOVERED',
        icon: <Medal className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />,
        bg: 'from-amber-700/20 via-amber-600/30 to-amber-800/40 border-amber-600 text-amber-400'
      };
    }
    return {
      label: '4TH PLACE FINISHER',
      icon: <Flag className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />,
      bg: 'from-slate-800/40 to-slate-900 border-slate-700 text-slate-300'
    };
  };

  const badge = getRankBadge();

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 max-w-md mx-auto text-center select-none overflow-y-auto">
      {/* Top Banner with "Presented by TIM" & Integrated Audio Toggle */}
      <header className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2 bg-slate-900/60 px-2 py-1.5 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
            </button>
          )}
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[9px] sm:text-[10px] font-bold uppercase ${
              isSoloMode
                ? isSoloSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {isSoloMode ? (isSoloSuccess ? 'PATCH DEPLOYED' : 'TIME EXCEEDED') : 'PATCH DEPLOYED'}
          </div>
        </div>
      </header>

      {/* Character Identity */}
      <div className="shrink-0 flex flex-col items-center my-0.5">
        <div className="scale-75 sm:scale-85 my-0.5">
          <CharacterAvatar characterId={characterId} size="md" glow={true} />
        </div>
        <h1 className="text-base sm:text-lg font-black italic font-['Chakra_Petch'] text-slate-100">
          {char.name}
        </h1>
        <p className="text-[10px] font-mono text-cyan-400">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Placement Card (Solo Mode vs Multiplayer) */}
      {isSoloMode ? (
        <div
          className={`my-1 rounded-2xl border-2 p-3 sm:p-4 shadow-xl flex flex-col items-center transition-all ${
            isSoloSuccess
              ? 'border-emerald-500/60 bg-gradient-to-b from-slate-900 via-emerald-950/40 to-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
              : 'border-red-500/60 bg-gradient-to-b from-slate-900 via-red-950/40 to-slate-950 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}
        >
          <div
            className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-black tracking-widest uppercase mb-1.5 flex items-center gap-1 ${
              isSoloSuccess
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 animate-bounce'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white animate-pulse'
            }`}
          >
            {isSoloSuccess ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-slate-300 uppercase tracking-wider">
            MISSION RESULT
          </div>
          <div
            className={`text-4xl sm:text-5xl font-black font-['Chakra_Petch'] my-1 tracking-wider ${
              isSoloSuccess
                ? 'bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                : 'bg-gradient-to-r from-red-400 via-rose-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]'
            }`}
          >
            {isSoloSuccess ? 'SUCCESS' : 'FAILED'}
          </div>
          <div className="mt-0.5 text-xs font-mono text-slate-300">
            Transfer Time:{' '}
            <strong className={isSoloSuccess ? 'text-emerald-400' : 'text-red-400'}>
              {finishTimeSec > 0 ? `${finishTime}s` : `${soloTimeLimit}.0s (TIMEOUT)`}
            </strong>{' '}
            / {soloTimeLimit}s
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 bg-slate-950/70 px-2.5 py-0.5 rounded border border-slate-800">
            {isSoloSuccess
              ? 'Core Server locked down and secured from ransomware breach'
              : 'Time limit exceeded before emergency patch completed'}
          </div>
        </div>
      ) : (
        <div
          className={`my-1 rounded-2xl border-2 p-3 sm:p-4 bg-gradient-to-b ${badge.bg} shadow-xl flex flex-col items-center`}
        >
          <div className="mb-0.5">{badge.icon}</div>
          <div className="text-sm sm:text-base font-black font-['Chakra_Petch'] tracking-wider mb-0.5">
            {badge.label}
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            #{rank}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-300">
            Transfer Time: <strong className="text-emerald-400">{finishTime}s</strong>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Emergency Patch Data: {slot?.tapCount?.toLocaleString() || '1,000'} MB
          </div>
        </div>
      )}

      {/* Footer Instructions */}
      <footer className="shrink-0 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2.5 text-slate-300 text-[10px] sm:text-[11px] font-mono">
        <p className="text-cyan-300 font-bold mb-0.5">
          📺 Look up at the shared host display!
        </p>
        <p className="text-slate-400 text-[9px] sm:text-[10px] leading-tight">
          Victory podium ceremony streaming on the main screen. This device will automatically disconnect when the next match begins.
        </p>
      </footer>
    </div>
  );
};
