"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, updateSettings } from "@/lib/firebase/firestore";
import type { AppSettings } from "@/lib/types";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => { setSettings(s); setLoading(false); });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings({
        reminderHoursBeforeMatch: settings.reminderHoursBeforeMatch,
        maxUsers: settings.maxUsers,
        registrationOpen: settings.registrationOpen,
        currentMatchday: settings.currentMatchday,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return <div className="text-muted-foreground text-sm">Loading settings…</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure pool behaviour.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxUsers">Max Users</Label>
            <Input
              id="maxUsers"
              type="number"
              min={1}
              max={1000}
              value={settings.maxUsers}
              onChange={(e) =>
                setSettings((s) => s && { ...s, maxUsers: Number(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">Maximum number of registered participants.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentMatchday">Current Matchday</Label>
            <Input
              id="currentMatchday"
              type="number"
              min={1}
              value={settings.currentMatchday}
              onChange={(e) =>
                setSettings((s) => s && { ...s, currentMatchday: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Registration Open</p>
              <p className="text-xs text-muted-foreground">Allow new users to sign up.</p>
            </div>
            <button
              role="switch"
              aria-checked={settings.registrationOpen}
              onClick={() =>
                setSettings((s) => s && { ...s, registrationOpen: !s.registrationOpen })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.registrationOpen ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.registrationOpen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Cloud Function sends reminders before each match.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderHours">Reminder Hours Before Match</Label>
            <Input
              id="reminderHours"
              type="number"
              min={0}
              max={48}
              value={settings.reminderHoursBeforeMatch}
              onChange={(e) =>
                setSettings((s) => s && { ...s, reminderHoursBeforeMatch: Number(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}
