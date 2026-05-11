"use client";

import { useState } from "react";
import { Clock, MapPin, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamDisplay } from "./TeamDisplay";
import { PredictionInput } from "@/components/predictions/PredictionInput";
import type { Match, Prediction } from "@/lib/types";
import { formatMatchTime, formatMatchDate, isMatchLocked } from "@/lib/utils/date";
import { getResultColor, getResultLabel } from "@/lib/utils/scoring";
import { cn } from "@/lib/utils/cn";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onSavePrediction?: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  showResult?: boolean;
}

function MatchStatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live") return <Badge variant="live">LIVE</Badge>;
  if (status === "finished") return <Badge variant="outline" className="text-muted-foreground">FT</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return null;
}

export function MatchCard({ match, prediction, onSavePrediction, showResult = false }: MatchCardProps) {
  const locked = isMatchLocked(match.kickoffTime);
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isLive && "border-red-400/50 dark:border-red-600/50",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{formatMatchDate(match.kickoffTime)} · {formatMatchTime(match.kickoffTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MatchStatusBadge status={match.status} />
            {locked && match.status === "scheduled" && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <TeamDisplay name={match.homeTeam} flagCode={match.homeTeamFlag} />
          </div>

          {isFinished || isLive ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-bold tabular-nums w-7 text-center">
                {match.homeScore ?? "–"}
              </span>
              <span className="text-muted-foreground font-medium">:</span>
              <span className="text-2xl font-bold tabular-nums w-7 text-center">
                {match.awayScore ?? "–"}
              </span>
            </div>
          ) : (
            <div className="text-sm font-semibold text-muted-foreground shrink-0">vs</div>
          )}

          <div className="flex-1 min-w-0 flex justify-end">
            <TeamDisplay name={match.awayTeam} flagCode={match.awayTeamFlag} align="right" />
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{match.venue}, {match.city}</span>
        </div>

        {/* Prediction area */}
        {onSavePrediction && !locked && (
          <PredictionInput
            matchId={match.id}
            prediction={prediction}
            onSave={onSavePrediction}
          />
        )}

        {/* Locked prediction display */}
        {locked && prediction && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm flex items-center justify-between",
              prediction.result && "border-transparent",
              prediction.result === "exact" && "bg-emerald-50 dark:bg-emerald-950/30",
              prediction.result === "correct_winner" && "bg-blue-50 dark:bg-blue-950/30",
              prediction.result === "wrong" && "bg-red-50 dark:bg-red-950/30",
              !prediction.result && "bg-muted/50",
            )}
          >
            <span className="text-muted-foreground text-xs">Your pick:</span>
            <span className="font-bold tabular-nums">
              {prediction.homeScore} – {prediction.awayScore}
            </span>
            {prediction.result && (
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-medium", getResultColor(prediction.result))}>
                  {getResultLabel(prediction.result)}
                </span>
                <span className="font-bold text-sm">
                  +{prediction.points}
                  <span className="text-xs font-normal text-muted-foreground">pts</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* No prediction + locked */}
        {locked && !prediction && match.status === "scheduled" && (
          <p className="text-xs text-muted-foreground text-center py-1">
            No prediction submitted
          </p>
        )}
      </CardContent>
    </Card>
  );
}
