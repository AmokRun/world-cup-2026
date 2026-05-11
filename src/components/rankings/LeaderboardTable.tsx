"use client";

import { TrendingUp, TrendingDown, Minus, Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ranking } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface LeaderboardTableProps {
  rankings: Ranking[];
  currentUserId?: string;
  loading?: boolean;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="w-4 text-center text-sm font-semibold text-muted-foreground">{rank}</span>;
}

function RankChange({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const diff = previous - current; // positive = moved up
  if (diff > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (diff < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LeaderboardTable({ rankings, currentUserId, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium">No rankings yet</p>
        <p className="text-sm">Rankings will appear after the first matches are scored.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rankings.map((entry) => {
        const isCurrentUser = entry.userId === currentUserId;

        return (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              isCurrentUser
                ? "bg-primary/5 border-primary/20 dark:bg-primary/10"
                : "hover:bg-muted/50",
              entry.rank <= 3 && "border-transparent",
              entry.rank === 1 && "bg-yellow-50/50 dark:bg-yellow-950/20",
              entry.rank === 2 && "bg-slate-50 dark:bg-slate-900/50",
              entry.rank === 3 && "bg-amber-50/50 dark:bg-amber-950/20",
            )}
          >
            {/* Rank */}
            <div className="flex items-center gap-1 w-10 shrink-0">
              <RankIcon rank={entry.rank} />
              <RankChange current={entry.rank} previous={entry.previousRank} />
            </div>

            {/* Avatar */}
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={entry.photoURL ?? undefined} />
              <AvatarFallback className="text-xs font-semibold">
                {initials(entry.displayName)}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium text-sm truncate", isCurrentUser && "text-primary")}>
                {entry.displayName}
                {isCurrentUser && (
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.exactScores} exact · {entry.correctWinners} correct
              </p>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p className="font-bold text-lg tabular-nums leading-none">{entry.totalPoints}</p>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
