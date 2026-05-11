import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
  predictionsCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";
export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export interface Match {
  id: string;
  matchday: number;
  stage: MatchStage;
  group?: string; // e.g. "A", "B", ... only for group stage
  homeTeam: string;
  awayTeam: string;
  homeTeamFlag: string; // ISO 3166-1 alpha-2 country code
  awayTeamFlag: string;
  kickoffTime: Timestamp;
  venue: string;
  city: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Prediction ───────────────────────────────────────────────────────────────

export type PredictionResult = "exact" | "correct_winner" | "wrong" | null;

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  isLocked: boolean;
  points: number | null;
  result: PredictionResult;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export interface Ranking {
  userId: string;
  displayName: string;
  photoURL: string | null;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
  predictionsCount: number;
  rank: number;
  previousRank: number | null;
  lastUpdated: Timestamp;
}

export interface MatchdayRanking {
  userId: string;
  displayName: string;
  photoURL: string | null;
  matchday: number;
  points: number;
  exactScores: number;
  rank: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHoursBeforeMatch: number;
  maxUsers: number;
  registrationOpen: boolean;
  currentMatchday: number;
  lastScoringRun: Timestamp | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface MatchWithPrediction extends Match {
  prediction?: Prediction;
}

export type ScoreResult = "exact" | "correct_winner" | "wrong";

export const SCORE_POINTS: Record<ScoreResult, number> = {
  exact: 5,
  correct_winner: 3,
  wrong: 0,
};

export const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-Final",
  semi_final: "Semi-Final",
  third_place: "Third Place",
  final: "Final",
};
