import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  CharacterId,
  GameSettings,
  LiveRaceDoc,
  PlayerRegistration,
  RaceHistoryRecord,
  SlotState,
  PodiumWinner
} from '../types/game';
import { CHARACTERS, DEFAULT_SETTINGS } from '../constants/characters';
import { calculateSoloScore, SOLO_TIME_LIMIT_SECONDS } from '../utils/scoring';

const SETTINGS_DOC_PATH = 'game_settings/config';
const LIVE_RACE_PATH = 'live_race/current';
const REGISTRATIONS_COLLECTION = 'player_registrations';
const HISTORY_COLLECTION = 'race_history';

export function createInitialSlots(): Record<CharacterId, SlotState> {
  const charIds = Object.keys(CHARACTERS) as CharacterId[];
  const slots: Partial<Record<CharacterId, SlotState>> = {};
  for (const id of charIds) {
    slots[id] = {
      characterId: id,
      assigned: false,
      playerId: '',
      playerName: '',
      playerCompany: '',
      playerPosition: '',
      playerEmail: '',
      playerContact: '',
      isReady: false,
      tapCount: 0,
      lastTapAt: 0,
      finished: false,
      finishTime: 0,
      finishRank: 0,
      score: 0
    };
  }
  return slots as Record<CharacterId, SlotState>;
}

export function subscribeSettings(
  onUpdate: (settings: GameSettings) => void,
  onError?: (err: Error) => void
) {
  const ref = doc(db, 'game_settings', 'config');
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as GameSettings);
      } else {
        // Initialize default settings if doc doesn't exist yet
        setDoc(ref, {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, SETTINGS_DOC_PATH));
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, SETTINGS_DOC_PATH);
    }
  );
}

export async function updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
  try {
    const ref = doc(db, 'game_settings', 'config');
    await setDoc(
      ref,
      {
        ...settings,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // CRITICAL: Synchronize the new targetTaps & settings immediately to the active live race!
    const liveRef = doc(db, 'live_race', 'current');
    const liveUpdate: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (settings.requiredTaps !== undefined) {
      liveUpdate.targetTaps = Number(settings.requiredTaps);
    }
    if (settings.countdownDuration !== undefined) {
      liveUpdate.countdownRemaining = Number(settings.countdownDuration);
    }
    await updateDoc(liveRef, liveUpdate).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}

export function subscribeLiveRace(
  onUpdate: (race: LiveRaceDoc) => void,
  onError?: (err: Error) => void
) {
  const ref = doc(db, 'live_race', 'current');
  return onSnapshot(
    ref,
    async (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as LiveRaceDoc);
      } else {
        // Fetch current settings to avoid fallback to default 1000
        const settingsRef = doc(db, 'game_settings', 'config');
        const settingsSnap = await getDoc(settingsRef).catch(() => null);
        let targetTaps = DEFAULT_SETTINGS.requiredTaps;
        let countdownDuration = DEFAULT_SETTINGS.countdownDuration;
        if (settingsSnap && settingsSnap.exists()) {
          const s = settingsSnap.data() as GameSettings;
          if (s.requiredTaps) targetTaps = Number(s.requiredTaps);
          if (s.countdownDuration) countdownDuration = Number(s.countdownDuration);
        }

        const initialRace: LiveRaceDoc = {
          raceId: `race_${Date.now()}`,
          status: 'lobby',
          targetTaps,
          countdownRemaining: countdownDuration,
          startedAt: 0,
          endedAt: 0,
          slots: createInitialSlots(),
          updatedAt: new Date().toISOString()
        };
        setDoc(ref, initialRace).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, LIVE_RACE_PATH)
        );
        onUpdate(initialRace);
      }
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, LIVE_RACE_PATH);
    }
  );
}

export async function registerPlayer(
  registration: Omit<PlayerRegistration, 'createdAt'>
): Promise<void> {
  try {
    const regId = registration.playerId || `reg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const regDocRef = doc(db, REGISTRATIONS_COLLECTION, regId);

    const record: PlayerRegistration = {
      ...registration,
      playerId: regId,
      createdAt: new Date().toISOString()
    };

    await setDoc(regDocRef, record);

    // Update ONLY this specific character slot in the live race document
    const liveRef = doc(db, 'live_race', 'current');
    const charId = registration.characterId;

    await updateDoc(liveRef, {
      [`slots.${charId}.assigned`]: true,
      [`slots.${charId}.playerId`]: regId,
      [`slots.${charId}.playerName`]: registration.name,
      [`slots.${charId}.playerCompany`]: registration.company,
      [`slots.${charId}.playerPosition`]: registration.position,
      [`slots.${charId}.playerEmail`]: registration.email,
      [`slots.${charId}.playerContact`]: registration.contactNumber,
      [`slots.${charId}.isReady`]: false,
      [`slots.${charId}.tapCount`]: 0,
      [`slots.${charId}.lastTapAt`]: 0,
      [`slots.${charId}.finished`]: false,
      [`slots.${charId}.finishTime`]: 0,
      [`slots.${charId}.finishRank`]: 0,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, REGISTRATIONS_COLLECTION);
  }
}

export async function joinSlotDirectly(
  characterId: CharacterId,
  playerName: string = 'Protocol'
): Promise<string> {
  try {
    const playerId = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const liveRef = doc(db, 'live_race', 'current');

    await updateDoc(liveRef, {
      [`slots.${characterId}.assigned`]: true,
      [`slots.${characterId}.playerId`]: playerId,
      [`slots.${characterId}.playerName`]: playerName || CHARACTERS[characterId].name,
      [`slots.${characterId}.playerCompany`]: 'Enterprise Network',
      [`slots.${characterId}.isReady`]: false,
      [`slots.${characterId}.tapCount`]: 0,
      [`slots.${characterId}.lastTapAt`]: 0,
      [`slots.${characterId}.finished`]: false,
      [`slots.${characterId}.finishTime`]: 0,
      [`slots.${characterId}.finishRank`]: 0,
      updatedAt: new Date().toISOString()
    });

    return playerId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, LIVE_RACE_PATH);
  }
}

export async function setPlayerReady(characterId: CharacterId, isReady: boolean): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    await updateDoc(liveRef, {
      [`slots.${characterId}.isReady`]: isReady,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export async function startCountdown(countdownSeconds?: number, targetTaps?: number): Promise<void> {
  try {
    // ALWAYS fetch the latest configured requiredTaps from game_settings to respect admin changes!
    const settingsRef = doc(db, 'game_settings', 'config');
    const settingsSnap = await getDoc(settingsRef).catch(() => null);

    let effectiveTarget = targetTaps || DEFAULT_SETTINGS.requiredTaps;
    let effectiveCountdown = countdownSeconds || DEFAULT_SETTINGS.countdownDuration;

    if (settingsSnap && settingsSnap.exists()) {
      const s = settingsSnap.data() as GameSettings;
      if (s.requiredTaps) effectiveTarget = Number(s.requiredTaps);
      if (s.countdownDuration && !countdownSeconds) effectiveCountdown = Number(s.countdownDuration);
    }

    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);

    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      const assignedSlots = Object.values(data.slots).filter((s) => s.assigned);
      const isSoloMode = assignedSlots.length === 1;

      const updates: Record<string, any> = {
        status: 'countdown',
        countdownRemaining: effectiveCountdown,
        targetTaps: effectiveTarget,
        isSoloMode,
        soloTimeLimit: SOLO_TIME_LIMIT_SECONDS,
        startedAt: 0,
        endedAt: 0,
        updatedAt: new Date().toISOString()
      };

      // Reset each slot's tap progress cleanly for the new race
      for (const key of Object.keys(data.slots) as CharacterId[]) {
        updates[`slots.${key}.tapCount`] = 0;
        updates[`slots.${key}.lastTapAt`] = 0;
        updates[`slots.${key}.finished`] = false;
        updates[`slots.${key}.finishTime`] = 0;
        updates[`slots.${key}.finishRank`] = 0;
        updates[`slots.${key}.score`] = 0;
      }

      await updateDoc(liveRef, updates);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export async function setRaceStatus(status: LiveRaceDoc['status'], extra?: Partial<LiveRaceDoc>): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    await updateDoc(liveRef, {
      status,
      ...extra,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

// Player taps character button on mobile controller
export async function submitTapBatch(
  characterId: CharacterId,
  tapDelta: number,
  currentLiveRace: LiveRaceDoc
): Promise<void> {
  if (currentLiveRace.status !== 'racing') return;
  const currentSlot = currentLiveRace.slots[characterId];
  if (!currentSlot || currentSlot.finished) return;

  const now = Date.now();
  const liveRef = doc(db, 'live_race', 'current');

  try {
    const snap = await getDoc(liveRef);
    if (!snap.exists()) return;

    const data = snap.data() as LiveRaceDoc;
    if (data.status !== 'racing') return;

    const slot = data.slots[characterId];
    if (!slot || slot.finished) return;

    // Use current race targetTaps
    const targetTaps = data.targetTaps || DEFAULT_SETTINGS.requiredTaps;
    const newTapCount = Math.min(slot.tapCount + tapDelta, targetTaps);
    const finishedNow = newTapCount >= targetTaps;

    let finishRank = slot.finishRank;
    let finishTime = slot.finishTime;
    let score = slot.score;

    const assignedSlots = Object.values(data.slots).filter((s) => s.assigned);
    const isSolo = data.isSoloMode || assignedSlots.length === 1;

    if (finishedNow && !slot.finished) {
      const finishedSlots = Object.values(data.slots).filter(
        (s) => s.finished && s.characterId !== characterId
      );
      finishRank = finishedSlots.length + 1;
      const raceStartTime = data.startedAt || now;
      finishTime = Math.max(1, now - raceStartTime);

      // Score computation for Solo Player Speed Run:
      // 100 points for <= 1 sec, down to 1 point at 14 sec (1 sec before 15s deadline).
      if (isSolo) {
        const finishTimeSeconds = finishTime / 1000;
        score = calculateSoloScore(finishTimeSeconds, data.soloTimeLimit || SOLO_TIME_LIMIT_SECONDS);
      }
    }

    // UPDATE ONLY THIS CHARACTER'S SLOT IN FIRESTORE
    const updates: Record<string, any> = {
      [`slots.${characterId}.tapCount`]: newTapCount,
      [`slots.${characterId}.lastTapAt`]: now,
      [`slots.${characterId}.finished`]: finishedNow,
      [`slots.${characterId}.finishRank`]: finishRank,
      [`slots.${characterId}.finishTime`]: finishTime,
      updatedAt: new Date().toISOString()
    };
    if (score !== undefined) {
      updates[`slots.${characterId}.score`] = score;
    }

    // Check if all assigned active players have completed the race
    const updatedSlots = { ...data.slots };
    updatedSlots[characterId] = {
      ...slot,
      tapCount: newTapCount,
      lastTapAt: now,
      finished: finishedNow,
      finishRank,
      finishTime,
      score: score || slot.score || 0
    };

    const allAssignedFinished =
      assignedSlots.length > 0 && assignedSlots.every((s) => s.characterId === characterId ? finishedNow : s.finished);

    if (allAssignedFinished) {
      updates.status = 'podium';
      updates.endedAt = now;
    }

    await updateDoc(liveRef, updates);

    // Archive race history when all finish
    if (allAssignedFinished) {
      await archiveRaceHistory(data.raceId, updatedSlots, targetTaps, isSolo);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

// Called when the 15-second solo timer expires before completion
export async function handleSoloTimeout(): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (!snap.exists()) return;

    const data = snap.data() as LiveRaceDoc;
    if (data.status !== 'racing') return;

    const assignedSlots = Object.values(data.slots).filter((s) => s.assigned);
    if (assignedSlots.length !== 1) return;

    const soloSlot = assignedSlots[0];
    if (soloSlot.finished) return;

    const now = Date.now();
    const timeLimitMs = (data.soloTimeLimit || SOLO_TIME_LIMIT_SECONDS) * 1000;
    const updates: Record<string, any> = {
      [`slots.${soloSlot.characterId}.finished`]: true,
      [`slots.${soloSlot.characterId}.finishTime`]: timeLimitMs,
      [`slots.${soloSlot.characterId}.finishRank`]: 1,
      [`slots.${soloSlot.characterId}.score`]: 0,
      status: 'podium',
      endedAt: now,
      updatedAt: new Date().toISOString()
    };

    const updatedSlots = { ...data.slots };
    updatedSlots[soloSlot.characterId] = {
      ...soloSlot,
      finished: true,
      finishTime: timeLimitMs,
      finishRank: 1,
      score: 0
    };

    await updateDoc(liveRef, updates);
    await archiveRaceHistory(data.raceId, updatedSlots, data.targetTaps || DEFAULT_SETTINGS.requiredTaps, true);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export async function archiveRaceHistory(
  raceId: string,
  slots: Record<CharacterId, SlotState>,
  targetTaps: number,
  isSoloMode?: boolean
): Promise<void> {
  try {
    const winners: PodiumWinner[] = Object.values(slots)
      .filter((s) => s.finished || s.tapCount > 0)
      .sort((a, b) => {
        if (a.finishRank > 0 && b.finishRank > 0) return a.finishRank - b.finishRank;
        if (a.finishRank > 0) return -1;
        if (b.finishRank > 0) return 1;
        return b.tapCount - a.tapCount;
      })
      .map((s, index) => ({
        rank: s.finishRank > 0 ? s.finishRank : index + 1,
        characterId: s.characterId,
        name: s.playerName || CHARACTERS[s.characterId].name,
        company: s.playerCompany || 'Enterprise Corp',
        finishTimeSeconds: s.finishTime ? Number((s.finishTime / 1000).toFixed(2)) : 0,
        tapCount: s.tapCount,
        score: s.score || 0
      }));

    if (winners.length === 0) return;

    const historyId = `hist_${Date.now()}`;
    const historyRef = doc(db, HISTORY_COLLECTION, historyId);
    const historyRecord: RaceHistoryRecord = {
      raceId,
      date: new Date().toLocaleString(),
      targetTaps,
      title: 'Ransomware Rescue: Gigabit Run',
      winners,
      createdAt: new Date().toISOString(),
      isSoloMode: isSoloMode !== undefined ? isSoloMode : winners.length === 1
    };

    await setDoc(historyRef, historyRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, HISTORY_COLLECTION);
  }
}

export async function resetRaceLobby(_keepPlayers: boolean = false): Promise<void> {
  try {
    // Read current settings to use configured target taps
    const settingsRef = doc(db, 'game_settings', 'config');
    const settingsSnap = await getDoc(settingsRef).catch(() => null);

    let targetTaps = DEFAULT_SETTINGS.requiredTaps;
    let countdownDuration = DEFAULT_SETTINGS.countdownDuration;

    if (settingsSnap && settingsSnap.exists()) {
      const s = settingsSnap.data() as GameSettings;
      if (s.requiredTaps) targetTaps = Number(s.requiredTaps);
      if (s.countdownDuration) countdownDuration = Number(s.countdownDuration);
    }

    const liveRef = doc(db, 'live_race', 'current');
    
    // Per requirement: Automatically disconnect all devices after each game.
    // Always clear slots and generate a brand-new raceId so new QR codes are generated every game.
    const slots = createInitialSlots();

    const newRace: LiveRaceDoc = {
      raceId: `race_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'lobby',
      targetTaps,
      countdownRemaining: countdownDuration,
      isSoloMode: false,
      soloTimeLimit: SOLO_TIME_LIMIT_SECONDS,
      startedAt: 0,
      endedAt: 0,
      slots,
      updatedAt: new Date().toISOString()
    };

    await setDoc(liveRef, newRace);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, LIVE_RACE_PATH);
  }
}

export async function clearSlot(characterId: CharacterId): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    await updateDoc(liveRef, {
      [`slots.${characterId}.assigned`]: false,
      [`slots.${characterId}.playerId`]: '',
      [`slots.${characterId}.playerName`]: '',
      [`slots.${characterId}.playerCompany`]: '',
      [`slots.${characterId}.playerPosition`]: '',
      [`slots.${characterId}.playerEmail`]: '',
      [`slots.${characterId}.playerContact`]: '',
      [`slots.${characterId}.isReady`]: false,
      [`slots.${characterId}.tapCount`]: 0,
      [`slots.${characterId}.lastTapAt`]: 0,
      [`slots.${characterId}.finished`]: false,
      [`slots.${characterId}.finishTime`]: 0,
      [`slots.${characterId}.finishRank`]: 0,
      [`slots.${characterId}.score`]: 0,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export function subscribeRegistrations(
  onUpdate: (registrations: PlayerRegistration[]) => void,
  onError?: (err: Error) => void
) {
  const ref = collection(db, REGISTRATIONS_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<PlayerRegistration, 'id'>)
      }));
      onUpdate(list);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, REGISTRATIONS_COLLECTION);
    }
  );
}

export function subscribeRaceHistory(
  onUpdate: (history: RaceHistoryRecord[]) => void,
  onError?: (err: Error) => void
) {
  const ref = collection(db, HISTORY_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RaceHistoryRecord, 'id'>)
      }));
      onUpdate(list);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, HISTORY_COLLECTION);
    }
  );
}

export async function deleteRegistrationRecord(regId: string): Promise<void> {
  try {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, regId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REGISTRATIONS_COLLECTION}/${regId}`);
  }
}
