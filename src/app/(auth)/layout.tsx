import { Trophy } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 text-2xl font-bold">
        <Trophy className="h-8 w-8 text-fifa-gold" />
        <span>WC 2026 Pool</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground text-center">
        FIFA World Cup 2026 — June 11 to July 19
      </p>
    </div>
  );
}
