/**
 * Scoring utility for Solo Player Time Trial mode.
 * Rules:
 * - 15 second time limit.
 * - Fastest finish (in 1 second or less): 100 points.
 * - Finishing 1 second before the time runs out (14.0 seconds): 1 point.
 * - In-between (1.0s to 14.0s): Linear scaling from 100 down to 1 point.
 * - Finishing at or after 15.0s (or failing to finish): 0 points.
 */

export const SOLO_TIME_LIMIT_SECONDS = 15;

export function calculateSoloScore(finishTimeSeconds: number, timeLimitSeconds: number = SOLO_TIME_LIMIT_SECONDS): number {
  if (finishTimeSeconds <= 0) return 0;
  if (finishTimeSeconds <= 1.0) return 100;
  if (finishTimeSeconds >= timeLimitSeconds) return 0;
  if (finishTimeSeconds >= 14.0) return 1;

  // Linear scaling from 1.0s (100 pts) down to 14.0s (1 pt)
  // Interval width: 14.0 - 1.0 = 13.0
  const fraction = (14.0 - finishTimeSeconds) / 13.0;
  const score = Math.round(1 + fraction * 99);
  return Math.max(1, Math.min(100, score));
}

export interface ScoreGrade {
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  title: string;
  color: string;
  badgeBg: string;
}

export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 90) {
    return {
      grade: 'S',
      title: 'CYBER LEGEND // S-RANK',
      color: 'text-amber-300',
      badgeBg: 'from-amber-400 via-yellow-300 to-amber-500'
    };
  }
  if (score >= 70) {
    return {
      grade: 'A',
      title: 'ELITE DEFENDER // A-RANK',
      color: 'text-cyan-300',
      badgeBg: 'from-cyan-400 to-blue-500'
    };
  }
  if (score >= 45) {
    return {
      grade: 'B',
      title: 'SENIOR ENGINEER // B-RANK',
      color: 'text-emerald-300',
      badgeBg: 'from-emerald-400 to-teal-500'
    };
  }
  if (score >= 20) {
    return {
      grade: 'C',
      title: 'SECURITY OPERATOR // C-RANK',
      color: 'text-sky-300',
      badgeBg: 'from-sky-400 to-indigo-500'
    };
  }
  if (score >= 1) {
    return {
      grade: 'D',
      title: 'CLUTCH SURVIVOR // D-RANK',
      color: 'text-orange-300',
      badgeBg: 'from-orange-400 to-amber-600'
    };
  }
  return {
    grade: 'F',
    title: 'BREACH DETONATED // TIME EXPIRED',
    color: 'text-red-400',
    badgeBg: 'from-red-600 to-rose-800'
  };
}
