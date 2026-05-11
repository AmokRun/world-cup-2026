"use client";

import { useState, useEffect, useCallback } from "react";
import { subscribeToUserPredictions, upsertPrediction } from "@/lib/firebase/firestore";
import { useAuth } from "./useAuth";
import type { Prediction } from "@/lib/types";
import { toast } from "sonner";

export function usePredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPredictions([]);
      setLoading(false);
      return;
    }
    const unsub = subscribeToUserPredictions(user.uid, (data) => {
      setPredictions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const predictionsByMatchId = predictions.reduce<Record<string, Prediction>>((acc, p) => {
    acc[p.matchId] = p;
    return acc;
  }, {});

  const savePrediction = useCallback(
    async (matchId: string, homeScore: number, awayScore: number) => {
      if (!user) return;
      try {
        await upsertPrediction(user.uid, matchId, homeScore, awayScore);
        toast.success("Prediction saved!");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save prediction";
        toast.error(msg);
        throw err;
      }
    },
    [user],
  );

  return { predictions, predictionsByMatchId, loading, savePrediction };
}
