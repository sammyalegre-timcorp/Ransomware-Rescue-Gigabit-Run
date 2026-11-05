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
      finishRank: 0
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
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as LiveRaceDoc);
      } else {
        const initialRace: LiveRaceDoc = {
          raceId: `race_${Date.now()}`,
          status: 'lobby',
          targetTaps: DEFAULT_SETTINGS.requiredTaps,
          countdownRemaining: DEFAULT_SETTINGS.countdownDuration,
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

    // Also update the live race slot for this character
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      const slots = { ...data.slots };
      slots[registration.characterId] = {
        ...(slots[registration.characterId] || {
          characterId: registration.characterId,
          tapCount: 0,
          lastTapAt: 0,
          finished: false,
          finishTime: 0,
          finishRank: 0
        }),
        assigned: true,
        playerId: regId,
        playerName: registration.name,
        playerCompany: registration.company,
        playerPosition: registration.position,
        playerEmail: registration.email,
        playerContact: registration.contactNumber,
        isReady: false
      };

      await updateDoc(liveRef, {
        slots,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, REGISTRATIONS_COLLECTION);
  }
}

export async function joinSlotDirectly(
  characterId: CharacterId,
  playerName: string = 'Racer'
): Promise<string> {
  try {
    const playerId = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      const slots = { ...data.slots };
      slots[characterId] = {
        ...(slots[characterId] || {
          characterId,
          tapCount: 0,
          lastTapAt: 0,
          finished: false,
          finishTime: 0,
          finishRank: 0
        }),
        assigned: true,
        playerId,
        playerName: playerName || CHARACTERS[characterId].name,
        playerCompany: 'Cyber Team',
        isReady: false
      };
      await updateDoc(liveRef, {
        slots,
        updatedAt: new Date().toISOString()
      });
    }
    return playerId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, LIVE_RACE_PATH);
  }
}

export async function setPlayerReady(characterId: CharacterId, isReady: boolean): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      const slots = { ...data.slots };
      if (slots[characterId]) {
        slots[characterId].isReady = isReady;
        await updateDoc(liveRef, {
          slots,
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export async function startCountdown(countdownSeconds: number, targetTaps?: number): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      // Reset taps for all slots
      const slots = { ...data.slots };
      for (const key of Object.keys(slots) as CharacterId[]) {
        slots[key] = {
          ...slots[key],
          tapCount: 0,
          lastTapAt: 0,
          finished: false,
          finishTime: 0,
          finishRank: 0
        };
      }
      await updateDoc(liveRef, {
        status: 'countdown',
        countdownRemaining: countdownSeconds,
        targetTaps: targetTaps || data.targetTaps || DEFAULT_SETTINGS.requiredTaps,
        startedAt: 0,
        endedAt: 0,
        slots,
        updatedAt: new Date().toISOString()
      });
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
  const slot = currentLiveRace.slots[characterId];
  if (!slot || slot.finished) return;

  const newTapCount = slot.tapCount + tapDelta;
  const now = Date.now();
  const isNowFinished = newTapCount >= currentLiveRace.targetTaps;

  try {
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    if (!snap.exists()) return;

    const data = snap.data() as LiveRaceDoc;
    if (data.status !== 'racing') return;

    const slots = { ...data.slots };
    const targetSlot = slots[characterId];
    if (!targetSlot || targetSlot.finished) return;

    const actualNewTap = Math.min(targetSlot.tapCount + tapDelta, data.targetTaps);
    const finishedNow = actualNewTap >= data.targetTaps;

    let finishRank = targetSlot.finishRank;
    let finishTime = targetSlot.finishTime;

    if (finishedNow && !targetSlot.finished) {
      // Calculate rank based on existing finishers
      const finishedSlots = Object.values(slots).filter((s) => s.finished && s.characterId !== characterId);
      finishRank = finishedSlots.length + 1;
      const raceStartTime = data.startedAt || now;
      finishTime = Math.max(1, now - raceStartTime);
    }

    slots[characterId] = {
      ...targetSlot,
      tapCount: actualNewTap,
      lastTapAt: now,
      finished: finishedNow,
      finishRank,
      finishTime
    };

    // Check if race should finish
    // A race finishes when all assigned active players have finished,
    // or when the 1st place finishes and others stop, or when all 4 slots are done.
    const assignedSlots = Object.values(slots).filter((s) => s.assigned);
    const allAssignedFinished =
      assignedSlots.length > 0 && assignedSlots.every((s) => s.finished);

    const updatePayload: Partial<LiveRaceDoc> = {
      slots,
      updatedAt: new Date().toISOString()
    };

    if (allAssignedFinished) {
      updatePayload.status = 'podium';
      updatePayload.endedAt = now;
    }

    await updateDoc(liveRef, updatePayload);

    // If all finished, archive to race_history
    if (allAssignedFinished) {
      await archiveRaceHistory(data.raceId, slots, data.targetTaps);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LIVE_RACE_PATH);
  }
}

export async function archiveRaceHistory(
  raceId: string,
  slots: Record<CharacterId, SlotState>,
  targetTaps: number
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
        tapCount: s.tapCount
      }));

    if (winners.length === 0) return;

    const historyId = `hist_${Date.now()}`;
    const historyRef = doc(db, HISTORY_COLLECTION, historyId);
    const historyRecord: RaceHistoryRecord = {
      raceId,
      date: new Date().toLocaleString(),
      targetTaps,
      title: 'Gigabit Circuit Run',
      winners,
      createdAt: new Date().toISOString()
    };

    await setDoc(historyRef, historyRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, HISTORY_COLLECTION);
  }
}

export async function resetRaceLobby(keepPlayers: boolean = false): Promise<void> {
  try {
    const liveRef = doc(db, 'live_race', 'current');
    const snap = await getDoc(liveRef);
    let slots = createInitialSlots();

    if (keepPlayers && snap.exists()) {
      const prevSlots = (snap.data() as LiveRaceDoc).slots;
      slots = { ...prevSlots };
      for (const key of Object.keys(slots) as CharacterId[]) {
        slots[key] = {
          ...slots[key],
          isReady: false,
          tapCount: 0,
          lastTapAt: 0,
          finished: false,
          finishTime: 0,
          finishRank: 0
        };
      }
    }

    const newRace: LiveRaceDoc = {
      raceId: `race_${Date.now()}`,
      status: 'lobby',
      targetTaps: DEFAULT_SETTINGS.requiredTaps,
      countdownRemaining: DEFAULT_SETTINGS.countdownDuration,
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
    const snap = await getDoc(liveRef);
    if (snap.exists()) {
      const data = snap.data() as LiveRaceDoc;
      const slots = { ...data.slots };
      slots[characterId] = {
        characterId,
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
        finishRank: 0
      };
      await updateDoc(liveRef, {
        slots,
        updatedAt: new Date().toISOString()
      });
    }
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
