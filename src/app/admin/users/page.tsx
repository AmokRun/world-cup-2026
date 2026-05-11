"use client";

import { useState, useEffect } from "react";
import { Users, Shield, ShieldOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, updateUserRole } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import type { AppUser } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then((u) => { setUsers(u); setLoading(false); });
  }, []);

  async function toggleRole(uid: string, currentRole: "admin" | "user") {
    if (uid === currentUser?.uid) {
      toast.error("You cannot change your own role");
      return;
    }
    setTogglingId(uid);
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)),
      );
      toast.success(`User ${newRole === "admin" ? "promoted to admin" : "demoted to user"}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} registered · {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No users found.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((u) => (
            <div
              key={u.uid}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={u.photoURL ?? undefined} />
                <AvatarFallback className="text-xs font-semibold">
                  {initials(u.displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{u.displayName}</p>
                  {u.role === "admin" && (
                    <Badge variant="destructive" className="text-xs px-1.5">Admin</Badge>
                  )}
                  {u.uid === currentUser?.uid && (
                    <Badge variant="outline" className="text-xs px-1.5">You</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="tabular-nums font-medium text-foreground">{u.totalPoints} pts</span>
                <span>{u.predictionsCount} picks</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 text-xs"
                disabled={togglingId === u.uid || u.uid === currentUser?.uid}
                onClick={() => toggleRole(u.uid, u.role)}
              >
                {u.role === "admin" ? (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Revoke Admin</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Make Admin</span>
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
