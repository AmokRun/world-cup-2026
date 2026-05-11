"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Trophy, Target, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";

const schema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name is too long"),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, appUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: appUser?.displayName ?? "" },
  });

  const initials = appUser?.displayName
    ? appUser.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function onSubmit(data: FormData) {
    if (!user) return;
    try {
      await Promise.all([
        updateProfile(user, { displayName: data.displayName }),
        updateUserProfile(user.uid, data.displayName),
      ]);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  }

  const stats = [
    {
      label: "Total Points",
      value: appUser?.totalPoints ?? 0,
      icon: Trophy,
      color: "text-yellow-500",
    },
    {
      label: "Exact Scores",
      value: appUser?.exactScores ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Correct Winners",
      value: appUser?.correctWinners ?? 0,
      icon: Target,
      color: "text-blue-500",
    },
    {
      label: "Wrong Predictions",
      value: appUser?.wrongPredictions ?? 0,
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings.</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={appUser?.photoURL ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{appUser?.displayName}</CardTitle>
              <CardDescription>{appUser?.email}</CardDescription>
              {appUser?.role === "admin" && (
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full px-2 py-0.5 mt-1 inline-block font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">{errors.displayName.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Statistics</CardTitle>
          <CardDescription>
            {appUser?.predictionsCount ?? 0} total predictions submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
