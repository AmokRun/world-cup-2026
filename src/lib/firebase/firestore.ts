import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type Query,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { AppUser, Match, Prediction, Ranking, AppSettings, MatchdayRanking } from "@/lib/types";

// ─── Collection refs ──────────────────────────────────────────────────────────

export const usersCol = () => collection(db, "users");
export const matchesCol = () => collection(db, "matches");
export const predictionsCol = () => collection(db, "predictions");
export const rankingsCol = () => collection(db, "rankings");
export const matchdayRankingsCol = () => collection(db, "matchday_rankings");
export const settingsDoc = () => doc(db, "settings", "global");

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches(): Promise<Match[]> {
  const snap = await getDocs(query(matchesCol(), orderBy("kickoffTime", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);
}

export async function getMatchesByMatchday(matchday: number): Promise<Match[]> {
  const snap = await getDocs(
    query(matchesCol(), where("matchday", "==", matchday), orderBy("kickoffTime", "asc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const snap = await getDoc(doc(matchesCol(), matchId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Match) : null;
}

export async function createMatch(data: Omit<Match, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = doc(matchesCol());
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateMatch(matchId: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(matchesCol(), matchId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteMatch(matchId: string): Promise<void> {
  await deleteDoc(doc(matchesCol(), matchId));
}

export function subscribeToMatches(
  callback: (matches: Match[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(matchesCol(), orderBy("kickoffTime", "asc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match)),
  );
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const snap = await getDocs(
    query(predictionsCol(), where("userId", "==", userId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Prediction);
}

export async function getPrediction(userId: string, matchId: string): Promise<Prediction | null> {
  const snap = await getDocs(
    query(predictionsCol(), where("userId", "==", userId), where("matchId", "==", matchId), limit(1)),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Prediction;
}

export async function upsertPrediction(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  const existing = await getPrediction(userId, matchId);
  if (existing) {
    if (existing.isLocked) throw new Error("Prediction is locked");
    await updateDoc(doc(predictionsCol(), existing.id), {
      homeScore,
      awayScore,
      updatedAt: serverTimestamp(),
    });
  } else {
    const ref = doc(predictionsCol());
    await setDoc(ref, {
      userId,
      matchId,
      homeScore,
      awayScore,
      isLocked: false,
      points: null,
      result: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeToUserPredictions(
  userId: string,
  callback: (predictions: Prediction[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(predictionsCol(), where("userId", "==", userId)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Prediction)),
  );
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function getRankings(limitCount = 200): Promise<Ranking[]> {
  const snap = await getDocs(
    query(rankingsCol(), orderBy("totalPoints", "desc"), orderBy("exactScores", "desc"), limit(limitCount)),
  );
  return snap.docs.map((d) => ({ ...d.data() } as Ranking));
}

export async function getMatchdayRankings(matchday: number): Promise<MatchdayRanking[]> {
  const snap = await getDocs(
    query(
      matchdayRankingsCol(),
      where("matchday", "==", matchday),
      orderBy("points", "desc"),
      orderBy("exactScores", "desc"),
    ),
  );
  return snap.docs.map((d) => d.data() as MatchdayRanking);
}

export function subscribeToRankings(callback: (rankings: Ranking[]) => void): Unsubscribe {
  return onSnapshot(
    query(rankingsCol(), orderBy("totalPoints", "desc"), orderBy("exactScores", "desc"), limit(200)),
    (snap) => callback(snap.docs.map((d) => d.data() as Ranking)),
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(usersCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as AppUser);
}

export async function updateUserRole(uid: string, role: "admin" | "user"): Promise<void> {
  await updateDoc(doc(usersCol(), uid), { role, updatedAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(usersCol(), uid), { displayName, updatedAt: serverTimestamp() });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const snap = await getDoc(settingsDoc());
  if (snap.exists()) return snap.data() as AppSettings;
  const defaults: AppSettings = {
    notificationsEnabled: true,
    reminderHoursBeforeMatch: 2,
    maxUsers: 200,
    registrationOpen: true,
    currentMatchday: 1,
    lastScoringRun: null,
  };
  await setDoc(settingsDoc(), defaults);
  return defaults;
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  await updateDoc(settingsDoc(), data);
}
