import React, { useState, useEffect, useRef } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { submitTapBatch } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { SOLO_TIME_LIMIT_SECONDS } from '../../utils/scoring';
import { Flame, Zap, AlertTriangle, Shield, Wifi, Volume2, VolumeX, Clock } from 'lucide-react';

interface ControllerTapScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

interface TapEffect {
  id: number;
  x: number;
  y: number;
}

export const ControllerTapScreen: React.FC<ControllerTapScreenProps> = ({
  characterId,
  playerName,
  liveRace,
  settings,
  isMuted,
  onToggleSound
}) => {
  const char = CHARACTERS[characterId];
  const targetMB = settings.requiredTaps || liveRace.targetTaps || 1000;
  const slot = liveRace.slots[characterId];

  // Local optimistic tap/MB count for instant tactile response
  const [localTaps, setLocalTaps] = useState<number>(slot?.tapCount || 0);
  const [tapRate, setTapRate] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);

  const pendingDeltaRef = useRef<number>(0);
  const recentTapsRef = useRef<number[]>([]);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const buttonRef = useRef<HTMLDivElement>(null);

  const assignedCount = Object.values(liveRace.slots).filter((s) => s.assigned).length;
  const isSoloMode = liveRace.isSoloMode ?? (assignedCount === 1);
  const soloTimeLimit = liveRace.soloTimeLimit || SOLO_TIME_LIMIT_SECONDS;

  const [currentNow, setCurrentNow] = useState<number>(Date.now());
  useEffect(() => {
    if (!isSoloMode || liveRace.status !== 'racing') return;
    const t = setInterval(() => setCurrentNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [isSoloMode, liveRace.status]);

  const raceStartTime = liveRace.startedAt || currentNow;
  const elapsedSec = Math.max(0, (currentNow - raceStartTime) / 1000);
  const remainingSec = Math.max(0, soloTimeLimit - elapsedSec);

  // Reset to 0 only when a new lobby or countdown begins
  useEffect(() => {
    if (liveRace.status === 'lobby' || liveRace.status === 'countdown') {
      setLocalTaps(0);
      pendingDeltaRef.current = 0;
    }
  }, [liveRace.status]);

  // Sync from server if server count is higher (e.g. initial connection)
  useEffect(() => {
    if (slot?.tapCount && slot.tapCount > localTaps) {
      setLocalTaps(slot.tapCount);
    }
  }, [slot?.tapCount]);

  // Flush pending taps to Firestore in batched intervals
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (pendingDeltaRef.current > 0) {
        const delta = pendingDeltaRef.current;
        pendingDeltaRef.current = 0;
        await submitTapBatch(characterId, delta, liveRace);
      }
    }, 60);

    return () => clearInterval(syncInterval);
  }, [characterId, liveRace]);

  // Calculate tap rate (MB/s or taps/s)
  useEffect(() => {
    const rateInterval = setInterval(() => {
      const now = Date.now();
      recentTapsRef.current = recentTapsRef.current.filter((t) => now - t < 1000);
      setTapRate(recentTapsRef.current.length);
    }, 150);

    return () => clearInterval(rateInterval);
  }, []);

  const handleTap = (clientX?: number, clientY?: number) => {
    if (slot?.finished || localTaps >= targetMB) return;

    const now = Date.now();
    recentTapsRef.current.push(now);
    lastSyncTimeRef.current = now;

    // Increment local state immediately
    setLocalTaps((prev) => Math.min(prev + 1, targetMB));
    pendingDeltaRef.current += 1;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    // Sound blip
    soundEngine.playTap(Math.min(tapRate / 10, 1));

    // Spawn visual tap ripple
    if (buttonRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const newEffect = { id: Date.now() + Math.random(), x, y };
      setTapEffects((prev) => [...prev.slice(-3), newEffect]);
    } else {
      setTapEffects((prev) => [...prev.slice(-3), { id: Date.now(), x: 96, y: 96 }]);
    }
  };

  const progressPercent = Math.min(100, (localTaps / targetMB) * 100);
  const isStopped = tapRate === 0 && !slot?.finished && localTaps < targetMB;
  // Estimated pumped Mbps (e.g. 1 tap = 50 Mbps burst)
  const pumpedMbps = tapRate > 0 ? tapRate * 48 : 0;

  return (
    <div
      className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3.5 select-none touch-manipulation overflow-hidden max-w-lg mx-auto"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Top Header - Bigger fonts & Clear spacing */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 flex items-center justify-center p-0.5 shrink-0 border border-slate-700/60 shadow-inner">
            <CharacterAvatar characterId={characterId} size="sm" glow={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black font-['Chakra_Petch'] text-slate-100 tracking-wide truncate max-w-[120px] sm:max-w-[160px]">
                {char.name}
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                TIM
              </span>
            </div>
            <div className="text-xs sm:text-sm font-mono text-cyan-400 font-medium truncate max-w-[120px] sm:max-w-[160px]">
              {playerName || 'Protocol Pilot'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          )}
          <div>
            <div className="text-sm sm:text-base md:text-lg font-mono font-black text-cyan-300">
              {localTaps.toLocaleString()}{' '}
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/ {targetMB} MB</span>
            </div>
            <div className="text-[11px] sm:text-xs font-mono text-emerald-400 font-bold">
              {progressPercent.toFixed(1)}% PATCHED
            </div>
          </div>
        </div>
      </header>

      {/* Solo Mode Time to Beat Countdown & Objective HUD - Bigger & High Impact */}
      {isSoloMode && (
        <div
          className={`shrink-0 my-1 flex items-center justify-between border-2 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-mono shadow-md transition-all ${
            remainingSec <= 5
              ? 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-slate-900/95 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${remainingSec <= 5 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
            <span className="text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">Time to Beat:</span>
            <strong className={`font-mono text-lg sm:text-2xl font-black ${remainingSec <= 5 ? 'text-red-300 animate-pulse' : 'text-amber-300'}`}>
              {remainingSec.toFixed(1)}s
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                remainingSec <= 5
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {remainingSec <= 5 ? 'HURRY!' : 'TARGET: SUCCESS'}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Bandwidth / Momentum Alert - Bigger Font */}
      <div className="shrink-0 my-1 text-center">
        {isStopped ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs sm:text-sm font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            0 Mbps! TAP RAPIDLY TO PUMP BANDWIDTH
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs sm:text-sm font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            PUMPING {pumpedMbps} Mbps • OVERCLOCK ACTIVE
          </div>
        )}
      </div>

      {/* Progress Bar - Thicker with Glowing Fill */}
      <div className="shrink-0 w-full bg-slate-900 rounded-full h-3 sm:h-3.5 border border-slate-800 overflow-hidden relative shadow-inner">
        <div
          className="h-full transition-all duration-75 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(to right, ${char.primaryColor}, ${char.accentColor})`,
            boxShadow: `0 0 12px ${char.primaryColor}`
          }}
        />
      </div>

      {/* Giant Mobile Button Masher - Bigger to consume all available screen space */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-2">
        <div
          ref={buttonRef}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsPressing(true);
            const touch = e.touches[0];
            handleTap(touch?.clientX, touch?.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsPressing(false);
          }}
          onMouseDown={(e) => {
            setIsPressing(true);
            handleTap(e.clientX, e.clientY);
          }}
          onMouseUp={() => setIsPressing(false)}
          className={`relative w-[min(84vw,360px,46vh)] h-[min(84vw,360px,46vh)] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-75 transform active:scale-95 shadow-2xl overflow-hidden ${
            isPressing ? 'scale-95' : 'scale-100 hover:scale-[1.02]'
          }`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}38, #070c18)`,
            border: `6px solid ${char.primaryColor}`,
            boxShadow: isPressing
              ? `0 0 45px ${char.primaryColor}, inset 0 0 35px ${char.primaryColor}`
              : `0 0 55px ${char.glowColor}`
          }}
        >
          {/* Circular Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              fill="transparent"
              stroke={char.primaryColor}
              strokeWidth="6"
              strokeDasharray="290"
              strokeDashoffset={290 - (290 * progressPercent) / 100}
              className="transition-all duration-75"
            />
          </svg>

          {/* Character Avatar with Stepping Feet - ENLARGED to consume space */}
          <div className="pointer-events-none transform transition-transform scale-110 sm:scale-125 my-1">
            <CharacterAvatar
              characterId={characterId}
              size="lg"
              glow={true}
              stepPhase={localTaps}
              isMoving={!isStopped}
            />
          </div>

          <div className="text-center pointer-events-none mt-1">
            <span className="block text-sm sm:text-base md:text-lg font-mono font-black tracking-widest uppercase text-white drop-shadow">
              TAP TO PUMP!
            </span>
            <span
              className="text-xs sm:text-sm font-mono font-bold tracking-wide mt-0.5 block"
              style={{ color: char.primaryColor }}
            >
              {char.cyberQuote}
            </span>
          </div>

          {/* Burst ripple rings from touches */}
          {tapEffects.map((effect) => (
            <span
              key={effect.id}
              className="absolute w-12 h-12 rounded-full border-2 border-white pointer-events-none animate-ping opacity-75"
              style={{
                left: effect.x - 24,
                top: effect.y - 24
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Footer - Non-scrollable with bigger font */}
      <footer className="shrink-0 bg-slate-900/90 border border-slate-800/80 rounded-2xl px-3.5 py-2 text-center text-xs font-mono text-slate-300 shadow-md">
        <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM • Gigabit Network Link</span>
        </div>
        <div className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
          Tap rapidly to step forward & pump Mbps to push the emergency patch!
        </div>
      </footer>
    </div>
  );
};
