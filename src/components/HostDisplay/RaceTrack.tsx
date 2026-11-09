import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { setRaceStatus } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
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
  Minimize
} from 'lucide-react';

interface RaceTrackProps {
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  liveRace,
  settings,
  isFullscreen,
  onToggleFullscreen
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

  // Start high-intensity cyber background music when racing!
  useEffect(() => {
    if (liveRace.status === 'racing') {
      soundEngine.startBgm();
    } else {
      soundEngine.stopBgm();
    }
    return () => {
      soundEngine.stopBgm();
    };
  }, [liveRace.status]);

  const targetMB = settings.requiredTaps || liveRace.targetTaps || 1000;
  const raceStartTime = liveRace.startedAt || currentTime;
  const elapsedTimeSeconds = isStaged ? '0.0' : Math.max(0, (currentTime - raceStartTime) / 1000).toFixed(1);

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
      {/* Top Race HUD Telemetry - Compact Header with "Presented by TIM" and NO admin button */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-cyan-500/30 rounded-xl px-4 py-2 mb-1.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[11px] font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {isStaged ? 'STAGING GATES ACTIVE' : 'LIVE GIGABIT STREAM'}
          </div>
          <h2 className="text-base md:text-xl font-black italic tracking-wide bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent font-['Chakra_Petch'] truncate max-w-sm">
            {settings.gameTitle}
          </h2>
        </div>

        {/* Global Transfer Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-[11px]">Time:</span>
            <span className="text-cyan-300 font-bold">{elapsedTimeSeconds}s</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Emergency Patch:</span>
            <span className="text-emerald-300 font-bold">{targetMB.toLocaleString()} MB</span>
          </div>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 rounded-lg px-2.5 py-1 text-[11px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Staging / Commentary Alert Ticker */}
      <div className="shrink-0 mb-1.5 bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5">
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 ${
            isStaged
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-cyan-500/20 text-cyan-300'
          }`}
        >
          {isStaged ? 'STAGING AT START GATE' : 'Emergency Transmission'}
        </div>
        <p className="text-xs font-mono text-slate-200 tracking-wide truncate">
          {isStaged
            ? '⚠️ 5-SECOND COUNTDOWN ACTIVE ON MOBILE CONTROLLERS — PREPARE FINGERS FOR RAPID TAPPING!'
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
