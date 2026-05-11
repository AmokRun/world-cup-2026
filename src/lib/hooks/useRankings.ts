"use client";

import { useState, useEffect } from "react";
import { subscribeToRankings } from "@/lib/firebase/firestore";
import type { Ranking } from "@/lib/types";

export function useRankings() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToRankings((data) => {
      setRankings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { rankings, loading };
}
