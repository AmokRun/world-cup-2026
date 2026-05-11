"use client";

import { useState, useEffect } from "react";
import { subscribeToMatches } from "@/lib/firebase/firestore";
import type { Match } from "@/lib/types";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribeToMatches((data) => {
      setMatches(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const matchesByMatchday = matches.reduce<Record<number, Match[]>>((acc, match) => {
    const day = match.matchday;
    acc[day] = acc[day] ? [...acc[day], match] : [match];
    return acc;
  }, {});

  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort((a, b) => a - b);

  return { matches, matchesByMatchday, matchdays, loading, error };
}
