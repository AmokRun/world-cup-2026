"use client";

import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { RefreshCw, Users, Calendar, Trophy, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { functions } from "@/lib/firebase/config";
import { getMatches, getUsers, getSettings } from "@/lib/firebase/firestore";
import type { AppSettings, Match, AppUser } from "@/lib/types";
import { toast } from "sonner";
import { formatRelative } from "@/lib/utils/date";
import { Timestamp } from "firebase/firestore";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    finishedMatches: 0,
    scheduledMatches: 0,
  });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [matchList, userList, appSettings] = await Promise.all([
        getMatches(),
        getUsers(),
        getSettings(),
      ]);
      setStats({
        totalUsers: userList.length,
        totalMatches: matchList.length,
        finishedMatches: matchList.filter((m) => m.status === "finished").length,
        scheduledMatches: matchList.filter((m) => m.status === "scheduled").length,
      });
      setSettings(appSettings);
      setLoading(false);
    }
    load();
  }, []);

  async function handleRecalculate() {
    setRecalcLoading(true);
    try {
      const fn = httpsCallable(functions, "recalculateScores");
      await fn({});
      toast.success("Scores recalculated successfully");
    } catch {
      toast.error("Failed to recalculate scores");
    } finally {
      setRecalcLoading(false);
    }
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Total Matches", value: stats.totalMatches, icon: Calendar, color: "text-purple-500" },
    { label: "Finished", value: stats.finishedMatches, icon: Trophy, color: "text-emerald-500" },
    { label: "Upcoming", value: stats.scheduledMatches, icon: Activity, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage the World Cup 2026 prediction pool.</p>
        </div>
        <Button onClick={handleRecalculate} disabled={recalcLoading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${recalcLoading ? "animate-spin" : ""}`} />
          Recalculate Scores
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-8 w-8 ${color} opacity-80`} />
              <div>
                <p className="text-2xl font-bold tabular-nums">{loading ? "…" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last scoring */}
      {settings?.lastScoringRun && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Last score calculation</p>
              <p className="text-xs text-muted-foreground">
                {formatRelative(settings.lastScoringRun)}
              </p>
            </div>
            <Badge variant="outline">Auto + Manual</Badge>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Match Management</CardTitle>
            <CardDescription>
              Import match schedule, update results, manage matchdays.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/matches">Go to Matches →</a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">User Management</CardTitle>
            <CardDescription>
              View all users, manage roles, review participation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/users">Go to Users →</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
