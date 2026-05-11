import { format, formatDistanceToNow, isBefore, isAfter, addMinutes } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  return ts.toDate();
}

export function formatMatchDate(ts: Timestamp): string {
  return format(ts.toDate(), "EEE, MMM d yyyy");
}

export function formatMatchTime(ts: Timestamp): string {
  return format(ts.toDate(), "HH:mm");
}

export function formatMatchDatetime(ts: Timestamp): string {
  return format(ts.toDate(), "EEE, MMM d · HH:mm");
}

export function formatRelative(ts: Timestamp): string {
  return formatDistanceToNow(ts.toDate(), { addSuffix: true });
}

export function isMatchLocked(kickoffTime: Timestamp): boolean {
  return isBefore(kickoffTime.toDate(), new Date());
}

export function isMatchUpcoming(kickoffTime: Timestamp): boolean {
  return isAfter(kickoffTime.toDate(), new Date());
}

export function isMatchStartingSoon(kickoffTime: Timestamp, hoursThreshold = 2): boolean {
  const now = new Date();
  const threshold = addMinutes(now, hoursThreshold * 60);
  return isAfter(kickoffTime.toDate(), now) && isBefore(kickoffTime.toDate(), threshold);
}

export function groupMatchesByDate(matches: { kickoffTime: Timestamp }[]): Map<string, typeof matches> {
  const groups = new Map<string, typeof matches>();
  for (const match of matches) {
    const key = format(match.kickoffTime.toDate(), "yyyy-MM-dd");
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, match]);
  }
  return groups;
}
