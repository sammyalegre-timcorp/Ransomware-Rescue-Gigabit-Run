export type CharacterId = 'firewall_frank' | 'packet_pete' | 'cyber_kat' | 'agent_mal';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  tagline: string;
  description: string;
  specialty: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  borderGradient: string;
  avatarSvg: string; // inline SVG avatar graphic
  cyberQuote: string;
}

export type RaceStatus = 'lobby' | 'ready_check' | 'countdown' | 'racing' | 'podium';

export interface SlotState {
  characterId: CharacterId;
  assigned: boolean;
  playerId: string;
  playerName: string;
  playerCompany: string;
  playerPosition?: string;
  playerEmail?: string;
  playerContact?: string;
  isReady: boolean;
  tapCount: number;
  lastTapAt: number; // timestamp in ms for momentum tracking
  finished: boolean;
  finishTime: number; // elapsed milliseconds from race start
  finishRank: number; // 1, 2, 3, 4 (0 if not finished)
}

export interface LiveRaceDoc {
  raceId: string;
  status: RaceStatus;
  targetTaps: number;
  countdownRemaining: number;
  startedAt: number; // ms timestamp
  endedAt: number; // ms timestamp
  slots: Record<CharacterId, SlotState>;
  updatedAt: string;
}

export interface GameSettings {
  registrationEnabled: boolean;
  requiredTaps: number;
  countdownDuration: number;
  gameTitle: string;
  showTelemetryOnTrack: boolean;
  updatedAt?: string;
}

export interface PlayerRegistration {
  id?: string;
  playerId: string;
  characterId: CharacterId;
  name: string;
  company: string;
  contactNumber: string;
  position: string;
  email: string;
  createdAt: string;
}

export interface PodiumWinner {
  rank: number;
  characterId: CharacterId;
  name: string;
  company: string;
  finishTimeSeconds: number;
  tapCount: number;
}

export interface RaceHistoryRecord {
  id?: string;
  raceId: string;
  date: string;
  targetTaps: number;
  title: string;
  winners: PodiumWinner[];
  createdAt: string;
}
