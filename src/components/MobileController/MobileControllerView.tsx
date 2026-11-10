import React, { useState, useEffect } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { RegistrationScreen } from './RegistrationScreen';
import { ReadyCheckModal } from './ReadyCheckModal';
import { StandbyScreen } from './StandbyScreen';
import { MobileCountdownScreen } from './MobileCountdownScreen';
import { ControllerTapScreen } from './ControllerTapScreen';
import { MobileFinishedScreen } from './MobileFinishedScreen';
import { DisconnectedScreen } from './DisconnectedScreen';
import { setPlayerReady, joinSlotDirectly } from '../../services/gameService';
import { CHARACTERS } from '../../constants/characters';
import { AlertCircle } from 'lucide-react';

interface MobileControllerViewProps {
  characterId: CharacterId;
  liveRace: LiveRaceDoc;
  settings: GameSettings;
  isMuted?: boolean;
  onToggleSound?: () => void;
  onExitToHost?: () => void;
}

export const MobileControllerView: React.FC<MobileControllerViewProps> = ({
  characterId,
  liveRace,
  settings,
  isMuted,
  onToggleSound,
  onExitToHost
}) => {
  const slot = liveRace.slots[characterId];
  const char = CHARACTERS[characterId];

  // Inspect session token in URL parameters
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlSession = searchParams.get('session');

  // Stable device/client ID for this browser tab session
  const [deviceId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'p_' + Math.random().toString(36).slice(2, 8);
    const existing = sessionStorage.getItem('rr_device_id');
    if (existing) return existing;
    const generated = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem('rr_device_id', generated);
    return generated;
  });

  // Fixed session token this phone was bound to when scanning the QR code
  const [boundSessionId] = useState<string>(() => {
    return urlSession || liveRace.raceId;
  });

  // Track if this device participated in a race that finished or reached podium
  const [hasCompletedMatch, setHasCompletedMatch] = useState<boolean>(() => {
    return Boolean(slot?.finished || liveRace.status === 'podium');
  });

  useEffect(() => {
    if (slot?.finished || liveRace.status === 'podium') {
      setHasCompletedMatch(true);
    }
  }, [slot?.finished, liveRace.status]);

  // Determine if this controller is now disconnected:
  // 1. If the match completed and host returned to lobby
  // 2. If the host raceId changed to a new match session
  // 3. If the controller had previously claimed this slot, but the slot was cleared by host/admin
  const isGameEnded =
    (hasCompletedMatch && liveRace.status === 'lobby') ||
    (boundSessionId && liveRace.raceId && boundSessionId !== liveRace.raceId);

  // Track if user completed registration during this session
  const [hasRegistered, setHasRegistered] = useState<boolean>(() => {
    if (!settings.registrationEnabled) return true;
    if (typeof window !== 'undefined' && sessionStorage.getItem(`rr_reg_${characterId}`) === 'true') return true;
    return Boolean(slot?.assigned && slot?.playerName);
  });

  const [playerName, setPlayerName] = useState<string>(slot?.playerName || '');

  // Auto-assign slot ONLY if the game is in the matching active lobby AND not disconnected
  useEffect(() => {
    if (isGameEnded) return;
    if (liveRace.status !== 'lobby') return;
    if (urlSession && liveRace.raceId && urlSession !== liveRace.raceId) return;

    if (!settings.registrationEnabled && !slot?.assigned) {
      joinSlotDirectly(characterId, char.name, deviceId).then(() => {
        setHasRegistered(true);
      });
    }
  }, [isGameEnded, settings.registrationEnabled, slot?.assigned, characterId, char.name, deviceId, liveRace.status, urlSession, liveRace.raceId]);

  // Handle registration submission
  const handleRegistrationComplete = (name: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`rr_reg_${characterId}`, 'true');
    }
    setPlayerName(name);
    setHasRegistered(true);
  };

  // Handle ready check confirmation
  const handleConfirmReady = async () => {
    await setPlayerReady(characterId, true);
  };

  if (!char) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h1 className="text-xl font-bold font-mono">Invalid Character Slot</h1>
        <p className="text-sm text-slate-400 mt-2">Please scan a valid character QR code from the host display.</p>
        {onExitToHost && (
          <button
            onClick={onExitToHost}
            className="mt-6 px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 font-mono text-xs cursor-pointer"
          >
            Switch to Host Screen
          </button>
        )}
      </div>
    );
  }

  // 1. Automatic Disconnection: Once the game ends or a new match is generated, disconnect this device completely!
  if (isGameEnded) {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="game_ended"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => {
          // When scanning or refreshing for the new match, clear stale state
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  // 2. Stale Session Check: Player tried to join an old QR code while race is already active/podium
  if (urlSession && liveRace.raceId && urlSession !== liveRace.raceId) {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="expired_qr"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  // 3. Slot Claimed by Another Player Check:
  const isMySlot = slot?.playerId === deviceId || (typeof window !== 'undefined' && sessionStorage.getItem(`rr_reg_${characterId}`) === 'true');
  if (settings.registrationEnabled && slot?.assigned && !isMySlot && liveRace.status === 'lobby') {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="slot_taken"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Loading indicator while auto-claiming slot when registration is disabled
  if (!settings.registrationEnabled && !slot?.assigned && liveRace.status === 'lobby') {
    return (
      <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4" />
        <h2 className="font-['Chakra_Petch'] text-lg font-black text-cyan-400 uppercase tracking-widest">
          CONNECTING PROTOCOL LINK...
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-2">
          Assigning {char.name} on host display
        </p>
      </div>
    );
  }

  // Phase 2: Registration Screen (Only if registration is enabled by admin and slot not yet registered)
  if (settings.registrationEnabled && !hasRegistered && !slot?.assigned) {
    return (
      <RegistrationScreen
        characterId={characterId}
        onRegistered={handleRegistrationComplete}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
      />
    );
  }

  // Phase 3a: Ready Check Modal ("Are you ready?")
  if (!slot?.isReady && liveRace.status === 'lobby') {
    return (
      <div className="relative h-dvh max-h-dvh w-full bg-slate-950 flex flex-col overflow-hidden">
        <ReadyCheckModal
          characterId={characterId}
          playerName={playerName || slot?.playerName}
          onConfirmReady={handleConfirmReady}
          isMuted={isMuted}
          onToggleSound={onToggleSound}
        />
      </div>
    );
  }

  // Phase 3b: Standby Screen (After tapping Yes, displays game instructions and "Start Game?" trigger button)
  if (liveRace.status === 'lobby') {
    return (
      <StandbyScreen
        characterId={characterId}
        playerName={playerName || slot?.playerName}
        liveRace={liveRace}
        settings={settings}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
      />
    );
  }

  // Phase 3c: Countdown Phase (Shown on device!)
  if (liveRace.status === 'countdown') {
    return (
      <MobileCountdownScreen
        characterId={characterId}
        playerName={playerName || slot?.playerName}
        liveRace={liveRace}
        settings={settings}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
      />
    );
  }

  // Phase 5: Podium / Race Completed
  if (liveRace.status === 'podium' || slot?.finished) {
    return (
      <MobileFinishedScreen
        characterId={characterId}
        playerName={playerName || slot?.playerName}
        liveRace={liveRace}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
      />
    );
  }

  // Phase 4: Gameplay Mechanics - Controller Tapping Screen
  return (
    <ControllerTapScreen
      characterId={characterId}
      playerName={playerName || slot?.playerName}
      liveRace={liveRace}
      settings={settings}
      isMuted={isMuted}
      onToggleSound={onToggleSound}
    />
  );
};
