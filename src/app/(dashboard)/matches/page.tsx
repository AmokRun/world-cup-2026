"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches } from "@/lib/hooks/useMatches";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { STAGE_LABELS } from "@/lib/types";
import type { Metadata } from "next";

export default function MatchesPage() {
  const { matches, matchdays, loading: matchesLoading } = useMatches();
  const { predictionsByMatchId, savePrediction } = usePredictions();
  const [activeMatchday, setActiveMatchday] = useState<string>("all");

  const filteredMatches = useMemo(() => {
    if (activeMatchday === "all") return matches;
    return matches.filter((m) => m.matchday === Number(activeMatchday));
  }, [matches, activeMatchday]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, typeof filteredMatches>();
    for (const match of filteredMatches) {
      const key = format(match.kickoffTime.toDate(), "yyyy-MM-dd");
      const existing = groups.get(key) ?? [];
      groups.set(key, [...existing, match]);
    }
    return groups;
  }, [filteredMatches]);

  if (matchesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
        <p className="text-muted-foreground">The match schedule will appear here once the admin imports it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
        <p className="text-muted-foreground text-sm">
          Submit your score predictions before kickoff. Predictions lock automatically.
        </p>
      </div>

      {/* Matchday filter tabs */}
      <Tabs value={activeMatchday} onValueChange={setActiveMatchday}>
        <div className="overflow-x-auto -mx-4 px-4 pb-1">
          <TabsList className="inline-flex h-auto p-1 gap-1">
            <TabsTrigger value="all" className="text-xs px-3 py-1.5">All</TabsTrigger>
            {matchdays.map((day) => (
              <TabsTrigger key={day} value={String(day)} className="text-xs px-3 py-1.5">
                MD {day}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeMatchday} className="mt-4 space-y-6">
          {groupedByDate.size === 0 && (
            <p className="text-center text-muted-foreground py-10">No matches found.</p>
          )}
          {Array.from(groupedByDate.entries()).map(([dateKey, dayMatches]) => (
            <section key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">
                  {format(new Date(dateKey), "EEEE, MMMM d")}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {dayMatches.length} {dayMatches.length === 1 ? "match" : "matches"}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {dayMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictionsByMatchId[match.id]}
                    onSavePrediction={savePrediction}
                  />
                ))}
              </div>
            </section>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
