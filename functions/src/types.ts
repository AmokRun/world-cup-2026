import type { Timestamp } from "firebase-admin/firestore";

export type UserRole = "admin" | "user";
export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";
export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";
export type PredictionResult = "exact" | "correct_winner" | "wrong" | null;

export interface Match {
  id: string;
  matchday: number;
  stage: MatchStage;
  group?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFlag: string;
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

export const SCORE_POINTS = { exact: 5, correct_winner: 3, wrong: 0 } as const;
