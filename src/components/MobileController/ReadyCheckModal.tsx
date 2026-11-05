import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { soundEngine } from '../../services/sound';
import { CheckCircle2, Zap } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in duration-300">
        {/* Glow Halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} />
        </div>

        <div className="pt-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 mb-3 uppercase tracking-wider">
            PRE-RACE SYSTEM CHECK
          </span>

          <h2 className="text-2xl font-black italic font-['Chakra_Petch'] text-slate-100">
            Are you ready?
          </h2>

          <p className="text-sm text-slate-300 mt-2 font-mono">
            Pilot <span className="text-cyan-400 font-bold">{playerName || char.name}</span>, prepare to overclock your fingers!
          </p>

          <p className="text-xs text-slate-400 mt-2">
            The race requires continuous rapid tapping to propel down the gigabit line.
          </p>

          <div className="mt-6">
            <button
              onClick={handleReady}
              className="w-full py-4 rounded-2xl font-black font-['Chakra_Petch'] text-lg tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              YES, I'M READY!
              <Zap className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
