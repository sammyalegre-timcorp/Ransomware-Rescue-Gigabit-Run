import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LiveRaceDoc, GameSettings, PodiumWinner } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { resetRaceLobby, archiveRaceHistory } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Trophy, Medal, RotateCcw, Users, ArrowRight, Wifi } from 'lucide-react';

interface PodiumPhaseProps {
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  onOpenAdmin: () => void;
}

export const PodiumPhase: React.FC<PodiumPhaseProps> = ({
  liveRace,
  settings
}) => {
  // Compute ordered winners from slots
  const winners: PodiumWinner[] = Object.values(liveRace.slots)
    .filter((s) => s.assigned || s.tapCount > 0)
    .sort((a, b) => {
      if (a.finishRank > 0 && b.finishRank > 0) return a.finishRank - b.finishRank;
      if (a.finishRank > 0) return -1;
      if (b.finishRank > 0) return 1;
      return b.tapCount - a.tapCount;
    })
    .map((s, idx) => ({
      rank: s.finishRank > 0 ? s.finishRank : idx + 1,
      characterId: s.characterId,
      name: s.playerName || CHARACTERS[s.characterId].name,
      company: s.playerCompany || 'Enterprise Network',
      finishTimeSeconds: s.finishTime ? Number((s.finishTime / 1000).toFixed(2)) : 0,
      tapCount: s.tapCount
    }));

  const firstPlace = winners[0];
  const secondPlace = winners[1];
  const thirdPlace = winners[2];

  useEffect(() => {
    soundEngine.playFinishChime();

    // Trigger confetti fireworks burst!
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00F0FF', '#FF0077', '#00FFA3', '#FFB800']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00F0FF', '#FF0077', '#00FFA3', '#FFB800']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Archive race results to Firestore
    archiveRaceHistory(liveRace.raceId, liveRace.slots, liveRace.targetTaps || settings.requiredTaps);
  }, []);

  const handleRematch = async () => {
    soundEngine.playClick();
    await resetRaceLobby(true); // Keep players connected
  };

  const handleNewRaceLobby = async () => {
    soundEngine.playClick();
    await resetRaceLobby(false); // Clean slate for new lobby
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-5 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header with "Presented by TIM" */}
      <header className="relative z-10 text-center shrink-0 mb-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            CORE SERVER SECURED
          </div>
        </div>

        <h1 className="text-2xl md:text-4xl font-black italic tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-['Chakra_Petch']">
          CHAMPIONS OF THE GIGABIT RUN
        </h1>
        <p className="text-slate-400 font-mono text-xs mt-0.5">
          {settings.gameTitle} • 1 Terabyte Emergency Patch Deployed ({liveRace.targetTaps || settings.requiredTaps} MB)
        </p>
      </header>

      {/* The 3-Tier Podium Display - Proportional & non-scrollable */}
      <div className="relative z-10 flex-1 min-h-0 flex items-end justify-center gap-4 md:gap-8 max-w-4xl mx-auto w-full my-auto pb-2">
        {/* 2nd Place (Silver - Left) */}
        {secondPlace ? (
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="mb-2 text-center shrink-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-400/20 text-slate-300 border border-slate-400/40 mb-1">
                2ND PLACE
              </span>
              <div className="scale-90">
                <CharacterAvatar characterId={secondPlace.characterId} size="md" glow={true} />
              </div>
              <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch'] text-slate-100 mt-1 truncate max-w-[160px]">
                {secondPlace.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono truncate">{secondPlace.company}</p>
              <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                ⏱ {secondPlace.finishTimeSeconds > 0 ? `${secondPlace.finishTimeSeconds}s` : 'DNF'} • {secondPlace.tapCount} MB
              </div>
            </div>
            {/* Pedestal Block */}
            <div className="w-full h-32 md:h-38 bg-gradient-to-t from-slate-900 to-slate-800 border-t-4 border-slate-400 rounded-t-xl flex flex-col items-center justify-center p-2 shadow-[0_0_20px_rgba(148,163,184,0.2)]">
              <Medal className="w-8 h-8 text-slate-300 mb-0.5" />
              <span className="text-3xl md:text-4xl font-black font-['Chakra_Petch'] text-slate-300">2</span>
              <span className="text-[10px] font-mono text-slate-400">SILVER PROTOCOL</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:block" />
        )}

        {/* 1st Place (Gold - Center, Tallest) */}
        {firstPlace && (
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="mb-2 text-center shrink-0">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono font-black bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)] mb-1 animate-bounce">
                <Trophy className="w-3.5 h-3.5" /> 1ST PLACE // CORE SAVIOR
              </span>
              <div className="scale-105 my-0.5">
                <CharacterAvatar characterId={firstPlace.characterId} size="lg" glow={true} />
              </div>
              <h2 className="text-base md:text-xl font-black font-['Chakra_Petch'] text-amber-300 mt-1 truncate max-w-[200px]">
                {firstPlace.name}
              </h2>
              <p className="text-xs text-slate-300 font-mono truncate">{firstPlace.company}</p>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                ⏱ {firstPlace.finishTimeSeconds}s • {firstPlace.tapCount} MB Transferred
              </div>
            </div>
            {/* Pedestal Block */}
            <div className="w-full h-44 md:h-52 bg-gradient-to-t from-amber-950/60 via-slate-900 to-amber-950/40 border-t-4 border-amber-400 rounded-t-xl flex flex-col items-center justify-center p-3 shadow-[0_0_40px_rgba(251,191,36,0.35)]">
              <Trophy className="w-10 h-10 text-amber-400 mb-1 animate-pulse" />
              <span className="text-4xl md:text-5xl font-black font-['Chakra_Petch'] text-amber-400">1</span>
              <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                SERVER DEFENDER
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze - Right) */}
        {thirdPlace ? (
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="mb-2 text-center shrink-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-700/30 text-amber-500 border border-amber-700/50 mb-1">
                3RD PLACE
              </span>
              <div className="scale-85">
                <CharacterAvatar characterId={thirdPlace.characterId} size="md" glow={true} />
              </div>
              <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch'] text-slate-100 mt-1 truncate max-w-[160px]">
                {thirdPlace.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono truncate">{thirdPlace.company}</p>
              <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                ⏱ {thirdPlace.finishTimeSeconds > 0 ? `${thirdPlace.finishTimeSeconds}s` : 'DNF'} • {thirdPlace.tapCount} MB
              </div>
            </div>
            {/* Pedestal Block */}
            <div className="w-full h-24 md:h-30 bg-gradient-to-t from-slate-900 to-slate-800 border-t-4 border-amber-700 rounded-t-xl flex flex-col items-center justify-center p-2 shadow-[0_0_15px_rgba(180,83,9,0.2)]">
              <Medal className="w-7 h-7 text-amber-600 mb-0.5" />
              <span className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-amber-600">3</span>
              <span className="text-[10px] font-mono text-amber-500">BRONZE PROTOCOL</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:block" />
        )}
      </div>

      {/* Action Navigation Footer - NO admin button */}
      <footer className="relative z-10 shrink-0 border-t border-slate-800 pt-2 flex items-center justify-between gap-4">
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <span>Presented by TIM • Ransomware Exploit Neutralized</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRematch}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 font-bold font-['Chakra_Petch'] text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Rematch (Keep Protocols)
          </button>
          <button
            onClick={handleNewRaceLobby}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black font-['Chakra_Petch'] text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Users className="w-3.5 h-3.5 text-slate-950" />
            New Match (Reset Lobby)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
