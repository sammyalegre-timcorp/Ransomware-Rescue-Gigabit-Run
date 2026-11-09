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

  // Bind this phone connection to the initial game session
  const [activeSessionId] = useState<string>(() => {
    return urlSession || liveRace.raceId;
  });

  // Track if this device has participated in or finished a race
  const [hasFinishedMatch, setHasFinishedMatch] = useState<boolean>(false);

  useEffect(() => {
    if (slot?.finished || liveRace.status === 'podium') {
      setHasFinishedMatch(true);
    }
  }, [slot?.finished, liveRace.status]);

  // Track if user completed registration during this session
  const [hasRegistered, setHasRegistered] = useState<boolean>(() => {
    // If registration is disabled by admin, skip registration
    if (!settings.registrationEnabled) return true;
    // If slot is already assigned to a player, consider registered
    return Boolean(slot?.assigned && slot?.playerName);
  });

  const [playerName, setPlayerName] = useState<string>(slot?.playerName || '');

  // If registration is disabled and slot is not yet assigned, auto-assign slot directly
  useEffect(() => {
    // Only auto-join if this is the active live race session
    if (urlSession && liveRace.raceId && urlSession !== liveRace.raceId) return;

    if (!settings.registrationEnabled && !slot?.assigned) {
      joinSlotDirectly(characterId, char.name).then(() => {
        setHasRegistered(true);
      });
    }
  }, [settings.registrationEnabled, slot?.assigned, characterId, char.name, urlSession, liveRace.raceId]);

  // Handle registration submission
  const handleRegistrationComplete = (name: string) => {
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

  // 1. Expired QR Check: The player scanned a QR code from a previous game session
  if (urlSession && liveRace.raceId && urlSession !== liveRace.raceId) {
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

  // 2. Automatic Disconnection: After each game, automatically disconnect any device.
  // When the game ends / lobby resets, raceId changes and slots are cleared.
  // The device must scan the newly generated QR code from the screen.
  if (
    (hasFinishedMatch && liveRace.status === 'lobby') ||
    (activeSessionId && liveRace.raceId && liveRace.raceId !== activeSessionId) ||
    (hasRegistered && liveRace.status === 'lobby' && !slot?.assigned)
  ) {
    return (
      <DisconnectedScreen
        characterId={characterId}
        reason="game_ended"
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Phase 2: Registration Screen
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
