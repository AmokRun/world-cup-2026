"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Prediction } from "@/lib/types";

interface PredictionInputProps {
  matchId: string;
  prediction?: Prediction;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
}

export function PredictionInput({ matchId, prediction, onSave }: PredictionInputProps) {
  const [homeScore, setHomeScore] = useState<string>(
    prediction?.homeScore?.toString() ?? "",
  );
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.awayScore?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    homeScore !== (prediction?.homeScore?.toString() ?? "") ||
    awayScore !== (prediction?.awayScore?.toString() ?? "");

  const isValid =
    homeScore !== "" &&
    awayScore !== "" &&
    Number.isInteger(Number(homeScore)) &&
    Number.isInteger(Number(awayScore)) &&
    Number(homeScore) >= 0 &&
    Number(awayScore) >= 0 &&
    Number(homeScore) <= 30 &&
    Number(awayScore) <= 30;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave(matchId, Number(homeScore), Number(awayScore));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isValid && isDirty) handleSave();
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground flex-none">Your pick:</span>
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        <Input
          type="number"
          min={0}
          max={30}
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-14 h-8 text-center text-base font-semibold px-1"
          placeholder="0"
        />
        <span className="text-muted-foreground font-bold">–</span>
        <Input
          type="number"
          min={0}
          max={30}
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-14 h-8 text-center text-base font-semibold px-1"
          placeholder="0"
        />
      </div>
      <Button
        size="sm"
        className="h-8 px-3"
        disabled={!isValid || !isDirty || saving}
        onClick={handleSave}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
