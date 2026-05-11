"use client";

import { useMemo } from "react";
import { Target, CheckCircle2, XCircle, Minus, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches } from "@/lib/hooks/useMatches";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-full p-2", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PredictionsPage() {
  const { appUser } = useAuth();
  const { matches, loading: matchesLoading } = useMatches();
  const { predictions, predictionsByMatchId, loading: predsLoading, savePrediction } = usePredictions();

  const loading = matchesLoading || predsLoading;

  const stats = useMemo(() => {
    const exact = predictions.filter((p) => p.result === "exact").length;
    const correct = predictions.filter((p) => p.result === "correct_winner").length;
    const wrong = predictions.filter((p) => p.result === "wrong").length;
    const pending = predictions.filter((p) => p.result === null).length;
    const total = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
    return { exact, correct, wrong, pending, total };
  }, [predictions]);

  const { upcomingMatches, finishedMatches } = useMemo(() => {
    const upcoming = matches.filter(
      (m) => m.status === "scheduled" || m.status === "live",
    );
    const finished = matches.filter((m) => m.status === "finished");
    return { upcomingMatches: upcoming, finishedMatches: finished };
  }, [matches]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Predictions</h1>
        <p className="text-muted-foreground text-sm">Track your picks and points.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Points"
          value={appUser?.totalPoints ?? stats.total}
          icon={Trophy}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
        <StatCard
          label="Exact Scores"
          value={appUser?.exactScores ?? stats.exact}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Correct Winner"
          value={appUser?.correctWinners ?? stats.correct}
          icon={Target}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Wrong"
          value={appUser?.wrongPredictions ?? stats.wrong}
          icon={XCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming
            {upcomingMatches.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {upcomingMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            Results
            {finishedMatches.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {finishedMatches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No upcoming matches at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsByMatchId[match.id]}
                  onSavePrediction={savePrediction}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {finishedMatches.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No results yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {finishedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsByMatchId[match.id]}
                  showResult
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
