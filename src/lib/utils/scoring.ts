import type { ScoreResult } from "@/lib/types";
import { SCORE_POINTS } from "@/lib/types";

export function calculateResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): ScoreResult {
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

export function getResultLabel(result: ScoreResult): string {
  switch (result) {
    case "exact":
      return "Exact Score";
    case "correct_winner":
      return "Correct Winner";
    case "wrong":
      return "Wrong";
  }
}

export function getResultColor(result: ScoreResult | null): string {
  switch (result) {
    case "exact":
      return "text-emerald-500";
    case "correct_winner":
      return "text-blue-500";
    case "wrong":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

export function getResultBadgeVariant(
  result: ScoreResult | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (result) {
    case "exact":
      return "default";
    case "correct_winner":
      return "secondary";
    case "wrong":
      return "destructive";
    default:
      return "outline";
  }
}
