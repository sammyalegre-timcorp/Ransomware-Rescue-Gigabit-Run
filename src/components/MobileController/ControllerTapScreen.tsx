import React, { useState, useEffect, useRef } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { submitTapBatch } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { Flame, Zap, Gauge, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ControllerTapScreenProps {
  characterId: CharacterId;
  playerName?: string;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
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
  settings
}) => {
  const char = CHARACTERS[characterId];
  const targetTaps = liveRace.targetTaps || settings.requiredTaps || 1000;
  const slot = liveRace.slots[characterId];

  // Local optimistic tap count for instant responsiveness
  const [localTaps, setLocalTaps] = useState<number>(slot?.tapCount || 0);
  const [tapRate, setTapRate] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);

  const pendingDeltaRef = useRef<number>(0);
  const recentTapsRef = useRef<number[]>([]);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const buttonRef = useRef<HTMLDivElement>(null);

  // Sync from server if server count is higher (e.g. reconnect)
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

  // Calculate tap rate (taps per second) and clean up ripple effects
  useEffect(() => {
    const rateInterval = setInterval(() => {
      const now = Date.now();
      recentTapsRef.current = recentTapsRef.current.filter((t) => now - t < 1000);
      setTapRate(recentTapsRef.current.length);
    }, 150);

    return () => clearInterval(rateInterval);
  }, []);

  const handleTap = (clientX?: number, clientY?: number) => {
    if (slot?.finished || localTaps >= targetTaps) return;

    const now = Date.now();
    recentTapsRef.current.push(now);
    lastSyncTimeRef.current = now;

    // Increment local state immediately
    setLocalTaps((prev) => Math.min(prev + 1, targetTaps));
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
      setTapEffects((prev) => [...prev.slice(-4), newEffect]);
    } else {
      setTapEffects((prev) => [...prev.slice(-4), { id: Date.now(), x: 120, y: 120 }]);
    }
  };

  const progressPercent = Math.min(100, (localTaps / targetTaps) * 100);
  const isStopped = tapRate === 0 && !slot?.finished && localTaps < targetTaps;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 select-none touch-manipulation overflow-hidden max-w-md mx-auto"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Top Controller HUD */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center p-1">
            <CharacterAvatar characterId={characterId} size="sm" glow={false} />
          </div>
          <div>
            <div className="text-sm font-black font-['Chakra_Petch'] text-slate-100 truncate max-w-[130px]">
              {char.name}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 truncate max-w-[130px]">
              {playerName || 'Pilot'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-mono font-black text-cyan-300">
            {localTaps.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {targetTaps}</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-bold">
            {progressPercent.toFixed(1)}% COMPLETE
          </div>
        </div>
      </div>

      {/* Dynamic Momentum Alert */}
      <div className="my-2 text-center">
        {isStopped ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            HALTED! TAP RAPIDLY TO ACCELERATE
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            SPEED: {tapRate} TAPS/SEC • OVERCLOCK ACTIVE
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden relative">
        <div
          className="h-full transition-all duration-75 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(to right, ${char.primaryColor}, ${char.accentColor})`,
            boxShadow: `0 0 12px ${char.primaryColor}`
          }}
        />
      </div>

      {/* Giant Mobile Button Masher */}
      <div className="my-auto flex flex-col items-center justify-center py-4">
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
          className={`relative w-64 h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-75 transform active:scale-95 shadow-2xl ${
            isPressing ? 'scale-95' : 'scale-100 hover:scale-[1.02]'
          }`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${char.primaryColor}30, #090d16)`,
            border: `6px solid ${char.primaryColor}`,
            boxShadow: isPressing
              ? `0 0 40px ${char.primaryColor}, inset 0 0 30px ${char.primaryColor}`
              : `0 0 60px ${char.glowColor}`
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

          {/* Character SVG Masher Logo */}
          <div className="w-32 h-32 md:w-36 md:h-36 pointer-events-none transform transition-transform">
            <CharacterAvatar characterId={characterId} size="giant" glow={true} />
          </div>

          <div className="mt-2 text-center pointer-events-none">
            <span className="block text-xs font-mono font-black tracking-widest uppercase text-slate-300">
              TAP RAPIDLY!
            </span>
            <span
              className="text-xs font-mono font-bold"
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

      {/* Bottom Status / Instructions */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center text-xs font-mono text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold mb-0.5">
          <Zap className="w-3.5 h-3.5" />
          FAST TAPPING PROPELS FORWARD
        </div>
        <div>Continuous tapping keeps momentum active on the host display track.</div>
      </div>
    </div>
  );
};
