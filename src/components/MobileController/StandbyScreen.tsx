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
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden max-w-md mx-auto text-center">
      {/* Top Standby Header with "Presented by TIM" and integrated audio button */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-cyan-400 font-bold">
          <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shadow-sm">
            <Radio className="w-3 h-3 text-emerald-400 animate-spin" />
            STANDBY
          </div>
        </div>
      </header>

      {/* Middle Content Wrapper - Expands and distributes evenly */}
      <div className="flex-1 min-h-0 flex flex-col justify-evenly py-2">
        {/* Character Identity - Big, Bold & Impactful */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="transform scale-110 sm:scale-125 my-1 transition-transform">
            <CharacterAvatar characterId={characterId} size="lg" glow={true} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic font-['Chakra_Petch'] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] mt-1">
            {char.name}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-cyan-500/30 text-xs sm:text-sm font-mono font-bold text-cyan-300 mt-1">
            <span>Pilot:</span>
            <span className="text-white">{playerName || 'Security Protocol'}</span>
          </div>
        </div>

        {/* Mission & Objective Briefing Card - Substantial & High-Fidelity */}
        <div className="shrink-0 bg-slate-900/95 border-2 border-cyan-500/30 rounded-2xl p-3 sm:p-4 text-left shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              CRITICAL MISSION BRIEFING
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              PRIORITY 1
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
            A ransomware exploit has breached the network. Push the 1TB emergency patch to lock down the core server before data is encrypted!
          </p>

          {/* Objective Telemetry Box */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono mb-1 flex items-center gap-1.5">
              <span>{readyRacers === 1 ? '🎯 SOLO TIME ATTACK OBJECTIVE:' : '🎯 MULTIPLAYER OBJECTIVE:'}</span>
            </div>

            {readyRacers === 1 ? (
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                  Tap rapidly to pump gigabit bandwidth. Transfer <strong className="text-cyan-300 font-black">{targetMB} MB</strong> before time expires to achieve <strong className="text-emerald-400 font-black">SUCCESS</strong>!
                </p>
                {/* Visual Target Pills */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
                  <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg p-1.5">
                    <span className="block text-[10px] text-slate-400 uppercase">Target Data</span>
                    <span className="text-sm sm:text-base font-black text-cyan-300">{targetMB} MB</span>
                  </div>
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg p-1.5">
                    <span className="block text-[10px] text-slate-400 uppercase">Time to Beat</span>
                    <span className="text-sm sm:text-base font-black text-amber-300">{settings.soloTimeLimit || 15}s</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                Tap rapidly to pump bandwidth (Mbps). The first protocol to transfer <strong className="text-cyan-300 font-bold">{targetMB} MB</strong> deploys the patch, secures the core server, and wins the match!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Start Controls - Substantially Enlarged & Prominent */}
      <footer className="shrink-0 mt-auto pt-2 pb-1">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-slate-300 mb-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">{readyRacers} Protocol{readyRacers === 1 ? '' : 's'} Ready</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300">{readyRacers === 1 ? 'Solo Time Trial' : 'Multiplayer Lobby'}</span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={hasStartedCountdown}
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl font-black font-['Chakra_Petch'] text-lg sm:text-xl tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Flame className="w-6 h-6 text-amber-200 animate-pulse" />
          <span>{readyRacers === 1 ? 'START SOLO TIME TRIAL' : 'START GAME'}</span>
          <Play className="w-5 h-5 fill-slate-950" />
        </button>

        <p className="text-[10px] sm:text-xs font-mono text-slate-400 mt-2">
          Presented by TIM • Triggers {settings.countdownDuration || 5}s countdown on your screen
        </p>
      </footer>
    </div>
  );
};
