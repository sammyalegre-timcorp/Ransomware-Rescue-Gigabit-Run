import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { soundEngine } from '../../services/sound';
import { CheckCircle2, Zap, Wifi, Volume2, VolumeX } from 'lucide-react';

interface ReadyCheckModalProps {
  characterId: CharacterId;
  playerName?: string;
  onConfirmReady: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const ReadyCheckModal: React.FC<ReadyCheckModalProps> = ({
  characterId,
  playerName,
  onConfirmReady,
  isMuted,
  onToggleSound
}) => {
  const char = CHARACTERS[characterId];

  const handleReady = () => {
    soundEngine.playClick();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    onConfirmReady();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-5 text-center shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in duration-200 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-1.5 text-xs font-mono text-cyan-400 font-bold mb-2">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
            </button>
          )}
        </div>

        <div className="my-1 flex justify-center scale-85 sm:scale-95">
          <CharacterAvatar characterId={characterId} size="md" glow={true} />
        </div>

        <div className="pt-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 mb-1.5 uppercase tracking-wider">
            RANSOMWARE RESCUE // SYSTEM CHECK
          </span>

          <h2 className="text-lg sm:text-xl font-black italic font-['Chakra_Petch'] text-slate-100">
            Are you ready?
          </h2>

          <p className="text-xs text-slate-300 mt-1 font-mono">
            Protocol <span className="text-cyan-400 font-bold">{playerName || char.name}</span>, prepare to pump emergency bandwidth!
          </p>

          <p className="text-[10px] text-slate-400 mt-0.5">
            Tap rapidly to send emergency patch data packets to the core server.
          </p>

          <div className="mt-3">
            <button
              onClick={handleReady}
              className="w-full py-2.5 sm:py-3 rounded-xl font-black font-['Chakra_Petch'] text-sm sm:text-base tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              YES, I'M READY!
              <Zap className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
