import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { LiveRaceDoc, GameSettings, PodiumWinner } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { resetRaceLobby, archiveRaceHistory } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { calculateSoloScore } from '../../utils/scoring';
import { Trophy, Medal, Wifi, Maximize, Minimize, ShieldCheck, AlertTriangle, CheckCircle, Clock, QrCode, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface PodiumPhaseProps {
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
  onOpenAdmin: () => void;
}

export const PodiumPhase: React.FC<PodiumPhaseProps> = ({
  liveRace,
  settings,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleSound
}) => {
  const [autoResetSeconds, setAutoResetSeconds] = useState<number>(25);

  const assignedCount = Object.values(liveRace.slots).filter((s) => s.assigned).length;
  const isSoloMode = liveRace.isSoloMode ?? (assignedCount === 1);
  const soloTimeLimit = liveRace.soloTimeLimit || settings.soloTimeLimit || 15;
  const targetMB = liveRace.targetTaps || settings.requiredTaps || 1000;

  // Compute ordered winners from slots
  const winners: PodiumWinner[] = Object.values(liveRace.slots)
    .filter((s) => s.assigned || s.tapCount > 0)
    .sort((a, b) => {
      if (a.finishRank > 0 && b.finishRank > 0) return a.finishRank - b.finishRank;
      if (a.finishRank > 0) return -1;
      if (b.finishRank > 0) return 1;
      return b.tapCount - a.tapCount;
    })
    .map((s, idx) => {
      const finishTimeSec = s.finishTime ? Number((s.finishTime / 1000).toFixed(2)) : 0;
      const score = s.score !== undefined
        ? s.score
        : isSoloMode
        ? calculateSoloScore(finishTimeSec, soloTimeLimit)
        : undefined;

      const outcome = s.outcome || (isSoloMode
        ? (finishTimeSec > 0 && finishTimeSec <= soloTimeLimit && s.tapCount >= targetMB ? 'SUCCESS' : 'FAILED')
        : undefined);

      return {
        rank: s.finishRank > 0 ? s.finishRank : idx + 1,
        characterId: s.characterId,
        name: s.playerName || CHARACTERS[s.characterId].name,
        company: s.playerCompany || 'Enterprise Network',
        finishTimeSeconds: finishTimeSec,
        tapCount: s.tapCount,
        score,
        outcome
      };
    });

  const firstPlace = winners[0];
  const secondPlace = winners[1];
  const thirdPlace = winners[2];

  const isSoloSuccess = firstPlace
    ? firstPlace.outcome === 'SUCCESS' ||
      (firstPlace.finishTimeSeconds > 0 &&
       firstPlace.finishTimeSeconds <= soloTimeLimit &&
       firstPlace.tapCount >= targetMB)
    : false;

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
    archiveRaceHistory(liveRace.raceId, liveRace.slots, targetMB, isSoloMode);
  }, []);

  // Auto-advance to next game match, clearing all slots & generating fresh QR codes
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoResetSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetRaceLobby(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartNextGame = async () => {
    soundEngine.playClick();
    await resetRaceLobby(false); // Clean slate: clears all slots and generates brand new raceId
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-5 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header with "Presented by TIM" and Fullscreen button */}
      <header className="relative z-10 text-center shrink-0 mb-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono uppercase tracking-widest ${
              isSoloMode
                ? isSoloSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {isSoloMode ? (
              isSoloSuccess ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  CORE SERVER SECURED
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  TIME EXCEEDED // CORE BREACHED
                </>
              )
            ) : (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                CORE SERVER SECURED
              </>
            )}
          </div>
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors shadow-sm"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-[11px] cursor-pointer transition-colors shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-black italic tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-['Chakra_Petch']">
          {isSoloMode ? 'SOLO TIME TRIAL EVALUATION' : 'CHAMPIONS OF THE GIGABIT RUN'}
        </h1>
        <p className="text-slate-400 font-mono text-xs mt-0.5">
          {settings.gameTitle} • {isSoloMode ? `${soloTimeLimit}-Second Time to Beat Challenge` : '1 Terabyte Emergency Patch Deployed'} ({targetMB.toLocaleString()} MB)
        </p>
      </header>

      {isSoloMode && firstPlace ? (
        /* Dedicated Solo Time Trial Evaluation Showcase - SUCCESS vs FAILED */
        <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center max-w-xl mx-auto w-full my-auto px-4 py-2">
          <div
            className={`w-full bg-slate-900/95 border-2 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col items-center text-center transition-all ${
              isSoloSuccess
                ? 'border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
                : 'border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
            }`}
          >
            {/* Top Status Banner */}
            <div
              className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-mono font-black tracking-widest uppercase shadow-lg mb-2 flex items-center gap-1.5 ${
                isSoloSuccess
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-slate-950 animate-bounce'
                  : 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white animate-pulse'
              }`}
            >
              {isSoloSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  MISSION ACCOMPLISHED // SERVER DEFENDED
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  MISSION FAILED // DEADLINE EXCEEDED
                </>
              )}
            </div>

            {/* Character Avatar */}
            <div className="scale-105 my-1">
              <CharacterAvatar characterId={firstPlace.characterId} size="lg" glow={true} />
            </div>

            <h2 className="text-lg md:text-2xl font-black font-['Chakra_Petch'] text-slate-100 mt-1">
              {firstPlace.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono">{firstPlace.company}</p>

            {/* Huge SUCCESS vs FAILED Banner */}
            <div
              className={`my-2.5 py-3.5 px-6 rounded-2xl border-2 shadow-inner flex flex-col items-center w-full max-w-sm ${
                isSoloSuccess
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : 'bg-red-950/40 border-red-500/60'
              }`}
            >
              <span
                className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                  isSoloSuccess ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                MISSION RESULT
              </span>
              <div
                className={`text-5xl md:text-7xl font-black font-['Chakra_Petch'] my-1 tracking-wider ${
                  isSoloSuccess
                    ? 'bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                    : 'bg-gradient-to-r from-red-400 via-rose-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(248,113,113,0.6)]'
                }`}
              >
                {isSoloSuccess ? 'SUCCESS' : 'FAILED'}
              </div>
              <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-mono text-slate-200 mt-1">
                <span>
                  ⏱ Time:{' '}
                  <strong className={isSoloSuccess ? 'text-emerald-400' : 'text-red-400'}>
                    {firstPlace.finishTimeSeconds > 0
                      ? `${firstPlace.finishTimeSeconds}s`
                      : `${soloTimeLimit}.0s (TIMEOUT)`}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Time to Beat: <strong className="text-amber-300">{soloTimeLimit}s</strong>
                </span>
              </div>
              <div className="mt-1 text-[11px] font-mono text-cyan-300">
                Bandwidth Deployed: <strong>{firstPlace.tapCount.toLocaleString()} MB</strong> / {targetMB.toLocaleString()} MB
              </div>
            </div>

            {/* Criteria Legend */}
            <div className="text-[10.5px] font-mono text-slate-300 bg-slate-950/70 rounded-xl px-3.5 py-2 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>CRITERIA:</strong> Player must push 100% ({targetMB.toLocaleString()} MB) before the {soloTimeLimit}s clock expires to achieve SUCCESS.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* The 3-Tier Podium Display - Proportional & non-scrollable */
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
      )}

      {/* Action Navigation Footer - Auto disconnects devices & generates fresh QR codes */}
      <footer className="relative z-10 shrink-0 border-t border-slate-800 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <span>Presented by TIM • All devices automatically disconnect every match</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Next Match:</span>
            <span className="text-amber-400 font-bold font-mono">{autoResetSeconds}s</span>
          </div>

          <button
            onClick={handleStartNextGame}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black font-['Chakra_Petch'] text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
          >
            <QrCode className="w-4 h-4 text-slate-950" />
            <span>START NEXT MATCH (GENERATE NEW QR CODES)</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </footer>
    </div>
  );
};
