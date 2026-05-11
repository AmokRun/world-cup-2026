import { cn } from "@/lib/utils/cn";

interface TeamDisplayProps {
  name: string;
  flagCode: string;
  align?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", MX: "🇲🇽", BR: "🇧🇷", AR: "🇦🇷", FR: "🇫🇷",
  DE: "🇩🇪", ES: "🇪🇸", PT: "🇵🇹", GB: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", IT: "🇮🇹", NL: "🇳🇱",
  BE: "🇧🇪", HR: "🇭🇷", MA: "🇲🇦", SN: "🇸🇳", JP: "🇯🇵", KR: "🇰🇷",
  AU: "🇦🇺", NG: "🇳🇬", GH: "🇬🇭", CM: "🇨🇲", EC: "🇪🇨", UY: "🇺🇾",
  CO: "🇨🇴", CL: "🇨🇱", PE: "🇵🇪", VE: "🇻🇪", PY: "🇵🇾", BO: "🇧🇴",
  CH: "🇨🇭", AT: "🇦🇹", DK: "🇩🇰", SE: "🇸🇪", NO: "🇳🇴", PL: "🇵🇱",
  CZ: "🇨🇿", RS: "🇷🇸", UA: "🇺🇦", TR: "🇹🇷", IR: "🇮🇷", SA: "🇸🇦",
  QA: "🇶🇦", EG: "🇪🇬", CI: "🇨🇮", TN: "🇹🇳", CN: "🇨🇳", IN: "🇮🇳",
};

export function TeamDisplay({ name, flagCode, align = "left", size = "md" }: TeamDisplayProps) {
  const flag = FLAG_MAP[flagCode] ?? "🏳️";

  const sizeClasses = {
    sm: { flag: "text-lg", name: "text-xs font-medium" },
    md: { flag: "text-2xl", name: "text-sm font-semibold" },
    lg: { flag: "text-3xl", name: "text-base font-bold" },
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <span className={sizeClasses[size].flag} role="img" aria-label={name}>
        {flag}
      </span>
      <span className={cn(sizeClasses[size].name, "leading-tight")}>{name}</span>
    </div>
  );
}
