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

  // Track the active race session this phone has joined
  const [sessionRaceId, setSessionRaceId] = useState<string>(() => {
    return liveRace.raceId;
  });

  // Track if this device has participated in an active match (countdown, racing, finished, or podium)
  const [hasPlayedInRace, setHasPlayedInRace] = useState<boolean>(false);

  useEffect(() => {
    if (slot?.finished || liveRace.status === 'countdown' || liveRace.status === 'racing' || liveRace.status === 'podium') {
      setHasPlayedInRace(true);
    }
  }, [slot?.finished, liveRace.status]);

  // Keep session URL parameter in sync if user joined active lobby
  useEffect(() => {
    if (liveRace.status === 'lobby' && urlSession && urlSession !== liveRace.raceId) {
      const url = new URL(window.location.href);
      url.searchParams.set('session', liveRace.raceId);
      window.history.replaceState({}, '', url.toString());
      setSessionRaceId(liveRace.raceId);
    }
  }, [liveRace.status, urlSession, liveRace.raceId]);

  // Track if user completed registration during this session
  const [hasRegistered, setHasRegistered] = useState<boolean>(() => {
    if (!settings.registrationEnabled) return true;
    if (typeof window !== 'undefined' && sessionStorage.getItem(`rr_reg_${characterId}`) === 'true') return true;
    return Boolean(slot?.assigned && slot?.playerName);
  });

  const [playerName, setPlayerName] = useState<string>(slot?.playerName || '');

  // If registration is disabled and slot is not yet assigned, auto-assign slot directly
  useEffect(() => {
    // Only auto-claim if game is in lobby
    if (liveRace.status !== 'lobby') return;

    if (!settings.registrationEnabled && !slot?.assigned) {
      joinSlotDirectly(characterId, char.name, deviceId).then(() => {
        setHasRegistered(true);
      });
    }
  }, [settings.registrationEnabled, slot?.assigned, characterId, char.name, deviceId, liveRace.status]);

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

  // 1. Stale Session Check: Player tried to join with an old QR code while race is already running or on podium
  if (urlSession && liveRace.raceId && urlSession !== liveRace.raceId && (liveRace.status === 'racing' || liveRace.status === 'podium')) {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="expired_qr"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // 2. Automatic Disconnection After Game Ends:
  // When the player played in a match and the host resets to lobby for a brand new game match:
  if (hasPlayedInRace && liveRace.status === 'lobby' && sessionRaceId && liveRace.raceId !== sessionRaceId) {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="game_ended"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => {
          setHasPlayedInRace(false);
          setSessionRaceId(liveRace.raceId);
          window.location.reload();
        }}
      />
    );
  }

  // 3. Slot Claimed by Another Player Check:
  // If registration is enabled and another player already claimed this slot in the active lobby
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
