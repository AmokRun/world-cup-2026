import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { calculateResult, calculatePoints } from "./scoring";
import type { Match, Prediction, AppUser, Ranking } from "./types";

admin.initializeApp();
const db = admin.firestore();

// ─── Lock predictions at kickoff ─────────────────────────────────────────────

export const lockPredictionsOnMatchStart = functions.firestore.onDocumentUpdated(
  "matches/{matchId}",
  async (event) => {
    const before = event.data?.before.data() as Match | undefined;
    const after = event.data?.after.data() as Match | undefined;

    if (!before || !after) return;

    // Only trigger when status changes to "live" or "finished"
    const becameLiveOrFinished =
      before.status === "scheduled" &&
      (after.status === "live" || after.status === "finished");

    if (!becameLiveOrFinished) return;

    const matchId = event.params.matchId;
    const predsSnap = await db
      .collection("predictions")
      .where("matchId", "==", matchId)
      .where("isLocked", "==", false)
      .get();

    if (predsSnap.empty) return;

    const batch = db.batch();
    predsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isLocked: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    functions.logger.info(
      `Locked ${predsSnap.size} predictions for match ${matchId}`,
    );
  },
);

// ─── Score predictions when match finishes ───────────────────────────────────

export const scoreMatchOnResult = functions.firestore.onDocumentUpdated(
  "matches/{matchId}",
  async (event) => {
    const before = event.data?.before.data() as Match | undefined;
    const after = event.data?.after.data() as Match | undefined;

    if (!before || !after) return;

    // Only score when a finished match gets scores updated
    const scoresChanged =
      after.status === "finished" &&
      after.homeScore !== null &&
      after.awayScore !== null &&
      (before.status !== "finished" ||
        before.homeScore !== after.homeScore ||
        before.awayScore !== after.awayScore);

    if (!scoresChanged) return;

    const matchId = event.params.matchId;
    await scorePredictionsForMatch(
      matchId,
      after.homeScore!,
      after.awayScore!,
    );
  },
);

// ─── Callable: recalculate all scores ────────────────────────────────────────

export const recalculateScores = functions.https.onCall(
  { enforceAppCheck: false },
  async (request) => {
    // Verify caller is admin
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated");
    }
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin only");
    }

    const matchesSnap = await db
      .collection("matches")
      .where("status", "==", "finished")
      .get();

    let processed = 0;
    for (const matchDoc of matchesSnap.docs) {
      const match = matchDoc.data() as Match;
      if (match.homeScore === null || match.awayScore === null) continue;
      await scorePredictionsForMatch(matchDoc.id, match.homeScore, match.awayScore);
      processed++;
    }

    await db
      .collection("settings")
      .doc("global")
      .update({ lastScoringRun: FieldValue.serverTimestamp() });

    await rebuildRankings();

    return { processed };
  },
);

// ─── Rebuild rankings ─────────────────────────────────────────────────────────

async function scorePredictionsForMatch(
  matchId: string,
  actualHome: number,
  actualAway: number,
): Promise<void> {
  const predsSnap = await db
    .collection("predictions")
    .where("matchId", "==", matchId)
    .where("isLocked", "==", true)
    .get();

  if (predsSnap.empty) return;

  const batch = db.batch();
  const userUpdates = new Map<
    string,
    { pointsDelta: number; exact: number; correct: number; wrong: number }
  >();

  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data() as Prediction;

    // Skip already scored
    if (pred.result !== null) continue;

    const result = calculateResult(
      pred.homeScore,
      pred.awayScore,
      actualHome,
      actualAway,
    );
    const points = calculatePoints(
      pred.homeScore,
      pred.awayScore,
      actualHome,
      actualAway,
    );

    batch.update(predDoc.ref, {
      result,
      points,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const prev = userUpdates.get(pred.userId) ?? {
      pointsDelta: 0,
      exact: 0,
      correct: 0,
      wrong: 0,
    };
    userUpdates.set(pred.userId, {
      pointsDelta: prev.pointsDelta + points,
      exact: prev.exact + (result === "exact" ? 1 : 0),
      correct: prev.correct + (result === "correct_winner" ? 1 : 0),
      wrong: prev.wrong + (result === "wrong" ? 1 : 0),
    });
  }

  await batch.commit();

  // Update user documents
  const userBatch = db.batch();
  for (const [userId, delta] of userUpdates.entries()) {
    const userRef = db.collection("users").doc(userId);
    userBatch.update(userRef, {
      totalPoints: FieldValue.increment(delta.pointsDelta),
      exactScores: FieldValue.increment(delta.exact),
      correctWinners: FieldValue.increment(delta.correct),
      wrongPredictions: FieldValue.increment(delta.wrong),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await userBatch.commit();

  // Rebuild rankings after scoring
  await rebuildRankings();
}

async function rebuildRankings(): Promise<void> {
  const usersSnap = await db
    .collection("users")
    .orderBy("totalPoints", "desc")
    .orderBy("exactScores", "desc")
    .get();

  // Fetch existing ranks for previousRank
  const existingRankings = new Map<string, number>();
  const existingSnap = await db.collection("rankings").get();
  existingSnap.docs.forEach((d) => {
    const data = d.data() as Ranking;
    existingRankings.set(data.userId, data.rank);
  });

  const batch = db.batch();
  let rank = 1;
  let prevPoints = -1;
  let prevExact = -1;
  let tieRank = 1;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data() as AppUser;

    // Tie-breaking: same rank if same points and exact scores
    if (user.totalPoints === prevPoints && user.exactScores === prevExact) {
      // keep tieRank
    } else {
      tieRank = rank;
    }
    prevPoints = user.totalPoints;
    prevExact = user.exactScores;

    const rankingRef = db.collection("rankings").doc(user.uid);
    const rankingData: Omit<Ranking, "lastUpdated"> & { lastUpdated: typeof FieldValue.serverTimestamp } = {
      userId: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      totalPoints: user.totalPoints,
      exactScores: user.exactScores,
      correctWinners: user.correctWinners,
      wrongPredictions: user.wrongPredictions,
      predictionsCount: user.predictionsCount,
      rank: tieRank,
      previousRank: existingRankings.get(user.uid) ?? null,
      lastUpdated: FieldValue.serverTimestamp() as unknown as typeof FieldValue.serverTimestamp,
    };

    batch.set(rankingRef, rankingData, { merge: false });
    rank++;
  }

  await batch.commit();
}

// ─── Scheduled: send match reminders ─────────────────────────────────────────

export const sendMatchReminders = functions.scheduler.onSchedule(
  "every 30 minutes",
  async () => {
    const settingsDoc = await db.collection("settings").doc("global").get();
    const settings = settingsDoc.data();
    if (!settings?.notificationsEnabled) return;

    const hoursAhead = settings.reminderHoursBeforeMatch ?? 2;
    const now = admin.firestore.Timestamp.now();
    const windowEnd = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + hoursAhead * 60 * 60 * 1000,
    );
    const windowStart = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + (hoursAhead - 0.5) * 60 * 60 * 1000,
    );

    const matchesSnap = await db
      .collection("matches")
      .where("status", "==", "scheduled")
      .where("kickoffTime", ">=", windowStart)
      .where("kickoffTime", "<=", windowEnd)
      .get();

    if (matchesSnap.empty) return;

    for (const matchDoc of matchesSnap.docs) {
      const match = matchDoc.data() as Match;

      // Find users who haven't predicted yet
      const predsSnap = await db
        .collection("predictions")
        .where("matchId", "==", matchDoc.id)
        .get();
      const predictedUserIds = new Set(predsSnap.docs.map((d) => d.data().userId as string));

      const usersSnap = await db.collection("users").get();
      const unpredictedUsers = usersSnap.docs
        .map((d) => d.data() as AppUser)
        .filter((u) => !predictedUserIds.has(u.uid));

      functions.logger.info(
        `Match ${match.homeTeam} vs ${match.awayTeam} starts soon. ` +
          `${unpredictedUsers.length} users haven't predicted.`,
      );

      // In a real app, you would send FCM notifications or emails here.
      // This logs the reminder candidates.
    }
  },
);
