import React, { useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { startCountdown } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Flame, Play, ShieldAlert, Radio, Users, Wifi } from 'lucide-react';

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
  const targetMB = (liveRace.targetTaps || settings.requiredTaps || 1000).toLocaleString();

  const handleStartGame = async () => {
    soundEngine.playClick();
    setHasStartedCountdown(true);
    await startCountdown(settings.countdownDuration, liveRace.targetTaps || settings.requiredTaps);
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none overflow-hidden max-w-md mx-auto text-center">
      {/* Top Standby Header with "Presented by TIM" */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
          <Radio className="w-3 h-3 text-emerald-400 animate-spin" />
          STANDBY
        </div>
      </header>

      {/* Character Identity */}
      <div className="shrink-0 flex flex-col items-center my-1">
        <div className="scale-90 my-0.5">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} />
        </div>
        <h1 className="text-xl font-black italic font-['Chakra_Petch'] text-slate-100 mt-1">
          {char.name}
        </h1>
        <p className="text-[11px] font-mono text-cyan-400">
          Pilot: {playerName || 'Security Protocol'}
        </p>
      </div>

      {/* Game Instruction Box with exact user text */}
      <div className="flex-1 min-h-0 bg-slate-900/90 border border-red-500/30 rounded-xl p-3 text-left shadow-lg overflow-y-auto my-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-red-400 font-mono text-[11px] font-bold mb-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            CRITICAL MISSION BRIEFING
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            A ransomware exploit has breached the network. The IT team dispatches 4 AI Security Protocols to push a 1 Terabyte emergency patch to the core server. Because bandwidth is limited, only the first protocol to reach the server can lock it down and save the company.
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-bold text-amber-400 font-mono mb-0.5">
            THE OBJECTIVE:
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Tap rapidly to pump bandwidth (Mbps). The first player to transfer <strong className="text-cyan-400">{targetMB} MB</strong> deploys the patch, secures the network, and wins the match.
          </p>
        </div>
      </div>

      {/* Bottom Start Controls */}
      <footer className="shrink-0 mt-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>{readyRacers} Protocols Ready in Lobby</span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={hasStartedCountdown}
          className="w-full py-3 px-4 rounded-xl font-black font-['Chakra_Petch'] text-base tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
          START GAME?
          <Play className="w-4 h-4 fill-slate-950" />
        </button>
        <p className="text-[10px] font-mono text-slate-500 mt-1">
          Presented by TIM • Triggers 5s countdown on your screen
        </p>
      </footer>
    </div>
  );
};
