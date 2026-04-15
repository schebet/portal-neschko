import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialect } from "@/contexts/DialectContext";
import type { DialectZone } from "@/lib/types";

const dialects: { label: string; value: DialectZone }[] = [
  { label: "Стандардни српски", value: "Стандардни српски" },
  { label: "Заплањски дијалект", value: "Заплањски дијалект" },
];

export function DialectBanner() {
  const { dialect, setDialect } = useDialect();

  return (
    <div className="rounded-lg overflow-hidden border border-accent/30">
      {/* Gold/yellow header */}
      <div className="bg-accent px-4 py-3 flex items-center gap-2">
        <Globe className="h-5 w-5 text-accent-foreground" />
        <h3 className="font-serif font-bold text-accent-foreground text-sm">
          Дијалекатски модул
        </h3>
      </div>
      {/* Body */}
      <div className="bg-accent/10 p-4 space-y-2">
        <p className="text-xs text-muted-foreground mb-3">
          Изаберите језички режим за читање:
        </p>
        {dialects.map((d) => (
          <button
            key={d.value}
            onClick={() => setDialect(d.value)}
            className={cn(
              "w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all",
              dialect === d.value
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-foreground hover:bg-accent/20 border border-border"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
