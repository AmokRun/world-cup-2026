/**
 * Seed script: populates Firestore with World Cup 2026 group-stage fixtures.
 * Run with: npx ts-node -e "require('./scripts/seed.ts')"
 * Or after compiling: node scripts/seed.js
 *
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars
 * (or a serviceAccountKey.json file path)
 */

import * as admin from "firebase-admin";
import type { Timestamp } from "firebase-admin/firestore";

// Initialize admin SDK
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
  }
}

const db = admin.firestore();

// WC 2026 kicks off June 11 in Mexico City, co-hosted by USA, Canada, Mexico
const MATCHES: Omit<admin.firestore.DocumentData, "id" | "createdAt" | "updatedAt">[] = [
  // ── Matchday 1 ─────────────────────────────────────────────────────────────
  {
    matchday: 1, stage: "group", group: "A",
    homeTeam: "Mexico", awayTeam: "Ecuador",
    homeTeamFlag: "MX", awayTeamFlag: "EC",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-11T21:00:00-06:00")),
    venue: "Estadio Azteca", city: "Mexico City", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "B",
    homeTeam: "USA", awayTeam: "Serbia",
    homeTeamFlag: "US", awayTeamFlag: "RS",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-12T15:00:00-05:00")),
    venue: "SoFi Stadium", city: "Los Angeles", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "C",
    homeTeam: "Canada", awayTeam: "Germany",
    homeTeamFlag: "CA", awayTeamFlag: "DE",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-13T18:00:00-05:00")),
    venue: "BMO Field", city: "Toronto", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "D",
    homeTeam: "Brazil", awayTeam: "Croatia",
    homeTeamFlag: "BR", awayTeamFlag: "HR",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-14T15:00:00-05:00")),
    venue: "MetLife Stadium", city: "New York", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "E",
    homeTeam: "France", awayTeam: "Belgium",
    homeTeamFlag: "FR", awayTeamFlag: "BE",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-14T18:00:00-05:00")),
    venue: "AT&T Stadium", city: "Dallas", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "F",
    homeTeam: "Spain", awayTeam: "Colombia",
    homeTeamFlag: "ES", awayTeamFlag: "CO",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-15T15:00:00-05:00")),
    venue: "Levi's Stadium", city: "San Francisco", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "G",
    homeTeam: "Argentina", awayTeam: "Saudi Arabia",
    homeTeamFlag: "AR", awayTeamFlag: "SA",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-15T18:00:00-05:00")),
    venue: "Hard Rock Stadium", city: "Miami", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 1, stage: "group", group: "H",
    homeTeam: "England", awayTeam: "Iran",
    homeTeamFlag: "GB", awayTeamFlag: "IR",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-16T15:00:00-05:00")),
    venue: "Gillette Stadium", city: "Boston", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  // ── Matchday 2 (examples) ──────────────────────────────────────────────────
  {
    matchday: 2, stage: "group", group: "A",
    homeTeam: "Mexico", awayTeam: "Poland",
    homeTeamFlag: "MX", awayTeamFlag: "PL",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-19T15:00:00-06:00")),
    venue: "Estadio Azteca", city: "Mexico City", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  {
    matchday: 2, stage: "group", group: "B",
    homeTeam: "USA", awayTeam: "Panama",
    homeTeamFlag: "US", awayTeamFlag: "PA",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-20T18:00:00-05:00")),
    venue: "Lumen Field", city: "Seattle", status: "scheduled",
    homeScore: null, awayScore: null,
  },
  // ── Finished example for demo ──────────────────────────────────────────────
  {
    matchday: 1, stage: "group", group: "I",
    homeTeam: "Portugal", awayTeam: "Morocco",
    homeTeamFlag: "PT", awayTeamFlag: "MA",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-12T12:00:00-05:00")),
    venue: "Arrowhead Stadium", city: "Kansas City", status: "finished",
    homeScore: 2, awayScore: 1,
  },
  {
    matchday: 1, stage: "group", group: "J",
    homeTeam: "Netherlands", awayTeam: "Senegal",
    homeTeamFlag: "NL", awayTeamFlag: "SN",
    kickoffTime: admin.firestore.Timestamp.fromDate(new Date("2026-06-12T18:00:00-05:00")),
    venue: "Lincoln Financial Field", city: "Philadelphia", status: "finished",
    homeScore: 1, awayScore: 1,
  },
];

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  // Seed matches
  const batch = db.batch();
  for (const match of MATCHES) {
    const ref = db.collection("matches").doc();
    batch.set(ref, {
      ...match,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`✅ Created ${MATCHES.length} matches`);

  // Seed settings
  await db.collection("settings").doc("global").set(
    {
      notificationsEnabled: true,
      reminderHoursBeforeMatch: 2,
      maxUsers: 200,
      registrationOpen: true,
      currentMatchday: 1,
      lastScoringRun: null,
    },
    { merge: true },
  );
  console.log("✅ Settings initialized");

  console.log("\n🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
