import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { setRaceStatus, handleSoloTimeout } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { calculateSoloScore, SOLO_TIME_LIMIT_SECONDS } from '../../utils/scoring';
import {
  Gauge,
  Flame,
  Zap,
  Activity,
  Trophy,
  Flag,
  Wifi,
  ShieldAlert,
  Maximize,
  Minimize,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';

interface RaceTrackProps {
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  liveRace,
  settings,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleSound
}) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [commentary, setCommentary] = useState<string>('EMERGENCY PATCH TRANSMISSION UNDERWAY! PUMPING GIGABIT BANDWIDTH!');

  const isStaged = liveRace.status === 'countdown';
  const showTelemetry = Boolean(settings.showTelemetryOnTrack);

  // High frequency render tick for momentum detection and animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Check if race has ended
  useEffect(() => {
    const slots = Object.values(liveRace.slots);
    const assignedSlots = slots.filter((s) => s.assigned);
    const finishedSlots = slots.filter((s) => s.finished);

    if (finishedSlots.length > 0) {
      const leader = finishedSlots.sort((a, b) => (a.finishRank || 99) - (b.finishRank || 99))[0];
      const char = CHARACTERS[leader.characterId];
      setCommentary(`🏆 ${leader.playerName || char.name} HAS SECURED THE SERVER WITH THE 1TB PATCH!`);
    }

    if (assignedSlots.length > 0 && assignedSlots.every((s) => s.finished)) {
      soundEngine.playFinishChime();
      setTimeout(() => {
        setRaceStatus('podium');
      }, 1500);
    }
  }, [liveRace.slots]);

  // Start high-intensity cyber background music when racing or idle
  useEffect(() => {
    if (!isMuted) {
      soundEngine.startBgm();
    }
  }, [isMuted]);

  const assignedSlots = Object.values(liveRace.slots).filter((s) => s.assigned);
  const isSoloMode = liveRace.isSoloMode ?? (assignedSlots.length === 1);
  const soloTimeLimit = liveRace.soloTimeLimit || SOLO_TIME_LIMIT_SECONDS;

  const targetMB = settings.requiredTaps || liveRace.targetTaps || 1000;
  const raceStartTime = liveRace.startedAt || currentTime;
  const elapsedSecNumber = isStaged ? 0 : Math.max(0, (currentTime - raceStartTime) / 1000);
  const elapsedTimeSeconds = elapsedSecNumber.toFixed(1);
  const remainingTimeSeconds = Math.max(0, soloTimeLimit - elapsedSecNumber).toFixed(1);

  // Enforce 15-second emergency deadline in Solo Mode
  useEffect(() => {
    if (!isStaged && liveRace.status === 'racing' && isSoloMode) {
      if (elapsedSecNumber >= soloTimeLimit) {
        const soloSlot = assignedSlots[0];
        if (soloSlot && !soloSlot.finished) {
          handleSoloTimeout();
        }
      }
    }
  }, [elapsedSecNumber, isStaged, liveRace.status, isSoloMode, soloTimeLimit, assignedSlots]);

  // Sort slots by MB transferred to find live ranks
  const sortedSlots = Object.values(liveRace.slots)
    .filter((s) => s.assigned)
    .sort((a, b) => {
      if (a.finished && b.finished) return (a.finishRank || 0) - (b.finishRank || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.tapCount - a.tapCount;
    });

  const getRankBadge = (charId: CharacterId) => {
    const index = sortedSlots.findIndex((s) => s.characterId === charId);
    if (index === -1) return null;
    const rank = index + 1;
    if (rank === 1) return { label: '1ST', color: 'bg-amber-400 text-slate-950 shadow-amber-400/50' };
    if (rank === 2) return { label: '2ND', color: 'bg-slate-300 text-slate-950 shadow-slate-300/50' };
    if (rank === 3) return { label: '3RD', color: 'bg-amber-700 text-white shadow-amber-700/50' };
    return { label: '4TH', color: 'bg-slate-700 text-slate-300' };
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-4 overflow-hidden select-none">
      {/* Top Race HUD Telemetry - ONE SINGLE UNIFIED HEADER (Timer is the main centerpiece in Solo Mode) */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-cyan-500/30 rounded-xl px-3 sm:px-4 md:px-5 py-2 mb-2 backdrop-blur-md shadow-lg">
        {/* Left: Presented by TIM & Title & Patch size */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex flex-col">
            <h2 className="text-xs sm:text-sm md:text-base font-black italic tracking-wide bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent font-['Chakra_Petch'] truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
              {settings.gameTitle}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                Patch: {targetMB.toLocaleString()} MB
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">
                {isSoloMode ? 'SOLO TIME ATTACK' : 'LIVE GIGABIT STREAM'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: When Solo Mode, THE TIMER IS THE MAIN THING SEEN! */}
        {isSoloMode ? (
          <div className="flex items-center justify-center mx-2">
            <div
              className={`flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-6 py-1 sm:py-1.5 rounded-2xl border-2 transition-all ${
                Number(remainingTimeSeconds) <= 5 && !isStaged
                  ? 'bg-red-950/95 border-red-500 text-red-300 animate-pulse shadow-[0_0_35px_rgba(239,68,68,0.7)]'
                  : 'bg-slate-950/95 border-amber-400/80 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
              }`}
            >
              <Clock
                className={`w-5 h-5 sm:w-7 sm:h-7 ${
                  Number(remainingTimeSeconds) <= 5 && !isStaged ? 'text-red-400 animate-spin' : 'text-amber-400'
                }`}
              />
              <div className="flex flex-col text-left">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                  TIME TO BEAT
                </span>
                <div className="flex items-baseline gap-0.5 leading-none mt-0.5">
                  <span className="text-2xl sm:text-4xl md:text-5xl font-black font-['Chakra_Petch'] tracking-tight">
                    {isStaged ? soloTimeLimit.toFixed(1) : remainingTimeSeconds}
                  </span>
                  <span className="text-xs sm:text-lg font-bold text-amber-400/80 font-mono">s</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col text-right pl-3 border-l border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Challenge</span>
                <span
                  className={`text-xs font-mono font-black ${
                    Number(remainingTimeSeconds) > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isStaged ? 'PREPARING' : Number(remainingTimeSeconds) > 0 ? 'BEAT THE CLOCK' : 'TIME UP'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="text-slate-400 text-[11px]">Time:</span>
              <span className="text-cyan-300 font-bold">{elapsedTimeSeconds}s</span>
            </div>
          </div>
        )}

        {/* Right: Audio + Fullscreen Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 transition-colors shadow-sm cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline text-[11px]">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Staging / Commentary Alert Ticker with Solo rules */}
      <div className="shrink-0 mb-1.5 bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5">
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 ${
            isStaged
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : isSoloMode && Number(remainingTimeSeconds) <= 5
              ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-bounce'
              : 'bg-cyan-500/20 text-cyan-300'
          }`}
        >
          {isStaged
            ? 'STAGING AT START GATE'
            : isSoloMode
            ? Number(remainingTimeSeconds) <= 5
              ? 'CRITICAL DEADLINE'
              : 'SOLO TIME ATTACK'
            : 'Emergency Transmission'}
        </div>
        <p className="text-xs font-mono text-slate-200 tracking-wide truncate">
          {isStaged
            ? isSoloMode
              ? `⚡ SOLO TIME TRIAL: ${soloTimeLimit.toFixed(1)}s TIME TO BEAT! Pump ${targetMB.toLocaleString()} MB before clock expires to achieve SUCCESS!`
              : '⚠️ 5-SECOND COUNTDOWN ACTIVE ON MOBILE CONTROLLERS — PREPARE FINGERS FOR RAPID TAPPING!'
            : isSoloMode
            ? Number(remainingTimeSeconds) <= 4
              ? `🚨 RANSOMWARE EXPLOIT DETONATING IN ${remainingTimeSeconds}s! PUMP BANDWIDTH TO SECURE SUCCESS!`
              : `⏱️ TIME TO BEAT: ${remainingTimeSeconds}s REMAINING • Deploy 100% of emergency patch to achieve SUCCESS!`
            : commentary}
        </p>
      </div>

      {/* 4 Optical Fiber Lanes */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 my-0.5">
        {(Object.keys(CHARACTERS) as CharacterId[]).map((charId, laneIndex) => {
          const char = CHARACTERS[charId];
          const slot = liveRace.slots[charId];
          const isAssigned = slot?.assigned;
          const mbTransferred = slot?.tapCount || 0;
          const progressPercent = Math.min(100, (mbTransferred / targetMB) * 100);
          const isFinished = slot?.finished;

          // Momentum: actively sprinting if tapped within last 700ms
          const isActivelyTapping =
            !isStaged && currentTime - (slot?.lastTapAt || 0) < 700 && !isFinished;

          const rankInfo = getRankBadge(charId);

          return (
            <div
              key={charId}
              className={`relative flex-1 min-h-0 flex flex-col justify-center rounded-xl border transition-all duration-200 px-3 py-1.5 ${
                isFinished
                  ? 'bg-slate-900/90 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : isActivelyTapping
                  ? 'bg-slate-900/80 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : isAssigned
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-40'
              }`}
            >
              {/* Lane Info Header */}
              <div className="flex items-center justify-between mb-1 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400">
                    L{laneIndex + 1}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-['Chakra_Petch'] text-xs md:text-sm text-slate-100">
                      {char.name}
                    </span>
                    {rankInfo && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${rankInfo.color}`}
                      >
                        {rankInfo.label}
                      </span>
                    )}
                    {isFinished && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                        <Trophy className="w-2.5 h-2.5" /> SECURED CORE #{(slot?.finishRank || 1)}
                      </span>
                    )}
                    {isSoloMode && isAssigned && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                          isFinished
                            ? slot?.outcome === 'SUCCESS' || (slot?.finishTime && slot.finishTime <= soloTimeLimit * 1000)
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {isFinished
                          ? slot?.outcome === 'SUCCESS' || (slot?.finishTime && slot.finishTime <= soloTimeLimit * 1000)
                            ? 'SUCCESS'
                            : 'FAILED'
                          : `TIME TO BEAT: ${remainingTimeSeconds}s`}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-[180px] hidden sm:block">
                    {isAssigned
                      ? `• ${slot.playerName || 'Pilot'} (${slot.playerCompany || 'Enterprise'})`
                      : '• Open Lane'}
                  </div>
                </div>

                {/* Optional Telemetry / Live Speed Indicators */}
                <div className="flex items-center gap-3">
                  {isAssigned && !isFinished && !isStaged && (
                    <div className="hidden md:flex items-center">
                      {isActivelyTapping ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                          OVERCLOCKING
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                          0 Mbps (HALTED)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Show numerical MB/Mbps only if configured in Admin */}
                  {showTelemetry && (
                    <div className="text-right">
                      <span className="text-xs md:text-sm font-mono font-black text-cyan-300">
                        {mbTransferred.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">/ {targetMB} MB</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 ml-1.5">
                        ({progressPercent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Track / Optical Cable */}
              <div className="relative h-12 md:h-16 bg-slate-950/90 rounded-lg border border-slate-800/80 overflow-hidden flex items-center px-2">
                {/* Fiber Optic Core Cable Glow */}
                <div
                  className="absolute left-0 right-0 h-1.5 top-1/2 -translate-y-1/2 opacity-60"
                  style={{
                    backgroundColor: `${char.primaryColor}30`,
                    boxShadow: `0 0 10px ${char.primaryColor}`
                  }}
                />

                {/* Track Checkpoint Distance Markers */}
                <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-4 opacity-30 text-[9px] font-mono text-slate-400">
                  <div className="border-r border-dashed border-slate-600 h-full flex items-end pb-0.5">
                    START
                  </div>
                  <div className="border-r border-dashed border-slate-600 h-full flex items-end pb-0.5">
                    250 MB
                  </div>
                  <div className="border-r border-dashed border-slate-600 h-full flex items-end pb-0.5">
                    500 MB
                  </div>
                  <div className="border-r border-dashed border-slate-600 h-full flex items-end pb-0.5">
                    750 MB
                  </div>
                  <div className="h-full flex items-end pb-0.5">CORE SERVER</div>
                </div>

                {/* Optical Laser Progress Fill (only if telemetry enabled, otherwise clean track) */}
                {showTelemetry && (
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-linear rounded-l-lg opacity-25"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: char.primaryColor
                    }}
                  />
                )}

                {/* Moving Character Sprinter with Visible Stepping Feet! */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-100 ease-out z-10 flex items-center pointer-events-none"
                  style={{
                    left: `calc(${progressPercent}% * 0.90 + 6px)`
                  }}
                >
                  {/* Energy Flame / Speed Trail when tapping rapidly */}
                  {isActivelyTapping && (
                    <div
                      className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-4 rounded-full blur-[1px] opacity-80 animate-pulse pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, transparent, ${char.primaryColor})`
                      }}
                    />
                  )}

                  {/* Character Avatar Container with dynamic stepPhase for visible stepping */}
                  <div
                    className={`relative transform transition-transform ${
                      isActivelyTapping ? 'scale-110 -rotate-3' : 'scale-95'
                    }`}
                  >
                    <CharacterAvatar
                      characterId={charId}
                      size="sm"
                      glow={true}
                      stepPhase={mbTransferred}
                      isMoving={isActivelyTapping}
                    />
                  </div>
                </div>

                {/* Core Server Finish Gate */}
                <div className="absolute right-0 top-0 bottom-0 w-7 bg-[repeating-linear-gradient(45deg,#020617,#020617_4px,#00F0FF_4px,#00F0FF_8px)] opacity-85 border-l border-cyan-400 flex items-center justify-center">
                  <Flag className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Race Controls - Compact, NO admin button */}
      <footer className="shrink-0 mt-1.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tap rapidly to pump Mbps. Characters halt immediately when tapping ceases!</span>
        </div>
        <div>
          <button
            onClick={() => {
              soundEngine.playFinishChime();
              setRaceStatus('podium');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer text-xs"
          >
            End Race & View Podium →
          </button>
        </div>
      </footer>
    </div>
  );
};
