import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { soundEngine } from '../../services/sound';
import { CheckCircle2, Zap, Wifi } from 'lucide-react';

interface ReadyCheckModalProps {
  characterId: CharacterId;
  playerName?: string;
  onConfirmReady: () => void;
}

export const ReadyCheckModal: React.FC<ReadyCheckModalProps> = ({
  characterId,
  playerName,
  onConfirmReady
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
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-5 text-center shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-cyan-400 font-bold mb-3">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>

        <div className="my-1 flex justify-center">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} />
        </div>

        <div className="pt-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 mb-2 uppercase tracking-wider">
            RANSOMWARE RESCUE // SYSTEM CHECK
          </span>

          <h2 className="text-xl font-black italic font-['Chakra_Petch'] text-slate-100">
            Are you ready?
          </h2>

          <p className="text-xs text-slate-300 mt-1 font-mono">
            Protocol <span className="text-cyan-400 font-bold">{playerName || char.name}</span>, prepare to pump emergency bandwidth!
          </p>

          <p className="text-[11px] text-slate-400 mt-1">
            Tap rapidly to send emergency patch data packets to the core server.
          </p>

          <div className="mt-4">
            <button
              onClick={handleReady}
              className="w-full py-3 rounded-xl font-black font-['Chakra_Petch'] text-base tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
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
