"use client";

import { useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/rankings/LeaderboardTable";
import { useRankings } from "@/lib/hooks/useRankings";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RankingsPage() {
  const { rankings, loading } = useRankings();
  const { user, appUser } = useAuth();

  const userRank = rankings.find((r) => r.userId === user?.uid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rankings</h1>
        <p className="text-muted-foreground text-sm">
          Global leaderboard — updated automatically after each match.
        </p>
      </div>

      {/* Current user position */}
      {userRank && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Your position</p>
              <p className="text-3xl font-bold tabular-nums">
                #{userRank.rank}
                <span className="text-base font-normal text-muted-foreground ml-2">
                  of {rankings.length}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">{userRank.totalPoints}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4">
          <LeaderboardTable
            rankings={rankings}
            currentUserId={user?.uid}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rankings.slice(0, 20).map((entry) => (
              <Card key={entry.userId} className="text-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{entry.displayName}</CardTitle>
                    <span className="text-xs text-muted-foreground">#{entry.rank}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-emerald-50 dark:bg-emerald-950/30 p-1.5">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {entry.exactScores}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">Exact</p>
                    </div>
                    <div className="rounded bg-blue-50 dark:bg-blue-950/30 p-1.5">
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {entry.correctWinners}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">Winner</p>
                    </div>
                    <div className="rounded bg-red-50 dark:bg-red-950/30 p-1.5">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {entry.wrongPredictions}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">Wrong</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">{entry.predictionsCount} predictions</span>
                    <span className="font-bold">{entry.totalPoints} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
