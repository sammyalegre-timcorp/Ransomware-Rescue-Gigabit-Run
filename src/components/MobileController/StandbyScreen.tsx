import React, { useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { startCountdown } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Flame, Play, ShieldAlert, Radio, Users, Wifi, Volume2, VolumeX } from 'lucide-react';

interface StandbyScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const StandbyScreen: React.FC<StandbyScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  settings,
  isMuted,
  onToggleSound
}) => {
  const char = CHARACTERS[characterId];
  const [hasStartedCountdown, setHasStartedCountdown] = useState(false);

  const readyRacers = Object.values(liveRace.slots).filter((s) => s.assigned && s.isReady).length;
  const targetMB = (liveRace.targetTaps || settings.requiredTaps || 1000).toLocaleString();

  const handleStartGame = async () => {
    soundEngine.playClick();
    setHasStartedCountdown(true);
    await startCountdown(settings.countdownDuration, liveRace.targetTaps || settings.requiredTaps);
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-2 sm:p-3 select-none overflow-hidden max-w-md mx-auto text-center">
      {/* Top Standby Header with "Presented by TIM" and integrated audio button */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 shadow-sm">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold">
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
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-spin" />
            STANDBY
          </div>
        </div>
      </header>

      {/* Character Identity */}
      <div className="shrink-0 flex flex-col items-center my-0.5">
        <div className="scale-65 sm:scale-75 my-0">
          <CharacterAvatar characterId={characterId} size="md" glow={true} />
        </div>
        <h1 className="text-sm sm:text-base font-black italic font-['Chakra_Petch'] text-slate-100">
          {char.name}
        </h1>
        <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Game Instruction Box - Compact and perfectly fitted */}
      <div className="shrink-0 bg-slate-900/90 border border-red-500/30 rounded-xl p-2 sm:p-2.5 text-left shadow-lg my-0.5">
        <div className="flex items-center gap-1.5 text-red-400 font-mono text-[9px] sm:text-[10px] font-bold mb-1 uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
          CRITICAL MISSION BRIEFING
        </div>
        <p className="text-[9px] sm:text-[10px] text-slate-300 font-sans leading-tight">
          A ransomware exploit has breached the network. The IT team dispatches 4 AI Security Protocols to push a 1 Terabyte emergency patch to the core server. Because bandwidth is limited, only the first protocol to reach the server can lock it down and save the company.
        </p>

        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
          <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 font-mono mb-0.5">
            THE OBJECTIVE:
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-300 font-sans leading-tight">
            Tap rapidly to pump bandwidth (Mbps). The first player to transfer <strong className="text-cyan-400 font-bold">{targetMB} MB</strong> deploys the patch, secures the network, and wins the match.
          </p>
        </div>
      </div>

      {/* Bottom Start Controls - Always completely visible with ample breathing room */}
      <footer className="shrink-0 mt-0.5 pt-0.5 pb-2">
        <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-slate-400 mb-1">
          <Users className="w-3 h-3 text-cyan-400" />
          <span>{readyRacers} Protocols Ready in Lobby</span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={hasStartedCountdown}
          className="w-full py-2.5 px-4 rounded-xl font-black font-['Chakra_Petch'] text-sm tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
          START GAME?
          <Play className="w-3.5 h-3.5 fill-slate-950" />
        </button>
        <p className="text-[8.5px] font-mono text-slate-500 mt-0.5">
          Presented by TIM • Triggers {settings.countdownDuration || 5}s countdown on your screen
        </p>
      </footer>
    </div>
  );
};
