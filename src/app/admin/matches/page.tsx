"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMatches, createMatch, updateMatch, deleteMatch } from "@/lib/firebase/firestore";
import { formatMatchDatetime } from "@/lib/utils/date";
import type { Match, MatchStage, MatchStatus } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { toast } from "sonner";

const matchSchema = z.object({
  matchday: z.coerce.number().min(1).max(60),
  stage: z.enum(["group", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"]),
  group: z.string().optional(),
  homeTeam: z.string().min(2),
  awayTeam: z.string().min(2),
  homeTeamFlag: z.string().length(2),
  awayTeamFlag: z.string().length(2),
  kickoffTime: z.string().min(1, "Required"),
  venue: z.string().min(2),
  city: z.string().min(2),
  homeScore: z.coerce.number().min(0).optional().nullable(),
  awayScore: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(["scheduled", "live", "finished", "cancelled"]),
});
type MatchFormData = z.infer<typeof matchSchema>;

const STATUS_COLORS: Record<MatchStatus, string> = {
  scheduled: "outline",
  live: "live",
  finished: "success",
  cancelled: "destructive",
} as const;

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedMatchday, setExpandedMatchday] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MatchFormData>({ resolver: zodResolver(matchSchema) });

  const watchStatus = watch("status");
  const watchStage = watch("stage");

  async function reload() {
    setLoading(true);
    setMatches(await getMatches());
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  function openCreate() {
    setEditing(null);
    reset({
      status: "scheduled",
      stage: "group",
      matchday: 1,
      homeScore: null,
      awayScore: null,
    });
    setDialogOpen(true);
  }

  function openEdit(match: Match) {
    setEditing(match);
    reset({
      ...match,
      kickoffTime: match.kickoffTime.toDate().toISOString().slice(0, 16),
      homeScore: match.homeScore ?? undefined,
      awayScore: match.awayScore ?? undefined,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: MatchFormData) {
    const payload = {
      ...data,
      kickoffTime: Timestamp.fromDate(new Date(data.kickoffTime)),
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      group: data.group || undefined,
    };
    try {
      if (editing) {
        await updateMatch(editing.id, payload);
        toast.success("Match updated");
      } else {
        await createMatch(payload as Omit<Match, "id" | "createdAt" | "updatedAt">);
        toast.success("Match created");
      }
      setDialogOpen(false);
      reload();
    } catch {
      toast.error("Failed to save match");
    }
  }

  async function handleDelete(matchId: string) {
    try {
      await deleteMatch(matchId);
      toast.success("Match deleted");
      reload();
    } catch {
      toast.error("Failed to delete match");
    }
    setDeleteConfirm(null);
  }

  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-sm text-muted-foreground">{matches.length} matches total</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Match
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No matches yet. Click "Add Match" or use the seed script.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matchdays.map((day) => {
            const dayMatches = matches.filter((m) => m.matchday === day);
            const isExpanded = expandedMatchday === day;
            return (
              <Card key={day} className="overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedMatchday(isExpanded ? null : day)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">Matchday {day}</span>
                    <Badge variant="secondary" className="text-xs">
                      {dayMatches.length} matches
                    </Badge>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {STAGE_LABELS[dayMatches[0].stage]}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {dayMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {match.homeTeam} vs {match.awayTeam}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMatchDatetime(match.kickoffTime)} · {match.city}
                          </p>
                        </div>

                        {match.status === "finished" && (
                          <span className="font-bold tabular-nums text-sm shrink-0">
                            {match.homeScore} – {match.awayScore}
                          </span>
                        )}

                        <Badge
                          variant={(STATUS_COLORS[match.status] as "outline" | "live" | "success" | "destructive") || "outline"}
                          className="shrink-0 text-xs"
                        >
                          {match.status}
                        </Badge>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(match)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(match.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Match" : "Add Match"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matchday</Label>
                <Input type="number" {...register("matchday")} />
                {errors.matchday && <p className="text-xs text-destructive">{errors.matchday.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select defaultValue={editing?.stage ?? "group"} onValueChange={(v) => setValue("stage", v as MatchStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {watchStage === "group" && (
              <div className="space-y-2">
                <Label>Group (e.g. A, B, C…)</Label>
                <Input {...register("group")} placeholder="A" className="uppercase" maxLength={1} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Team</Label>
                <Input {...register("homeTeam")} placeholder="Brazil" />
                {errors.homeTeam && <p className="text-xs text-destructive">{errors.homeTeam.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Away Team</Label>
                <Input {...register("awayTeam")} placeholder="Germany" />
                {errors.awayTeam && <p className="text-xs text-destructive">{errors.awayTeam.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Flag (2-letter code)</Label>
                <Input {...register("homeTeamFlag")} placeholder="BR" maxLength={2} className="uppercase" />
                {errors.homeTeamFlag && <p className="text-xs text-destructive">{errors.homeTeamFlag.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Away Flag (2-letter code)</Label>
                <Input {...register("awayTeamFlag")} placeholder="DE" maxLength={2} className="uppercase" />
                {errors.awayTeamFlag && <p className="text-xs text-destructive">{errors.awayTeamFlag.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kickoff Time (local)</Label>
              <Input type="datetime-local" {...register("kickoffTime")} />
              {errors.kickoffTime && <p className="text-xs text-destructive">{errors.kickoffTime.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input {...register("venue")} placeholder="MetLife Stadium" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("city")} placeholder="New York" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={editing?.status ?? "scheduled"} onValueChange={(v) => setValue("status", v as MatchStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(watchStatus === "finished" || watchStatus === "live") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Home Score</Label>
                  <Input type="number" min={0} {...register("homeScore")} />
                </div>
                <div className="space-y-2">
                  <Label>Away Score</Label>
                  <Input type="number" min={0} {...register("awayScore")} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Match"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Match?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All predictions for this match will remain but won&apos;t be counted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
