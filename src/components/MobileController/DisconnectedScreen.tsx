import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { QrCode, Wifi, RotateCcw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface DisconnectedScreenProps {
  characterId: CharacterId;
  reason?: 'expired_qr' | 'game_ended' | 'slot_cleared' | 'slot_taken';
  isMuted?: boolean;
  onToggleSound?: () => void;
  onRefresh?: () => void;
}

export const DisconnectedScreen: React.FC<DisconnectedScreenProps> = ({
  characterId,
  reason = 'game_ended',
  isMuted,
  onToggleSound,
  onRefresh
}) => {
  const char = CHARACTERS[characterId];

  const getTitle = () => {
    if (reason === 'slot_taken') return 'SLOT ALREADY CLAIMED';
    if (reason === 'expired_qr') return 'QR CODE EXPIRED';
    return 'GAME ENDED // DISCONNECTED';
  };

  const getSubtitle = () => {
    if (reason === 'slot_taken') return 'This Character Is Piloted by Another Player';
    if (reason === 'expired_qr') return 'Please Scan the Live QR on the Host Display';
    return 'New QR Codes Generated for Next Match';
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 text-center select-none overflow-y-auto max-w-md mx-auto">
      {/* Top Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2 bg-slate-900/60 px-2 py-1.5 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
            </button>
          )}
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] font-bold">
            {reason === 'slot_taken' ? 'SLOT BUSY' : 'DISCONNECTED'}
          </span>
        </div>
      </header>

      {/* Main Alert Body */}
      <div className="flex flex-col items-center my-auto py-2">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <QrCode className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center border-2 border-slate-950">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {char && (
          <div className="scale-75 my-1">
            <CharacterAvatar characterId={characterId} size="sm" glow={false} />
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-black italic font-['Chakra_Petch'] text-slate-100 tracking-wide">
          {getTitle()}
        </h2>

        <p className="text-xs text-cyan-400 font-mono mt-1">
          {getSubtitle()}
        </p>

        <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-left space-y-2 max-w-xs shadow-lg">
          {reason === 'slot_taken' ? (
            <>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                • {char?.name || 'This protocol'} is already being piloted by another player in this match.
              </p>
              <p className="text-[11px] text-amber-300 font-mono font-bold leading-relaxed">
                👉 Look at the host screen and scan the QR code for any available protocol!
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                • All mobile devices are automatically disconnected after each game session.
              </p>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                • Fresh, unique QR codes are displayed on the main host screen.
              </p>
              <p className="text-[11px] text-amber-300 font-mono font-bold leading-relaxed">
                👉 Point your phone camera at the screen and scan your protocol's new QR code to play!
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="shrink-0 space-y-2 pb-1">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Check for New Session
          </button>
        )}
        <p className="text-[9px] font-mono text-slate-500">
          Presented by TIM • Gigabit Security Protocol
        </p>
      </footer>
    </div>
  );
};
