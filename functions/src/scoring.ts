import type { PredictionResult } from "./types";
import { SCORE_POINTS } from "./types";

export function calculateResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): Exclude<PredictionResult, null> {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return "exact";
  }
  const predictedWinner = Math.sign(predictedHome - predictedAway);
  const actualWinner = Math.sign(actualHome - actualAway);
  if (predictedWinner === actualWinner) {
    return "correct_winner";
  }
  return "wrong";
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): number {
  const result = calculateResult(predictedHome, predictedAway, actualHome, actualAway);
  return SCORE_POINTS[result];
}
