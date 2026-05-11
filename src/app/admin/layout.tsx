"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Calendar, Users, Settings, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!isAdmin) router.push("/matches");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r p-4 gap-1 shrink-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Shield className="h-4 w-4 text-fifa-red" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
          {adminLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2",
                  (exact ? pathname === href : pathname.startsWith(href)) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
          <Separator className="my-2" />
          <Link href="/matches">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </aside>

        {/* Mobile admin nav */}
        <div className="md:hidden w-full border-b">
          <div className="container flex gap-1 py-2 overflow-x-auto">
            {adminLinks.map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 text-xs shrink-0",
                    (exact ? pathname === href : pathname.startsWith(href)) && "bg-accent",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 container py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
