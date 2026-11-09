import React, { useState, useEffect, useRef } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { submitTapBatch } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { calculateSoloScore, SOLO_TIME_LIMIT_SECONDS } from '../../utils/scoring';
import { Flame, Zap, AlertTriangle, Shield, Wifi, Volume2, VolumeX, Clock, Star } from 'lucide-react';

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
  const potentialScore = calculateSoloScore(elapsedSec, soloTimeLimit);

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
      className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 select-none touch-manipulation overflow-hidden max-w-md mx-auto"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Top Header - Compact with "Presented by TIM" & Audio Toggle */}
      <header className="shrink-0 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center p-0.5 shrink-0">
            <CharacterAvatar characterId={characterId} size="sm" glow={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black font-['Chakra_Petch'] text-slate-100 truncate max-w-[100px] sm:max-w-[120px]">
                {char.name}
              </span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                TIM
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-400 truncate max-w-[100px] sm:max-w-[120px]">
              {playerName || 'Protocol Pilot'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          )}
          <div>
            <div className="text-xs sm:text-sm font-mono font-black text-cyan-300">
              {localTaps.toLocaleString()}{' '}
              <span className="text-[9px] text-slate-500 font-normal">/ {targetMB} MB</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold">
              {progressPercent.toFixed(1)}% PATCHED
            </div>
          </div>
        </div>
      </header>

      {/* Solo Mode 15s Countdown & Live Score HUD */}
      {isSoloMode && (
        <div className="shrink-0 my-0.5 flex items-center justify-between bg-slate-900/90 border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs font-mono shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Clock className={`w-3.5 h-3.5 ${remainingSec <= 5 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
            <span className="text-[10px] text-slate-400">15s Deadline:</span>
            <strong className={`font-mono text-xs ${remainingSec <= 5 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
              {remainingSec.toFixed(1)}s
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Star className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400">Potential Score:</span>
            <strong className="font-mono text-xs text-cyan-300">{potentialScore} PTS</strong>
          </div>
        </div>
      )}

      {/* Dynamic Bandwidth / Momentum Alert */}
      <div className="shrink-0 my-0.5 text-center">
        {isStopped ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[11px] font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            0 Mbps! TAP RAPIDLY TO PUMP BANDWIDTH
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
            <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
            PUMPING {pumpedMbps} Mbps • OVERCLOCK ACTIVE
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden relative">
        <div
          className="h-full transition-all duration-75 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(to right, ${char.primaryColor}, ${char.accentColor})`,
            boxShadow: `0 0 10px ${char.primaryColor}`
          }}
        />
      </div>

      {/* Giant Mobile Button Masher - Carefully Sized to ALWAYS fit on screen */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-1">
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
          className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-75 transform active:scale-95 shadow-2xl overflow-hidden ${
            isPressing ? 'scale-95' : 'scale-100 hover:scale-[1.02]'
          }`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}35, #080d1a)`,
            border: `5px solid ${char.primaryColor}`,
            boxShadow: isPressing
              ? `0 0 30px ${char.primaryColor}, inset 0 0 25px ${char.primaryColor}`
              : `0 0 40px ${char.glowColor}`
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
              strokeWidth="5"
              strokeDasharray="290"
              strokeDashoffset={290 - (290 * progressPercent) / 100}
              className="transition-all duration-75"
            />
          </svg>

          {/* Character Avatar with Feet - INSIDE BUTTON & STEPPING! */}
          <div className="pointer-events-none transform transition-transform scale-90 sm:scale-100">
            <CharacterAvatar
              characterId={characterId}
              size="lg"
              glow={true}
              stepPhase={localTaps}
              isMoving={!isStopped}
            />
          </div>

          <div className="text-center pointer-events-none mt-0.5">
            <span className="block text-[10px] sm:text-xs font-mono font-black tracking-widest uppercase text-slate-200">
              TAP TO PUMP!
            </span>
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: char.primaryColor }}
            >
              {char.cyberQuote}
            </span>
          </div>

          {/* Burst ripple rings from touches */}
          {tapEffects.map((effect) => (
            <span
              key={effect.id}
              className="absolute w-10 h-10 rounded-full border-2 border-white pointer-events-none animate-ping opacity-75"
              style={{
                left: effect.x - 20,
                top: effect.y - 20
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Footer - Non-scrollable with "Presented by TIM" */}
      <footer className="shrink-0 bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-1.5 text-center text-[10px] font-mono text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold">
          <Wifi className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Presented by TIM • Emergency Gigabit Link</span>
        </div>
        <div className="text-slate-500 text-[9px] mt-0.5">
          Every tap steps forward & pumps Mbps to transfer the emergency patch!
        </div>
      </footer>
    </div>
  );
};
